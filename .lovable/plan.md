

# Separate Quiz and Feedback into Two Distinct Sections

## Summary
Currently, all three article pages (Module, Video, Junior) combine quiz and feedback into a single section with just a rating + textarea. The user wants these split into:
1. **Quiz section** — MCQ questions about the content the reader just consumed
2. **Feedback section** — the existing rating + comment form (already built)

## Affected Pages
- `src/pages/ModuleArticlePage.tsx`
- `src/pages/VideoArticlePage.tsx`
- `src/pages/JuniorArticlePage.tsx`

## Data Changes

**`src/lib/types.ts`** — Add quiz question types:
```ts
interface QuizOption { label: string; isCorrect: boolean; }
interface QuizQuestion { id: string; question: string; options: QuizOption[]; }
```
Add `quizQuestions?: QuizQuestion[]` to `Chapter`, `VideoChapter`, and `JuniorChapter` interfaces.

**`src/lib/data.ts`** — Add 2-3 dummy MCQ questions per chapter in modules, videos, and junior data.

## UI Changes (all three article pages)

Replace the combined "Quiz & Feedback" block with two separate sections:

### 1. Quiz Section
- Heading: "Quiz" (with a brain/lightbulb icon)
- Renders each MCQ question with radio-button options (A/B/C/D)
- "Check Answers" button that reveals correct/incorrect highlighting (green border for correct, red for wrong)
- Shows score summary (e.g., "2/3 correct")

### 2. Feedback Section
- Heading: "Feedback"
- Keep existing star rating + textarea + submit flow unchanged

Both sections separated by a border divider.

## State Changes
- Add `quizAnswers: Record<string, string>` and `quizSubmitted: boolean` state per page
- Keep existing `feedback`, `quizAnswer` (rename to `rating`), `submitted` for the feedback section
- Reset both on chapter change

## Technical Details
- Create a reusable `QuizSection` component in `src/components/QuizSection.tsx` to avoid duplicating MCQ logic across three pages
- Create a reusable `FeedbackSection` component in `src/components/FeedbackSection.tsx` for the rating + comment form
- Junior page version uses the existing playful card styling with `Sparkles` icon

