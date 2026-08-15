# Zorvai Design System — Master File

> **LOGIC:** When building a specific page, first check `design-system/zorvai/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Zorvai — AI Study Coach
**Updated:** 2026-08-11
**Design Philosophy:** Trustworthy + Energetic + Premium-Editorial
**Design Dials:** Variance 6/10 | Motion 6/10 | Density 4/10
**Target Audience:** Students (13–18) + Parents
**Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Motion (`motion/react`)

### First-Impression Test

- **Parent (3-second test):** "This is legitimate" — warm, editorial, credible typography, no purple-gradient-AI-startup cliché
- **Student (3-second test):** "This doesn't look like homework" — energetic accent color, confident layout, distinctive but not childish

### What This Is NOT

- ❌ Corporate fintech
- ❌ Purple-gradient AI startup
- ❌ Generic SaaS template
- ❌ Childish/cartoon education app
- ❌ Spreadsheet-dense dashboard

---

## Color Palette — LOCKED (Do Not Override)

### Light Mode (Default)

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Primary | `#1B4F5C` | `--color-primary` | Nav, headers, primary action fills, section backgrounds |
| On Primary | `#FFFFFF` | `--color-on-primary` | Text on primary-colored surfaces |
| Accent | `#FF7A45` | `--color-accent` | CTAs, streaks, mastery/celebration states, key interactive moments |
| Success | `#4A9B7F` | `--color-success` | "Mastered" states, positive feedback, progress completion |
| Warning | `#D97757` | `--color-warning` | Tier 1/2 check-in states — must read calm not alarming |
| Destructive | `#C53030` | `--color-destructive` | Error states, destructive actions only |
| Background | `#F7F5F2` | `--color-bg` | Page background — warm off-white, NOT pure #F5F5F5 |
| Surface | `#FFFFFF` | `--color-surface` | Cards, panels, elevated containers |
| Text | `#2B2A28` | `--color-text` | Body text — warm near-black, NOT pure #1A1A1A |
| Text Muted | `#6B6966` | `--color-text-muted` | Captions, secondary info, timestamps |
| Border | `#E8E5E1` | `--color-border` | Card borders, dividers, input borders |
| Border Focus | `#1B4F5C` | `--color-border-focus` | Focus rings, active input borders |
| Ring | `rgba(27, 79, 92, 0.25)` | `--color-ring` | Focus ring shadow (3px outset) |
| Muted BG | `#F0EDEA` | `--color-muted` | Hover backgrounds, disabled states, skeleton loaders |

### Dark Mode (Toggle, NOT Default)

Dark mode maintains the same hue relationships — not a simple gray inversion.

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#5BA8B8` | `--color-primary` |
| On Primary | `#0F1B1E` | `--color-on-primary` |
| Accent | `#FF9A6C` | `--color-accent` |
| Success | `#6BC4A6` | `--color-success` |
| Warning | `#E09A7E` | `--color-warning` |
| Destructive | `#F56565` | `--color-destructive` |
| Background | `#161514` | `--color-bg` |
| Surface | `#1E1D1B` | `--color-surface` |
| Text | `#EDECE9` | `--color-text` |
| Text Muted | `#9C9A96` | `--color-text-muted` |
| Border | `#2E2D2A` | `--color-border` |
| Border Focus | `#5BA8B8` | `--color-border-focus` |
| Ring | `rgba(91, 168, 184, 0.3)` | `--color-ring` |
| Muted BG | `#242320` | `--color-muted` |

### Color Usage Rules

