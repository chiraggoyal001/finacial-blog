# Measurement and validation plan

This document separates proposed success measures from evidence currently available. No outcome should be reported as achieved until the relevant instrumentation and research have been completed and checked.

## 1. North-star candidate

**Successful learning task rate:** the percentage of observed learners who complete a target task and correctly explain or apply the concept using a pre-agreed rubric.

A successful task should require more than opening an article, completing a module, or clicking a calculator.

Suggested formula:

`Successful learning task rate = participants meeting the task rubric / participants who attempted the task`

Report the numerator, denominator, task definition, audience, and test conditions alongside the percentage.

## 2. Metric tree

| Level | Metric | What it helps answer | Important caveat |
|---|---|---|---|
| Outcome | Correct explanation/application after learning | Did the learner understand the concept? | Needs a reviewed rubric and comparable task |
| Findability | Successful topic discovery | Could the learner find the right content? | Search clicks do not prove success |
| Comprehension | Pre/post knowledge check | Did understanding change? | Questions must test understanding, not just recall |
| Transfer | Correct answer to a changed scenario | Can the learner apply the concept elsewhere? | Use a different example to reduce memorisation |
| Engagement | Module completion, return visits, bookmarks | Did the learner continue interacting? | Engagement is not the same as learning |
| Calculator quality | Correct outputs and user interpretation | Are calculations reliable and understood? | Validate formulas independently |
| AI quality | Groundedness, relevance, factual errors, unsafe responses | Does Q&A help without introducing unacceptable risk? | Needs human review and a defined test set |
| Content operations | Time and errors per publishing task | Can content be maintained efficiently? | Compare equivalent tasks |
| Reliability | Failed requests, latency, service availability | Does the experience work consistently? | Segment by route and dependency |
| Accessibility | Task completion with keyboard and assistive technology | Can users access core flows? | Automated checks are not sufficient alone |

## 3. Initial study design

Recruit 5–8 people who fit the proposed initial audience for formative usability work. This is useful for identifying qualitative friction, not estimating population-level outcomes.

### Example task

“Explain how changing the loan term affects the monthly payment and total interest. Use the learning page and calculator to compare two terms, then explain the trade-off in your own words.”

Observe whether participants:
- Find the relevant explanation without assistance.
- Enter appropriate inputs.
- Understand the assumptions and result labels.
- Explain the trade-off correctly.
- Recognise that the calculation is an illustration rather than a loan offer.

### Before-and-after knowledge check

- Write questions with a finance subject-matter reviewer.
- Use a baseline question and a comparable post-task question.
- Include a changed-input scenario to test application.
- If feasible, repeat a short check after several days to explore retention.
- Record missing data and participant drop-off rather than silently excluding them.

A small study can reveal usability problems and generate hypotheses. It cannot, by itself, establish broad causal impact.

## 4. AI Q&A evaluation

Build a versioned evaluation set before tuning prompts or filters. Include:
1. Common beginner questions answerable from published content.
2. Questions with multiple related articles.
3. Questions where the site has no suitable answer.
4. Ambiguous questions requiring clarification.
5. Time-sensitive questions that require an up-to-date source.
6. Requests for personalised financial advice or specific buy/sell recommendations.
7. Adversarial prompts that attempt to bypass system boundaries.
8. Questions involving sensitive personal information.

For each response, review:
- Was relevant source material retrieved?
- Does the answer accurately reflect that material?
- Are claims unsupported by the source clearly qualified or omitted?
- Does the system appropriately decline or redirect unsuitable requests?
- Are uncertainty and the limits of the tool clear?
- Does the response expose unnecessary personal data?

Track both failure rate and severity. A low average error rate can hide a small number of high-severity failures.

## 5. Experimentation checklist

Before interpreting an A/B test:
- Define one primary hypothesis and one primary metric.
- Define the eligible audience and assignment unit.
- Confirm assignment is stable for the intended experiment.
- Log exposure only when the variant was actually shown.
- Prevent duplicate view, click, and conversion events.
- Define exclusions and the analysis window before looking at results.
- Check sample size and statistical uncertainty.
- Avoid repeatedly checking results and stopping as soon as a favourable number appears.
- Review guardrail metrics such as errors, accessibility, and unsafe AI responses.
- Record the decision and what would change the decision.

If traffic is too low for a reliable experiment, prefer moderated usability sessions or qualitative feedback rather than presenting a noisy conversion difference as a win.

## 6. Data and privacy considerations

Collect only the events needed to answer a defined product question. Avoid logging full chatbot conversations or sensitive financial details in analytics by default. Establish retention and access policies, provide appropriate notice and consent, and review any additional obligations that apply to younger users.

## 7. Evidence log template

- **Question:** What uncertainty were we trying to reduce?
- **Hypothesis:** What did we expect and why?
- **Participants / traffic:** Who was included, and how were they recruited or assigned?
- **Method:** Interview, usability test, calculation audit, AI evaluation, or experiment.
- **Primary measure:** What was defined before the test?
- **Result:** Include numerator, denominator, and uncertainty where applicable.
- **Observed failures:** What did not work?
- **Limitations:** What can this study not tell us?
- **Decision:** Keep, change, investigate, or stop.
- **Next step:** What evidence is needed next?

## Current evidence status

The repository documents product surfaces and technical components. This document is a proposed measurement plan, not a report of completed user research or verified product outcomes.
