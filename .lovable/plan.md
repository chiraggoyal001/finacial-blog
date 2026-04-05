# Language Switch Fix + Junior Page Animations

## 1. Translation System (`src/lib/translations.ts`)
Create a centralized translations file with English and Hindi strings for:
- Navbar labels, search placeholder, login/logout text
- Home page: hero, section headings, CTAs
- Newsletter, Modules, Videos, Events, Junior page headings and descriptions
- Footer: all links, contact info labels
- Common UI: subscribe, feedback, quiz labels
- Legal pages: headings

## 2. Translation Hook (`src/hooks/useTranslation.ts`)
- `useTranslation()` hook that reads `language` from ThemeContext
- Returns `t(key)` function for string lookups
- Fallback to English if key missing

## 3. Update All Pages
Apply `t()` calls to replace hardcoded English strings across:
- Navbar, Footer, SubscribeSection
- Index, NewsletterPage, ModulesPage, VideosPage, EventsPage, JuniorPage
- Article pages (Module, Video, Junior)
- Legal pages (Privacy, Terms, Disclaimer, Grievance, License)
- Login, Signup, Subscribe pages
- QuizSection, FeedbackSection

## 4. Junior Page Animations (using GSAP + animate.css)
- Install `gsap` and `animate.css`
- Add scroll-triggered fade-in/slide-up animations on cards using GSAP ScrollTrigger
- Animated hero section with floating emojis (GSAP timeline)
- Staggered card entrance animations
- Hover micro-interactions on cards (scale + glow)
- Playful bouncing section icons
- Keep all styling within the existing design language (teal primary, coral accent, warm cream bg)

## 5. Files Created/Modified
- **Create**: `src/lib/translations.ts`, `src/hooks/useTranslation.ts`
- **Modify**: All page components, Navbar, Footer, SubscribeSection, QuizSection, FeedbackSection, JuniorPage
