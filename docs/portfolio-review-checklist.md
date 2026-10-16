# Portfolio review checklist

Use this before making the repository public as a polished PM portfolio project.

## Repository presentation
- [ ] Replace the existing README with the portfolio-focused README.
- [ ] Add the `docs/` files from this package.
- [ ] Remove machine-specific local file paths from documentation.
- [ ] Check spelling and consistent use of the product name (Kamad).
- [ ] Add a short repository description and relevant topics.
- [ ] Ensure links in the README resolve.

## Accuracy
- [ ] Open each major route in the deployed app.
- [ ] Confirm which features work without admin access.
- [ ] Confirm which features require environment variables or external services.
- [ ] Label planned or unverified features accordingly.
- [ ] Remove claims about user growth, conversion, learning improvement, or compliance unless supported by evidence.
- [ ] Review technical claims against the current code rather than relying only on old planning documents.

## Security and trust
- [ ] Search the repository history and current files for secrets and credentials.
- [ ] Verify admin permissions on the server/database, not only in client routes.
- [ ] Review Supabase RLS policies and role assignment.
- [ ] Ensure service-role keys are never exposed in browser code.
- [ ] Check AI request handling, logging, retention, and error paths.
- [ ] Verify financial disclaimers are clear and not presented as a substitute for review.
- [ ] Review privacy and age-appropriate design before presenting the Junior area as production-ready.

## Demo quality
- [ ] Capture current screenshots from the live build.
- [ ] Prepare a two-minute core journey.
- [ ] Prepare a fallback if the chatbot or database is unavailable.
- [ ] Write down one observed limitation and one next experiment.
- [ ] Ensure the demo does not expose personal or administrative data.

## Evidence
- [ ] Conduct at least a small formative usability test if feasible.
- [ ] Record participant/task details and limitations.
- [ ] Validate calculator outputs independently.
- [ ] Test AI responses with a repeatable evaluation set.
- [ ] Report results with denominators and context.
