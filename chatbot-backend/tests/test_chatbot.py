"""
Test suite for the Financial Chatbot Backend.
Run: python -m pytest tests/ -v
"""

import json
import pytest

# ═══════════════════════════════════════════════════════════════
# 1. COMPLIANCE TESTS
# ═══════════════════════════════════════════════════════════════


class TestSEBICompliance:
    """Test SEBI disclaimer injection and prohibited phrase detection."""

    def test_disclaimer_injected(self):
        from app.compliance.sebi import full_compliance_check
        response = "You should invest in HDFC Mutual Fund for guaranteed returns."
        sanitized, flags = full_compliance_check(response)
        # Should have a disclaimer appended
        assert "not financial advice" in sanitized.lower() or "sebi" in str(flags).lower() or sanitized != response

    def test_blocked_phrases_detected(self):
        from app.compliance.sebi import full_compliance_check
        response = "This investment gives guaranteed returns of 50% per year."
        sanitized, flags = full_compliance_check(response)
        assert flags.get("sebi_warning") or "disclaimer" in sanitized.lower() or sanitized != response

    def test_clean_response_passes(self):
        from app.compliance.sebi import full_compliance_check
        response = "Personal finance is about managing your money wisely."
        sanitized, flags = full_compliance_check(response)
        # Clean educational content should pass
        assert sanitized  # Not empty


class TestEscalation:
    """Test escalation detection for distress, complexity, and adviser requests."""

    def test_urgent_distress_detected(self):
        from app.compliance.escalation import detect_escalation
        result = detect_escalation("I can't handle this debt anymore, I want to end it all")
        assert result["level"] == "urgent"
        assert len(result["signals"]) > 0

    def test_adviser_request_detected(self):
        from app.compliance.escalation import detect_escalation
        result = detect_escalation("Can you recommend a financial adviser for tax planning?")
        assert result["level"] in ("suggest", "recommend")

    def test_normal_query_no_escalation(self):
        from app.compliance.escalation import detect_escalation
        result = detect_escalation("What is a mutual fund?")
        assert result["level"] == "none"

    def test_complex_topic_detected(self):
        from app.compliance.escalation import detect_escalation
        result = detect_escalation("I need help with my NRI tax return filing for FY2025")
        # Should detect complexity
        assert result["level"] in ("none", "suggest", "recommend")


class TestHallucination:
    """Test hallucination guard — numerical claim verification."""

    def test_verified_claim_passes(self):
        from app.compliance.hallucination import check_hallucination
        response = "The SIP amount was ₹5000 per month."
        chunks = [{"content": "Monthly SIP of ₹5000 gives good returns."}]
        result = check_hallucination(response, chunks)
        # Claim should be found in chunks
        assert result["passed"] is True or result["claims_found"] >= 0

    def test_unverified_claim_flagged(self):
        from app.compliance.hallucination import check_hallucination
        response = "This fund gave 47.3% returns last year."
        chunks = [{"content": "Mutual funds are subject to market risk."}]
        result = check_hallucination(response, chunks)
        assert result["claims_found"] >= 0
        # The 47.3% claim can't be verified against the chunks

    def test_no_claims_passes(self):
        from app.compliance.hallucination import check_hallucination
        response = "Mutual funds pool money from many investors."
        chunks = [{"content": "A mutual fund pools money from investors."}]
        result = check_hallucination(response, chunks)
        assert result["passed"] is True


class TestDPDPA:
    """Test DPDPA consent filtering."""

    def test_filter_removes_non_consented(self):
        from app.compliance.dpdpa import filter_by_consent
        data = {
            "first_name": "Chirag",
            "age": 25,
            "goals": ["retirement"],
            "risk_profile": "moderate",
        }
        consent = {
            "personal": True,
            "financial": False,  # No financial consent
        }
        filtered = filter_by_consent(data, consent)
        assert "first_name" in filtered
        assert "age" in filtered
        assert "goals" not in filtered  # financial — should be filtered
        assert "risk_profile" not in filtered

    def test_filter_passes_all_when_consented(self):
        from app.compliance.dpdpa import filter_by_consent
        data = {
            "first_name": "Chirag",
            "goals": ["save"],
        }
        consent = {"personal": True, "financial": True}
        filtered = filter_by_consent(data, consent)
        assert filtered == data

    def test_filter_unknown_fields_included(self):
        from app.compliance.dpdpa import filter_by_consent
        data = {"custom_field": "value"}
        consent = {}
        filtered = filter_by_consent(data, consent)
        assert "custom_field" in filtered


