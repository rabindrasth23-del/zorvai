# Zorvai Project Rules

## Supabase Configuration
- **Always use the Supabase project named `supabase-zorvai`** for all database and backend operations in this project.
- The Supabase project name in the dashboard is "zorvai" but is referred to as "supabase-zorvai" by the team.
- **Project Ref:** `kndoposozkemopyuavgb`
- **Region:** `ap-south-1`
- **Database Host:** `db.kndoposozkemopyuavgb.supabase.co`
- **API URL:** `https://kndoposozkemopyuavgb.supabase.co`
- **Status:** ACTIVE_HEALTHY
- **Postgres Version:** 17.6.1.155

> **IMPORTANT:** Never use any other Supabase project. Always use `supabase-zorvai` (project ref: `kndoposozkemopyuavgb`).

## Frontend Build Rules (Standing Instructions — Apply to EVERY Page & Component)

### Design System Enforcement
- **Every component** must use tokens from `design-system/zorvai/MASTER.md` — colors, fonts, spacing, shadows, radii. No hardcoded hex values, no ad-hoc Tailwind defaults outside the system.
- **Check MASTER.md before writing any component** — consistency across the whole app matters as much as the first page.
- If a page-specific override exists at `design-system/zorvai/pages/[page-name].md`, its rules override MASTER.md for that page.

### UI/UX Pro Max Skill
- **Use the `ui-ux-pro-max` skill** for design decisions on every page and component — not just the initial design system phase.
- Run `--design-system` for new pages, `--domain` searches for specific design questions, `--stack nextjs` for implementation guidance.

### Motion (motion/react)
- **Use `motion/react`** (not `framer-motion`) for all animation throughout the frontend.
- Follow the Motion Tiers in MASTER.md: Tier A (key product moments), Tier B (UI feedback), Tier C (page entrance), Tier D (ambient — minimal).
- **Check-in flow override:** `/checkin` and all its result states use MINIMAL, CALM motion only — no spring, no celebration, no high-energy animation. This overrides all other motion rules.
- **Respect `prefers-reduced-motion`** globally — no exceptions, every animated component.

### "use client" Architecture
- **Pages and layouts stay Server Components** — never add `"use client"` to a page or layout.
- **Split animated/interactive elements** into their own small `"use client"` component files.
- If you're about to add `"use client"` to a file that's mostly static content, STOP and split it into a smaller client component instead.

### Typography — LOCKED
- **Fraunces** (variable, optical sizing): Display/headings only
- **Inter**: Body text, UI, buttons, labels — 90% of the interface
- **Geist Mono**: Numbers ONLY (quiz scores, streak counts, session timers, progress %)
- All loaded via `next/font` — no external CSS font imports

### Color Palette — LOCKED
- Primary: `#1B4F5C` (deep indigo-teal)
- Accent: `#FF7A45` (warm coral — CTAs, streaks, mastery)
- Success: `#4A9B7F` (sage green — mastered states)
- Warning: `#D97757` (calm, not alarming — check-in Tier 1/2)
- Background: `#F7F5F2` (warm off-white)
- Text: `#2B2A28` (warm near-black)
- Light mode is default. Dark mode is a toggle, not the default first-load.

### When Unsure
- If unsure whether a component needs Motion or which token applies, **ask the user** rather than defaulting to something outside the locked system.
