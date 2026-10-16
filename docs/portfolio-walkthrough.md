# Portfolio walkthrough: Kamad

Use this guide to present the project as a thoughtful product-building exercise, not a list of features or a claim of proven impact.

## 60–90 second introduction

“I built Kamad to explore a question in financial education: can we make it easier for someone to move from reading about a money concept to understanding how it applies in a practical example? The prototype brings together educational content, learning modules, calculators, and an AI-assisted Q&A experience. I’m treating it as an evolving product rather than a validated outcome. The next step I would prioritise is narrowing the audience, testing one end-to-end learning task, and measuring whether people can actually explain or apply the concept afterward.”

## Suggested demo flow

### 1. Start with the learner problem
Describe a specific situation: a beginner wants to understand how a loan term changes monthly payments and total interest.

### 2. Show the discovery path
Demonstrate how a user reaches the relevant article or learning module. Note any friction honestly.

### 3. Show an interactive example
Use a calculator or worked example and explain what the user should learn from changing an input. Clarify assumptions and limitations.

### 4. Show the comprehension step
If a quiz or learning check is available in the current build, show how it tests understanding. Avoid claiming that completion proves learning.

### 5. Explain the AI decision carefully
Describe the intended role of retrieval-grounded Q&A: helping a learner find educational context. Explain that retrieval and guardrails reduce some risks but do not guarantee correctness or regulatory compliance.

### 6. Close with the next product decision
“I would not add more features yet. I would test this journey with a small number of intended users, observe where they struggle, validate the calculator and content, and measure task success before deciding what to build next.”

## Portfolio card copy

**Kamad — Financial Literacy & Interactive Learning**

A deployed product prototype exploring how financial articles, calculators, guided learning, and AI-assisted Q&A might work together to support beginner learning. Focus areas include product framing, user journeys, responsible AI considerations, measurement design, and prioritising validation before expansion.

**Links:** [Live app](https://kamad.netlify.app/) · [GitHub](https://github.com/chiraggoyal001/finacial-blog)

## Resume bullet options

Use only the wording that accurately reflects your contribution and can be defended in an interview.

- Built a financial-literacy web app prototype combining educational content, interactive calculators, structured learning, and AI-assisted Q&A; documented user hypotheses, evaluation risks, and a validation roadmap.
- Developed a product case study for a financial education platform, translating a broad concept into learner journeys, feature trade-offs, proposed success metrics, and prioritised next steps.
- Explored an AI-assisted financial education workflow using retrieval from site content and response checks, while documenting limitations around factual reliability, privacy, and financial-advice boundaries.

Avoid unverified claims such as “increased engagement,” “improved financial literacy,” “achieved product-market fit,” or “fully compliant.”

## Interview prompts to prepare for

- Why combine articles with calculators and learning modules?
- Which audience would you prioritise first, and what evidence would change your mind?
- What would you remove from the current scope to make the first experience clearer?
- How would you measure learning rather than engagement?
- What are the main failure modes of retrieval-augmented Q&A?
- How would you evaluate a financial chatbot's unsafe-answer rate?
- What would you do if usability improved but comprehension did not?
- How would you decide whether to continue investing in this product?

## Before presenting

- Test the exact live flows you plan to demonstrate.
- Prepare a fallback screenshot in case a connected service is unavailable.
- Verify that no secrets, private user data, or admin credentials are visible.
- Distinguish what you personally designed or implemented from what is part of the broader repository.
- Be ready to discuss one trade-off, one limitation, and one next experiment.