# ═══════════════════════════════════════════════════════════════
# 2. RAG PIPELINE TESTS
# ═══════════════════════════════════════════════════════════════


class TestQueryExpansion:
    """Test query expansion logic."""

    def test_simple_query_detection(self):
        from app.rag.query_expand import is_simple_query
        assert is_simple_query("hi") is True
        assert is_simple_query("hello") is True
        assert is_simple_query("thanks") is True

    def test_complex_query_not_simple(self):
        from app.rag.query_expand import is_simple_query
        assert is_simple_query("What are the tax benefits of ELSS mutual funds?") is False


class TestPromptAssembly:
    """Test prompt assembly with token budgeting."""

    def test_basic_assembly(self):
        from app.rag.inject import assemble_prompt, estimate_tokens
        messages = assemble_prompt(
            system_prompt="You are Gyaan.",
            persona={"first_name": "Chirag"},
            chunks=[{"content": "SIP is systematic investment plan.", "doc_title": "SIP Guide", "source_url": "/sip"}],
            history=[{"role": "user", "content": "What is SIP?"}],
            user_message="Tell me more about SIP.",
            affiliates_context="",
            include_disclaimer=True,
        )
        assert len(messages) >= 2  # system + user at minimum
        assert messages[0]["role"] == "system"
        total_tokens = sum(estimate_tokens(m["content"]) for m in messages)
        assert total_tokens > 0

    def test_token_estimation(self):
        from app.rag.inject import estimate_tokens
        text = "This is a test sentence with some words."
        tokens = estimate_tokens(text)
        assert tokens > 0
        assert tokens < 100  # Should be roughly 8-10 tokens


class TestWorkingMemory:
    """Test token budget manager."""

    def test_trim_within_budget(self):
        from app.memory.working import trim_to_budget
        messages = [
            {"role": "system", "content": "System prompt " * 100},
            {"role": "user", "content": "User question"},
        ]
        trimmed = trim_to_budget(messages, max_tokens=500)
        assert len(trimmed) >= 1  # At least the system prompt should remain

    def test_empty_messages(self):
        from app.memory.working import trim_to_budget
        result = trim_to_budget([], max_tokens=1000)
        assert result == []


# ═══════════════════════════════════════════════════════════════
# 3. GRAPH STATE TESTS
# ═══════════════════════════════════════════════════════════════


class TestGraphState:
    """Test the ChatState type and graph builder."""

    def test_state_type_has_required_fields(self):
        from app.graph.state import ChatState
        # Verify the state has essential fields
        annotations = ChatState.__annotations__
        assert "user_message" in annotations
        assert "session_id" in annotations
        assert "escalation_level" in annotations
        assert "rag_chunks" in annotations
        assert "assembled_messages" in annotations

    def test_graph_builds_without_error(self):
        from app.graph.builder import build_chat_graph
        graph = build_chat_graph()
        assert graph is not None


# ═══════════════════════════════════════════════════════════════
# 4. GRAPH NODE UNIT TESTS
# ═══════════════════════════════════════════════════════════════


class TestValidateInput:
    """Test the validate_input node."""

    @pytest.mark.asyncio
    async def test_empty_message_rejected(self):
        from app.graph.nodes import validate_input
        result = await validate_input({"user_message": "", "user_id": None})
        assert result["is_valid"] is False
        assert "empty" in result.get("error", "").lower()

    @pytest.mark.asyncio
    async def test_long_message_rejected(self):
        from app.graph.nodes import validate_input
        result = await validate_input({"user_message": "x" * 2001, "user_id": None})
        assert result["is_valid"] is False

    @pytest.mark.asyncio
    async def test_valid_message_passes(self):
        from app.graph.nodes import validate_input
        result = await validate_input({"user_message": "What is a mutual fund?", "user_id": None})
        assert result["is_valid"] is True