1. **Primary (#1B4F5C)** carries authority — use for nav, headers, primary buttons, section backgrounds
2. **Accent (#FF7A45)** is the energy — CTAs, streaks, mastery celebrations. Don't overuse; one accent per viewport
3. **Success (#4A9B7F)** for earned achievements only — "mastered" badge, quiz passed, streak maintained
4. **Warning (#D97757)** reads calm, not alarming — used in check-in Tier 1/2 states specifically. Never use red/destructive for check-in states
5. **Contrast minimum:** 4.5:1 for all text. Check dark mode variants independently
6. **Tailwind Utilities:** Colors are mapped to Tailwind theme. Prefer `bg-primary`, `text-accent`, etc. over `bg-[var(--color-primary)]` for new components.


---

## Typography — LOCKED (Do Not Override)

### Font Stack

| Role | Font | Usage | Weight Range |
|------|------|-------|--------------|
| Display / Headings | **Fraunces** (variable, optical sizing) | H1–H4, display text, hero headlines — editorial premium feel | 400–900 |
| Body / UI | **Inter** | Body text, buttons, labels, nav — maximum legibility at all sizes | 400–700 |
| Numbers Only | **Geist Mono** | Quiz scores, streak counts, session timers, progress %, countdown digits | 400–600 |

### Loading Strategy

All fonts loaded via `next/font` (zero layout shift, zero FOUT). No `@import url()` or external CSS font loading.

```tsx
// layout.tsx — exact font setup
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";

// OR if Fraunces is available on Google Fonts:
import { Fraunces } from "next/font/google";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"], // enable optical sizing
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});
```

### Type Scale (CSS Custom Properties)

| Token | Size | Line Height | Weight | Font | Usage |
|-------|------|-------------|--------|------|-------|
| `--text-display-xl` | `4.5rem` / 72px (scales down to 3rem on mobile) | 1.1 | 700 | Fraunces | Hero headlines, massive viewport elements |
| `--text-display` | `3rem` / 48px | 1.1 | 700 | Fraunces | Major page titles |
| `--text-h1` | `2.25rem` / 36px | 1.2 | 600 | Fraunces | Page titles, section headers |
| `--text-h2` | `1.75rem` / 28px | 1.25 | 600 | Fraunces | Section subheadings |
| `--text-h3` | `1.375rem` / 22px | 1.3 | 600 | Fraunces | Card titles, subsection heads |
| `--text-h4` | `1.125rem` / 18px | 1.35 | 600 | Inter | Small headings, labels in sections |
| `--text-body` | `1rem` / 16px | 1.6 | 400 | Inter | Default body text, paragraphs |
| `--text-body-sm` | `0.875rem` / 14px | 1.5 | 400 | Inter | Secondary body, form helper text |
| `--text-caption` | `0.75rem` / 12px | 1.4 | 500 | Inter | Timestamps, meta info, badges |
| `--text-number` | inherit | inherit | 500 | Geist Mono | Scores, counts, timers, % |

### Typography Rules

1. Fraunces carries the "premium editorial" identity — use it for headings and display only, never body text
2. Inter handles 90% of the interface — keep it clean at 400/500/600/700 weights only
3. Geist Mono is a subtle accent — used ONLY for numbers (scores, timers, percentages). Never for code blocks or body text
4. Optical sizing (`font-optical-sizing: auto`) must be enabled on Fraunces — this is what makes it look premium at different sizes
5. Body text minimum: 16px (1rem). Never go below 14px except for captions/timestamps
6. Line heights are generous — this is an editorial-density product, not a dashboard

---

## Spacing System

Density 4/10 — spacious, editorial. Dashboards may use tighter variants where noted.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` / `0.25rem` | Icon-to-label gaps, badge inner padding |
| `--space-2` | `8px` / `0.5rem` | Inline spacing, tight button padding, input inner |
| `--space-3` | `12px` / `0.75rem` | Small card inner padding, list item gaps |
| `--space-4` | `16px` / `1rem` | Standard padding, form field gaps |
| `--space-5` | `20px` / `1.25rem` | Card padding (compact variant) |
| `--space-6` | `24px` / `1.5rem` | Card padding (standard), group spacing |
| `--space-8` | `32px` / `2rem` | Section padding (desktop), large gaps |
| `--space-10` | `40px` / `2.5rem` | Between major page sections |
| `--space-12` | `48px` / `3rem` | Hero section padding, major layout gaps |
| `--space-16` | `64px` / `4rem` | Hero top/bottom padding, page-level vertical rhythm |
| `--space-20` | `80px` / `5rem` | Maximum section spacing (landing/marketing pages only) |

### Spacing Rules

1. Marketing/landing pages use the full range (space-12 to space-20 between sections)
2. Dashboard/app pages run denser: space-6 to space-10 between sections, space-4 to space-6 inside cards
3. Never go denser than space-3 inside interactive elements
4. Mobile reduces section spacing by ~25% (space-12 → space-8, space-16 → space-12)

---

## Shadow System

Warm shadows (not pure black) to match the warm color palette.

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs` | `0 1px 2px rgba(43, 42, 40, 0.04)` | Subtle elevation, inline cards |
| `--shadow-sm` | `0 2px 4px rgba(43, 42, 40, 0.06)` | Buttons resting state |
| `--shadow-md` | `0 4px 12px rgba(43, 42, 40, 0.08)` | Cards, dropdowns |
| `--shadow-lg` | `0 8px 24px rgba(43, 42, 40, 0.10)` | Modals, popovers |
| `--shadow-xl` | `0 16px 40px rgba(43, 42, 40, 0.12)` | Hero feature cards, featured elements |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `6px` | Small buttons, badges, chips |
| `--radius-md` | `10px` | Cards, inputs, standard buttons |
| `--radius-lg` | `16px` | Modals, large cards, panels |
| `--radius-xl` | `24px` | Hero sections, featured containers |
| `--radius-full` | `9999px` | Pills, avatars, circular buttons |

---

## Motion Rules — `motion/react` (Motion Intensity 6/10)

### Architecture Rule: "use client" Boundaries

- **Pages and layouts stay Server Components** — never add `"use client"` to a page or layout just because it contains one animated element
- **Split animated elements** into their own small `"use client"` component files (e.g., `<AnimatedHero />`, `<PhaseTransition />`)
- The page imports and renders the client component — the page itself stays a Server Component
- If you're about to add `"use client"` to a file that's mostly static content, STOP and split it instead

### Global Defaults

```tsx
// Default transition for all motion components
const defaultTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

// Micro-interaction transition (buttons, hovers, taps)
const microTransition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
  mass: 0.5,
};

// Page/section entrance transition
const entranceTransition = {
  type: "spring",
  stiffness: 200,
  damping: 25,
  mass: 1,
};
```

### Motion Tiers

| Tier | Where | What to animate | Duration | Example |
|------|-------|-----------------|----------|---------|
| **A — Key Product Moments** | Session phase transitions (Learn→Recall→Challenge→Feedback), topic mastered, streak milestones | Real transitions: crossfade + slide, spring scale, confetti-like particle burst (tasteful, not bounce-everything) | 300–500ms | `AnimatePresence mode="wait"` with directional slide |
| **B — UI Feedback** | Button hover/tap, card hover, nav transitions, form field focus | Subtle micro-interactions only: scale 0.97–1.03, opacity shifts, shadow elevation | 150–250ms | `whileHover={{ scale: 1.02 }}` `whileTap={{ scale: 0.97 }}` |
| **C — Page Entrance** | Content entering viewport, staggered list items | Fade + subtle translateY (16–24px), staggered with 40–60ms delay each | 300–400ms | `initial={{ opacity: 0, y: 16 }}` `animate={{ opacity: 1, y: 0 }}` |
| **D — Ambient** | Background elements, decorative shapes | Minimal or none. Do NOT scroll-trigger choreography on every card | only if essential | Prefer CSS `@keyframes` over JS-driven ambient animation |

### ⚠️ CHECK-IN FLOW OVERRIDE (Mandatory)

**The check-in flow (`/checkin` and all its result states, especially Tier 1/2) uses MINIMAL, CALM motion regardless of the global intensity-6 setting.**

- **Allowed:** Simple fade transitions (opacity only), gentle content reveals
- **Forbidden:** Spring physics, bounce, scale animations, celebration effects, high-energy movement, particle effects
- **Transition for check-in:** `{ duration: 0.3, ease: "easeOut" }` — NOT spring
- **Rationale:** A student indicating distress must never encounter celebratory or high-energy animation. This overrides every other motion rule in this document

```tsx
// Check-in specific — calm transitions only
const checkinTransition = {
  duration: 0.3,
  ease: "easeOut",
};

// NEVER use these in /checkin:
// ❌ type: "spring"
// ❌ whileHover with scale
// ❌ AnimatePresence with slide/scale
// ❌ any celebration/confetti/burst
```

### Semantic State Accessibility

**Color is NEVER the only indicator of a state change.**
- "Mastered", "Missed", or "Error" states must include a secondary visual indicator: an icon, a distinct shape, or an explicit text label. 
- Do not rely solely on `--color-success` or `--color-warning` to communicate meaning, especially on dense dashboards.


### Reduced Motion

```tsx
// Wrap ALL motion usage with this check
import { useReducedMotion } from "motion/react";

// In component:
const shouldReduceMotion = useReducedMotion();

// Use: initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
```

**No exceptions.** Every animated component must respect `prefers-reduced-motion`. When reduced motion is on, content appears instantly with no animation — don't substitute with opacity-only fades.

---

## Component Specs

### Buttons

```css
/* Primary — accent CTA */
.btn-primary {
  background: var(--color-accent);
  color: #FFFFFF;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: var(--text-body);
  cursor: pointer;
  transition: box-shadow 200ms ease;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  box-shadow: var(--shadow-md);
}

/* Secondary — primary outline */
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1.5px solid var(--color-primary);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 200ms ease;
}

.btn-secondary:hover {
  background: rgba(27, 79, 92, 0.06);
}
```

### Cards

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  box-shadow: var(--shadow-xs);
  transition: box-shadow 200ms ease, border-color 200ms ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-focus);
}
```

### Inputs

```css
.input {
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-body);
  color: var(--color-text);
  background: var(--color-surface);
  transition: border-color 200ms ease, box-shadow 200ms ease;
}

.input:focus {
  border-color: var(--color-border-focus);
  outline: none;
  box-shadow: 0 0 0 3px var(--color-ring);
}
```

### Modals

```css
.modal-overlay {
  background: rgba(43, 42, 40, 0.4);
  backdrop-filter: blur(6px);
}

.modal {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  box-shadow: var(--shadow-lg);
  max-width: 520px;
  width: 92%;
}
```

---

## Layout Guidelines

### Responsive Breakpoints

| Token | Width | Target |
|-------|-------|--------|
| `sm` | `640px` | Large phones landscape |
| `md` | `768px` | Tablets |
| `lg` | `1024px` | Small laptops |
| `xl` | `1280px` | Standard desktops |
| `2xl` | `1440px` | Wide monitors |

### Content Width

- Marketing/landing pages: `max-width: 1200px`, centered
- App/dashboard pages: `max-width: 1024px`, centered (tighter for focused reading)
- Full-bleed sections: no max-width, content inside is still constrained
- Session flow (Learn/Recall/Challenge/Feedback): `max-width: 720px` — focused, reading-optimized width

### Fixed Elements & Offsets

- **Navbar:** The fixed navbar height is defined globally as `--nav-height` (5rem).
- `scroll-padding-top` is applied globally so anchor links jump to the correct offset below the navbar. Do not manually pad anchor targets.


### Variance 6 Layout Principles

1. **Asymmetric hero:** Hero sections may use 55/45 or 60/40 splits, not always centered
2. **Considered whitespace:** Generous but intentional — empty space should direct the eye, not feel unfinished
3. **Visual hierarchy through size contrast:** Display text vs. body text should feel dramatically different (not 24px vs 16px — more like 48px vs 16px)
4. **Break the grid sometimes:** One element per section can "break" the content-width constraint for visual interest (a full-bleed image, an oversized stat, a pulled quote)
5. **Avoid:** perfectly symmetrical 50/50 layouts everywhere, same-size cards in a perfect grid

---

## Anti-Patterns (Do NOT Use)

- ❌ **Emojis as icons** — Use Lucide React icons (`lucide-react`) consistently
- ❌ **Missing cursor:pointer** — All interactive elements must have cursor:pointer
- ❌ **Layout-shifting hover transforms** — Use box-shadow and border-color for hover, not scale that shifts layout
- ❌ **Low contrast text** — 4.5:1 minimum, test both light and dark mode independently
- ❌ **Instant state changes** — Always transition (150–300ms minimum)
- ❌ **Invisible focus states** — Focus ring (3px, var(--color-ring)) on all focusable elements
- ❌ **Generic sans-serif headings** — If it looks like every other SaaS app, the heading font is wrong. Fraunces is the differentiator
- ❌ **Animating everything** — Motion exists for key moments and feedback, not decoration
- ❌ **"use client" on pages/layouts** — Split animated elements into their own client component files
- ❌ **Pure black/white** — Use the warm palette tokens. #000000 and #FFFFFF backgrounds are banned (except --color-surface: #FFFFFF in light mode)
- ❌ **Purple gradient anything** — The palette is indigo-teal + warm coral. There is no purple

---

## Icon System

- **Library:** Lucide React (`lucide-react`)
- **Default size:** 20px (body context), 24px (nav/header context), 16px (inline/caption)
- **Stroke width:** 1.75 (default), 2 for emphasis
- **Color:** inherits from text color via `currentColor`
- **No mixing** icon libraries — Lucide only throughout the app

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] All colors use CSS custom properties, not hardcoded hex
- [ ] Prefer Tailwind classes (`bg-primary`) over arbitrary wrappers (`bg-[var(--color-primary)]`)
- [ ] Fraunces on headings, Inter on body, Geist Mono on numbers — no font drift
- [ ] No emojis as icons (Lucide React only)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150–300ms)
- [ ] Light mode: text contrast 4.5:1 minimum (check --color-text on --color-bg specifically)
- [ ] Dark mode: contrast checked independently
- [ ] Semantic states use secondary indicators (icons/text), not just color
- [ ] Focus rings visible for keyboard navigation (var(--color-ring))
- [ ] `prefers-reduced-motion` respected — every motion component
- [ ] Responsive: 375px → 768px → 1024px → 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
- [ ] All images have descriptive `alt` text
- [ ] All form inputs have explicit labels or `aria-label`
- [ ] `"use client"` only on the smallest possible component, never on pages/layouts
- [ ] Check-in flow uses calm motion only — no spring, no celebration
- [ ] Warm shadows (not pure rgba(0,0,0,...)) — matches palette
- [ ] Page background is var(--color-bg), never pure white or pure black
