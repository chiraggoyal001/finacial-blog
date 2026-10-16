# Product case study: Kamad

## Summary

**Product:** Kamad — financial literacy and interactive learning  
**Live app:** https://kamad.netlify.app/  
**Repository:** https://github.com/chiraggoyal001/finacial-blog  
**Project type:** Independently built product prototype

Kamad explores a connected financial learning journey: discover a topic, understand it, try an interactive example, check comprehension, and continue learning.

This case study describes the product rationale and a plan for validating it. It does not claim that the product has already achieved measurable user or business outcomes.

## 1. Problem framing

Financial education content is often consumed in fragments. Someone might read an article about loans, open another site to calculate an EMI, and then search elsewhere to understand the implications. Moving between these resources can add cognitive load and leave gaps between knowing a definition and applying it.

**Problem statement:** People who are new to personal finance need a clear way to move from a question to an understandable explanation and a practical example, without being pushed into unsuitable financial recommendations.

**Hypothesis:** If financial concepts are connected to calculators, short knowledge checks, and relevant next steps, learners may be better able to understand and apply what they read than when they only consume standalone articles.

**Evidence status:** This is a hypothesis to test, not a validated conclusion.

## 2. Audience and prioritisation

The broader concept considers new learners, young adults, parents and younger learners, and content administrators. Trying to optimise for all of them at once risks making the first experience unfocused.

A sensible discovery starting point would be **new-to-finance young adults who are trying to understand one immediate decision**, such as how loan interest works or how inflation affects savings. This is a proposed starting segment, not a claim that research has already established it as the best segment.

### Questions for discovery

- What financial decision were you trying to understand most recently?
- Where did you look for an explanation?
- What part was confusing or difficult to trust?
- Did you need a calculation, a definition, or help comparing scenarios?
- What did you do after reading?
- What would make you return to the same learning product?

## 3. The user journey

1. **Discover:** find an article or learning module through search, categories, or a recommended path.
2. **Understand:** read an explanation written for the learner's current level.
3. **Apply:** use a calculator or worked example to explore assumptions.
4. **Check:** answer a short question to reveal misunderstandings.
5. **Continue:** visit a relevant next topic, bookmark the material, or attend an educational event.

The product should avoid nudging a learner toward a financial product or investment action simply because they completed a lesson.

## 4. Product choices and trade-offs

| Choice | Why explore it | Trade-off or risk |
|---|---|---|
| Articles plus structured modules | Supports both quick answers and guided learning | More content planning and maintenance |
| Calculators beside explanations | Makes abstract concepts more concrete | Incorrect assumptions or unclear outputs can mislead |
| Quizzes and progress tracking | Gives learners a way to check understanding | Completion and scores can become vanity metrics if poorly designed |
| AI-assisted Q&A grounded in site content | Offers another way to find relevant educational explanations | Retrieval failures, hallucinations, privacy concerns, and ongoing evaluation costs |
| Junior learning area | Makes room for age-appropriate financial education | Requires specific safeguarding, privacy, and age-appropriate design work |
| Admin content management | Helps content updates happen without code changes | Requires reliable permissions, publishing states, review workflows, and auditability |
| Experimentation tools | Can support evidence-based iteration | Bad instrumentation or low traffic can produce misleading conclusions |

## 5. What the prototype explores

The repository includes a React-based web application and a broader set of product surfaces: financial content, learning modules and quizzes, calculators, a junior-focused area, events, an administrative console, analytics/experimentation components, and an AI Q&A backend.

For portfolio discussions, distinguish three things:
- **Implemented:** visible in code and demonstrable in the current build.
- **Configured:** depends on environment variables, Supabase policies, backend availability, or deployment setup.
- **Validated:** tested with representative users or reliable evaluation data.

Do not describe a capability as fully working merely because a component or route exists.

## 6. Success metrics

The first goal should be to establish a baseline and understand task success, not to maximise every metric.

**Primary outcome to test: Learning task success** — the proportion of participants who can correctly explain or apply the target concept after using the learning journey.

This needs a clear rubric and a pre/post or delayed check; a quiz click alone is not sufficient.

Supporting metrics:
- **Findability:** time and success rate for locating a relevant explanation.
- **Comprehension:** change in correct answers from a baseline to a post-learning check.
- **Application:** ability to solve a related scenario with changed assumptions.
- **Content usefulness:** learner-rated clarity and confidence, paired with a task-based measure.
- **AI answer quality:** groundedness, relevance, factual error rate, unsafe-answer rate, and escalation/feedback rate.
- **Operational efficiency:** time for an administrator to publish or correct content.
- **Accessibility and performance:** keyboard task completion, mobile usability, and page performance on representative devices.

## 7. Research and validation plan

### Phase 1 — Understand the problem
Interview 5–8 people from the proposed initial segment. Ask them to walk through a recent real financial-learning task. Avoid leading questions that assume they want a chatbot, gamification, or a calculator.

**Output:** prioritised user problems, current workarounds, and a revised problem statement.

### Phase 2 — Usability test
Ask participants to complete one end-to-end learning task on the prototype. Observe without coaching where possible.

**Capture:** task completion, hesitation points, misunderstood terms, calculator errors, trust concerns, and what participants do next.

### Phase 3 — Measure comprehension
Use a small, reviewed set of concept questions before and after the experience. Include a scenario with different inputs to test transfer rather than memorisation.

**Capture:** baseline performance, immediate change, delayed recall if feasible, and participant feedback.

### Phase 4 — Evaluate AI separately
Create a test set of common questions, ambiguous prompts, outdated-information prompts, requests for personalised financial advice, and adversarial prompts. Have a knowledgeable reviewer assess source relevance, factual correctness, uncertainty, and safety.

**Do not** use user satisfaction alone as evidence that AI responses are accurate or safe.

## 8. Risks and open questions

- Which initial audience has the most frequent and consequential unmet learning need?
- Which single journey creates enough value for a learner to return?
- How will content sources, authorship, review dates, and corrections be managed?
- What happens when the AI retrieval layer finds no relevant source?
- How are personal data, children’s data, and chat histories minimised and protected?
- Which events are actually instrumented and reliable today?
- What evidence is needed before an A/B test can support a product decision?
- What are the real operating costs at the expected level of use?

## 9. Reflection

The project is useful as a product-management case study because it exposes the tension between breadth and focus. Combining content, calculators, learning progress, events, administration, and AI can create a coherent ecosystem, but each surface adds maintenance, quality, privacy, and measurement obligations.

The next product decision should be guided by user evidence: identify one meaningful learning task, test whether the experience helps, and only then decide which parts deserve further investment.