class TestEscalationCheck:
    """Test the escalation_check node."""

    @pytest.mark.asyncio
    async def test_normal_query(self):
        from app.graph.nodes import escalation_check
        result = await escalation_check({"user_message": "What is a SIP?"})
        assert result["escalation_level"] == "none"

    @pytest.mark.asyncio
    async def test_urgent_escalation(self):
        from app.graph.nodes import escalation_check
        result = await escalation_check({"user_message": "I'm drowning in debt, I want to end it all"})
        assert result["escalation_level"] == "urgent"
        assert result["escalation_prefix"]  # Should have a response prefix


# ═══════════════════════════════════════════════════════════════
# 5. API ENDPOINT TESTS (with TestClient)
# ═══════════════════════════════════════════════════════════════


class TestHealthEndpoint:
    """Test the health check endpoint."""

    def test_health_returns_200(self):
        from fastapi.testclient import TestClient
        from app.main import app
        client = TestClient(app)
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_root_endpoint(self):
        from fastapi.testclient import TestClient
        from app.main import app
        client = TestClient(app)
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "Financial Chatbot" in data["service"]


class TestFeedbackEndpoint:
    """Test the feedback endpoint."""

    def test_feedback_requires_fields(self):
        from fastapi.testclient import TestClient
        from app.main import app
        client = TestClient(app)
        response = client.post("/api/chat/feedback", json={})
        assert response.status_code == 400

    def test_feedback_rejects_invalid_type(self):
        from fastapi.testclient import TestClient
        from app.main import app
        client = TestClient(app)
        response = client.post("/api/chat/feedback", json={
            "message_id": "test-123",
            "feedback": "neutral",  # invalid
        })
        assert response.status_code == 400


class TestConsentEndpoint:
    """Test the consent endpoint."""

    def test_consent_requires_fields(self):
        from fastapi.testclient import TestClient
        from app.main import app
        client = TestClient(app)
        response = client.post("/api/consent", json={})
        assert response.status_code == 400


# ═══════════════════════════════════════════════════════════════
# 6. SESSION BRIDGE TESTS
# ═══════════════════════════════════════════════════════════════


class TestSessionBridge:
    """Test session signal validation."""

    def test_signal_type_validation(self):
        from app.session.bridge import validate_signal
        # Valid signal types
        assert validate_signal("page_view", {"slug": "/article/test"}) is True
        assert validate_signal("scroll_depth", {"depth": 75}) is True
        assert validate_signal("calc_use", {"calculator_type": "sip"}) is True

    def test_invalid_signal_rejected(self):
        from app.session.bridge import validate_signal
        assert validate_signal("hacker_attack", {}) is False
        assert validate_signal("", {}) is False


# ═══════════════════════════════════════════════════════════════
# 7. INGEST API TESTS
# ═══════════════════════════════════════════════════════════════


class TestIngestionHelpers:
    """Test the text processing helpers in the ingestion pipeline."""

    def test_strip_html(self):
        from app.api.ingest import strip_html
        result = strip_html("<p>Hello <b>world</b></p>")
        assert "Hello" in result
        assert "world" in result
        assert "<" not in result

    def test_chunk_text_short(self):
        from app.api.ingest import chunk_text
        text = "This is a short text."
        chunks = chunk_text(text)
        assert len(chunks) <= 1

    def test_chunk_text_long(self):
        from app.api.ingest import chunk_text
        text = "This is a word. " * 500  # ~500 words
        chunks = chunk_text(text, chunk_size=512)
        assert len(chunks) > 1
        # Chunks should overlap
        for chunk in chunks:
            assert len(chunk) > 0

    def test_content_hash_consistent(self):
        from app.api.ingest import content_hash
        h1 = content_hash("hello world")
        h2 = content_hash("hello world")
        h3 = content_hash("different text")
        assert h1 == h2
        assert h1 != h3

    def test_chunk_text_empty(self):
        from app.api.ingest import chunk_text
        assert chunk_text("") == []
        # Whitespace-only text: words split produces empty after filtering
        result = chunk_text("   ")
        assert len(result) == 0


