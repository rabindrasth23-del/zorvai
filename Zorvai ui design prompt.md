# Zorvai — Full UI/UX Design Pass (Landing Page, Student Dashboard, Parent Dashboard, Admin Panel)

## Context

All backend logic and data wiring across onboarding, check-in, learn, recall, challenge, feedback, admin panel, and parent dashboard has already been audited and confirmed working with real data — this is a **visual design pass only**. Do not change data logic, API routes, or database queries in this task unless a design change genuinely requires a new field (ask first if so).

Real users are live. This needs to look and feel like a funded, trustworthy edtech product — not a hackathon project — because parents are paying based on how much they trust it, and students need to actually want to open it every day.

## Design Direction: "Hybrid"

One cohesive design system, not two separate designs for mobile and desktop. It should feel equally native and intentional on a phone in one hand and a laptop in a lab — meaning:

- Layouts restructure (not just shrink) between breakpoints — sidebars become bottom nav or a drawer on mobile, multi-column stat rows become stacked cards, tables become card lists on small screens.
- Touch targets, spacing, and font sizes are tuned separately for mobile, not just scaled down from desktop.
- Animations are present on both, but lighter/faster on mobile to protect performance on lower-end Android phones (assume many students are on mid-range or budget Android devices, not flagships).
- Test and show screenshots at both a common laptop width (1440px) and a common phone width (390px) for every page — not just desktop.

Tone per audience:
- **Landing page**: confident, warm, credible — parents and students are both first-time visitors here. Should feel calm and premium, not loud or salesy.
- **Student dashboard**: energetic, encouraging, game-adjacent without being childish — this is a study tool a teenager should want to open daily.
- **Parent dashboard**: calm, clear, trustworthy — data-forward, minimal decoration, nothing that feels like it's trying to sell them something after they've already paid.
- **Admin panel**: dense, functional, fast to scan — this is an internal ops tool, not a marketing surface. Prioritize information density and clarity over visual flourish here.

## Global Rules (apply everywhere, no exceptions)

- Animation library: `motion/react` only — never `framer-motion`.
- Icons: `lucide-react` only — never `@remixicon/react` or inline SVGs pulled from elsewhere.
- Colors/spacing/typography: MASTER.md CSS custom properties only. No hardcoded hex values, no default shadcn tokens like `hsl(var(--primary))` left unmapped to the real palette.
- Every page must work correctly with real empty states (new user, zero sessions, zero linked students) — never design against a fake "populated" state as if it's the default. Show me both the populated and empty state for each major view.
- No leftover demo/placeholder copy from any reused component — every string is real Zorvai content.
- Respect the existing 21st.dev component approvals: stepper, data table, alert/callout, stat card layout are approved and can be re-themed; the FAQ-accordion-as-quiz, Bolt.new-hero-as-chat, single-select-as-multiselect, and the fake voice orb (`ia-siri-chat.tsx` demoMode) are explicitly banned regardless of styling.
- Respect the parent dashboard's data boundary — no design change may surface `mood_text`, `escalation_tier`, `recall_transcript`, or `challenge_qas` on any parent-facing view, even indirectly (e.g., no tooltip, no hover card, no "details" expansion that leaks it).
- Keep Lighthouse performance and accessibility scores in mind — animations should not tank Core Web Vitals; every interactive element needs visible focus states and sufficient color contrast, since this is used by both students and parents on a range of devices.

## Animation Guidance

- Landing page: scroll-triggered reveals for sections, a subtle hero animation, smooth anchor-link scrolling. Nothing that delays the user from reading real content — animation supports the page, it isn't the point of the page.
- Student dashboard: micro-interactions on completing a session/topic (a small celebratory moment, not a full-screen confetti takeover), smooth progress ring fill, gentle hover/tap feedback on cards.
- Parent dashboard: minimal animation — fade/slide on data load, no celebratory or playful motion here. This audience wants clarity, not delight.
- Admin panel: functional only — sort/filter transitions, loading skeletons. No decorative animation.
- Respect `prefers-reduced-motion` globally.

## Per-Page Requirements

### 1. Landing Page
- Real Zorvai value proposition, not generic SaaS boilerplate.
- Clear separation of messaging for students vs. parents (they have different reasons to trust this product) — this can be tabs, a scroll section, or two clear paths, your call on the pattern, but both audiences need to see themselves in it within the first screen.
- Reuse the already-approved mastery-card visual pattern from earlier in this build for consistency with the in-app dashboards.
- Real, working CTAs to signup — no dead links.

### 2. Student Dashboard
- Welcome header, progress ring (already wired to `targetHours × 60`), streak state, session stats, parent-connection/invite code card — redesign these with the hybrid system above, don't change what data they show.
- Make the empty state (new student, zero sessions) feel like an invitation to start, not a blank error-adjacent screen.

### 3. Parent Dashboard
- Stat row (sessions completed, topics mastered, topics re-queued, guarantee status), topic mastery table, session history table, privacy notice.
- This needs to read clearly on a phone — assume many parents will only ever check this on mobile. Tables become stacked cards or an accordion list on small screens, not a horizontally-scrolling table.
- The privacy notice about check-in content never being shared should be visually present, not buried — this is a trust signal, treat it like one.

### 4. Admin Panel
- AI provider metrics (call volume, success rate, latency, per-provider/per-phase stats) — dense, scannable, real-time-feeling.
- This is single-admin, internal-only — desktop-first is acceptable here, but confirm it's still usable on a phone in case you need to check it away from a laptop.

## Process

- One page at a time: landing page first, then student dashboard, then parent dashboard, then admin panel.
- Show real screenshots at both 1440px and 390px for every page, populated and empty states, before moving to the next page.
- Flag anywhere a design decision would require a new backend field or data change, and stop for confirmation before adding it — this task is UI only.
- Confirm before starting: build passes clean (`next build --webpack`, zero TypeScript errors) after each page, not just at the end.