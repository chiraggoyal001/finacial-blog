"""
LangGraph builder — constructs the chat orchestration graph.

v2 graph (with escalation):
    validate_input → escalation_check → fetch_context → rag_search → assemble → END

For URGENT escalation, the graph skips RAG and goes directly to assemble
(the escalation prefix IS the response).
"""

from __future__ import annotations

from langgraph.graph import StateGraph, END

from app.graph.state import ChatState
from app.graph import nodes


def should_continue_after_validation(state: ChatState) -> str:
    """Route based on validation result."""
    if state.get("is_valid") is False:
        return END
    return "escalation_check"


def should_continue_after_escalation(state: ChatState) -> str:
    """
    Route based on escalation level:
    - URGENT → skip RAG, go straight to assemble (empathy response)
    - All others → continue to fetch_context
    """
    level = state.get("escalation_level", "none")
    if level == "urgent":
        return "assemble"  # Skip RAG for urgent cases
    return "fetch_context"


def build_chat_graph() -> StateGraph:
    """
    Build and compile the chat orchestration graph.
    
    v2 Flow:
        validate_input → escalation_check →
            [urgent] → assemble
            [normal] → fetch_context → rag_search → assemble
        → END
    """
    builder = StateGraph(ChatState)

    # Add nodes
    builder.add_node("validate_input", nodes.validate_input)
    builder.add_node("escalation_check", nodes.escalation_check)
    builder.add_node("fetch_context", nodes.fetch_context)
    builder.add_node("rag_search", nodes.rag_search)
    builder.add_node("assemble", nodes.assemble)

    # Set entry point
    builder.set_entry_point("validate_input")

    # Add edges
    builder.add_conditional_edges(
        "validate_input",
        should_continue_after_validation,
        {
            END: END,
            "escalation_check": "escalation_check",
        },
    )

    builder.add_conditional_edges(
        "escalation_check",
        should_continue_after_escalation,
        {
            "assemble": "assemble",
            "fetch_context": "fetch_context",
        },
    )

    builder.add_edge("fetch_context", "rag_search")
    builder.add_edge("rag_search", "assemble")
    builder.add_edge("assemble", END)

    return builder.compile()


# Singleton compiled graph
_graph = None


def get_graph():
    """Get or create the compiled graph singleton."""
    global _graph
    if _graph is None:
        _graph = build_chat_graph()
    return _graph