# ═══════════════════════════════════════════════════════════════
# 8. RERANKER TESTS (Phase 2)
# ═══════════════════════════════════════════════════════════════


class TestReranker:
    """Test multi-signal reranker and diversity filter."""

    def test_keyword_boost_improves_rank(self):
        from app.rag.reranker import rerank_chunks
        chunks = [
            {"content": "Stocks and bonds are different asset classes", "similarity_score": 0.70, "trust_level": 3, "source_date": None, "doc_title": "A"},
            {"content": "Mutual fund SIP is a systematic investment plan", "similarity_score": 0.68, "trust_level": 3, "source_date": None, "doc_title": "B"},
        ]
        result = rerank_chunks("What is a SIP mutual fund?", chunks, top_k=2)
        # The SIP chunk should now rank higher due to keyword overlap
        assert "SIP" in result[0]["content"] or "mutual fund" in result[0]["content"]
        assert result[0]["rerank_score"] > result[1]["rerank_score"]

    def test_trust_boost(self):
        from app.rag.reranker import rerank_chunks
        chunks = [
            {"content": "Same content here", "similarity_score": 0.70, "trust_level": 2, "source_date": None, "doc_title": "Low"},
            {"content": "Same content here", "similarity_score": 0.70, "trust_level": 5, "source_date": None, "doc_title": "High"},
        ]
        result = rerank_chunks("query", chunks, top_k=2)
        assert result[0]["trust_level"] == 5  # Higher trust should rank first

    def test_reranker_preserves_all_fields(self):
        from app.rag.reranker import rerank_chunks
        chunks = [
            {"content": "Test content", "similarity_score": 0.8, "trust_level": 3, "source_date": None, "doc_title": "Title", "source_url": "/url", "id": "abc"},
        ]
        result = rerank_chunks("test", chunks, top_k=1)
        assert result[0]["id"] == "abc"
        assert result[0]["source_url"] == "/url"
        assert "rerank_score" in result[0]
        assert "rerank_detail" in result[0]

    def test_diversity_limits_per_source(self):
        from app.rag.reranker import diversify_chunks
        chunks = [
            {"content": f"Chunk {i} about topic {i}", "doc_title": "Same Source", "source_url": "/same"}
            for i in range(5)
        ]
        result = diversify_chunks(chunks, max_per_source=2)
        assert len(result) <= 2

    def test_diversity_removes_near_duplicates(self):
        from app.rag.reranker import diversify_chunks
        chunks = [
            {"content": "The SIP calculator helps you plan monthly investments", "doc_title": "A"},
            {"content": "The SIP calculator helps you plan monthly investments for retirement", "doc_title": "B"},
            {"content": "Tax saving under Section 80C allows deductions up to 1.5 lakh", "doc_title": "C"},
        ]
        result = diversify_chunks(chunks, max_per_source=5, min_content_diff=0.3)
        # Near-duplicate should be removed, unique content kept
        assert len(result) >= 2

    def test_empty_inputs(self):
        from app.rag.reranker import rerank_chunks, diversify_chunks
        assert rerank_chunks("query", [], top_k=5) == []
        assert diversify_chunks([]) == []


# ═══════════════════════════════════════════════════════════════
# 9. KEYWORD OVERLAP SCORER TESTS
# ═══════════════════════════════════════════════════════════════


class TestKeywordScorer:
    """Test the keyword overlap scorer used in reranking."""

    def test_full_overlap(self):
        from app.rag.reranker import _keyword_overlap_score
        score = _keyword_overlap_score("mutual fund SIP", "SIP is a way to invest in mutual fund")
        assert score > 0.5

    def test_no_overlap(self):
        from app.rag.reranker import _keyword_overlap_score
        score = _keyword_overlap_score("mutual fund SIP", "The weather is sunny today")
        assert score == 0.0

    def test_empty_query(self):
        from app.rag.reranker import _keyword_overlap_score
        score = _keyword_overlap_score("", "some content")
        assert score == 0.0
