# ZORVAI — COMPLETE DASHBOARD PROMPTS
# Student Dashboard + Parent Dashboard + Admin Dashboard
# Full routes, workflow, connecting logic, layout
# Paste each section directly into Cursor or Antigravity

---

## DESIGN SYSTEM (same across all three dashboards)

```
Colors:
--bg:           #161514    page background
--surface:      #1c1b19    card background
--raised:       #252320    elevated / hover
--border:       #2a2826    all borders
--border-hi:    #3a3835    active borders
--text:         #f0ede8    primary text
--muted:        #8a8680    secondary text
--dim:          #5a5753    placeholder / disabled
--teal:         #4ecdc4    primary accent
--teal-bg:      rgba(78,205,196,0.08)
--teal-border:  rgba(78,205,196,0.2)
--amber:        #fbbf24    warning
--success:      #4ade80    passed / good
--danger:       #f87171    failed / alert
--purple:       #a78bfa    science subject color
--blue:         #60a5fa    english subject color

Typography: system-ui, -apple-system, sans-serif. No Google Fonts.
Border radius: 14px cards, 10px inner elements, 99px pills
No box shadows — use border + background contrast for depth
No bold accent words in headings — let structure do the work
One animation only: page-load fade-up on first render
```

---

## ROUTE SYSTEM (Next.js App Router)

```
app/
├── (auth)/
│   ├── login/page.jsx
│   └── signup/page.jsx
│
├── (student)/
│   ├── layout.jsx                    ← student sidebar + auth guard
│   ├── dashboard/page.jsx            ← /dashboard
│   ├── session/page.jsx              ← /session (live voice/text)
│   ├── chat/page.jsx                 ← /chat (always-on chatbot)
│   ├── plan/page.jsx                 ← /plan (7-day study plan)
│   ├── progress/page.jsx             ← /progress
│   └── settings/page.jsx             ← /settings
│
├── (parent)/
│   ├── layout.jsx                    ← parent sidebar + auth guard
│   ├── parent/dashboard/page.jsx     ← /parent/dashboard
│   ├── parent/progress/page.jsx      ← /parent/progress
│   ├── parent/community/page.jsx     ← /parent/community
│   ├── parent/guarantee/page.jsx     ← /parent/guarantee
│   ├── parent/billing/page.jsx       ← /parent/billing
│   └── parent/settings/page.jsx      ← /parent/settings
│
├── (admin)/
│   ├── layout.jsx                    ← admin sidebar + admin auth guard
│   ├── admin/page.jsx                ← /admin (overview)
│   ├── admin/users/page.jsx          ← /admin/users
│   ├── admin/sessions/page.jsx       ← /admin/sessions
│   ├── admin/waitlist/page.jsx       ← /admin/waitlist
│   ├── admin/revenue/page.jsx        ← /admin/revenue
│   ├── admin/content/page.jsx        ← /admin/content (curriculum)
│   └── admin/flags/page.jsx          ← /admin/flags (safety alerts)
│
└── api/
    ├── auth/
    ├── waitlist/
    ├── sessions/
    ├── progress/
    ├── community/
    ├── admin/
    └── payments/
```

### Auth guard middleware (middleware.js)

```javascript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const path = req.nextUrl.pathname

  // Not logged in → redirect to login
  if (!session && !path.startsWith('/login') && !path.startsWith('/signup') && !path.startsWith('/waitlist')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Logged in → check role and redirect to correct dashboard
  if (session) {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    // Student trying to access parent routes
    if (user?.role === 'student' && path.startsWith('/parent')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Parent trying to access student routes
    if (user?.role === 'parent' && path === '/dashboard') {
      return NextResponse.redirect(new URL('/parent/dashboard', req.url))
    }

    // Non-admin trying to access admin routes
    if (user?.role !== 'admin' && path.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
```

---

---

# STUDENT DASHBOARD PROMPT

Build all student pages. Start with app/(student)/layout.jsx then each page.

## STUDENT LAYOUT (app/(student)/layout.jsx)

```jsx
Build the persistent student layout with a sidebar on desktop and bottom navigation on mobile.

SIDEBAR (desktop — 220px fixed left):
Background: #161514. Border-right: 1px solid #2a2826. Height: 100vh. Position: sticky, top 0.

Top section:
- "Zorvai" text + 5px teal dot. Padding: 20px. Border-bottom: 1px solid #2a2826.

Navigation items (padding 10px 8px):
Each item is a row: icon (18px SVG inline, stroke-based) + label (14px).
Default: color #8a8680, background transparent, border-radius 10px.
Hover: color #f0ede8, background #1c1b19.
Active: color #4ecdc4, background rgba(78,205,196,0.08), left border 2px solid #4ecdc4.
Transition: all 150ms ease.

Items:
1. Dashboard (home icon) → /dashboard
2. Today's Session (play icon) → /session
3. My Plan (calendar icon) → /plan
4. Chat (message icon) → /chat
5. Progress (chart icon) → /progress
6. Settings (gear icon) → /settings

Bottom of sidebar:
Student avatar (36px circle, initials, color from name) + name + "Student" label.
Get from Supabase auth session.

BOTTOM NAV (mobile only, below 768px):
Fixed bottom. Background #161514. Border-top: 1px solid #2a2826.
5 icons only (Dashboard, Session, Plan, Chat, Progress). No labels.
Active icon: color #4ecdc4.

MAIN CONTENT AREA:
Margin-left: 220px desktop, 0 mobile. Min-height: 100vh.
Padding: 32px 40px desktop, 20px 16px mobile. Background: #161514.
Max-width of content inside: 1040px.

Page enter animation (runs once on mount):
opacity 0 → 1, translateY 12px → 0. Duration: 400ms, cubic-bezier(0.16,1,0.3,1).
```

---

## STUDENT DASHBOARD PAGE (app/(student)/dashboard/page.jsx)

```jsx
Build the main student dashboard page at /dashboard.

Fetch on load:
- GET /api/progress/student/[id] → session history, mastery, goal, streak
- GET /api/sessions/today → today's planned topic
- GET /api/reviews/due/[id] → spaced repetition reviews due today

DATA TO DISPLAY:

SECTION 1 — GREETING ROW (top of page)
Left: "Good [morning/afternoon/evening], [firstName]" — 22px, font-weight 500.
Time-based greeting using new Date().getHours().
Below: one context line in #8a8680, 14px.
Logic:
- If streak > 0: "Day [streak] streak — keep it going 🔥"
- If has session today: "Today's topic: [topicName]"
- If no session: "Rest day — next session is [dayName]"

Right: streak badge — "[streak] day streak 🔥"
Background rgba(251,191,36,0.1), color #fbbf24, padding 6px 14px,
border-radius 99px, font-size 13px, font-weight 600.

SECTION 2 — TODAY'S SESSION CARD (full width, most important element)
Background: #1c1b19. Border: 1px solid #2a2826. Border-radius: 14px.
Border-left: 3px solid #4ecdc4 (left accent strip).
Padding: 22px 26px. Display: flex, justify-content: space-between, align-items: center.

Left side:
- Small label "TODAY" in #8a8680, 11px, letter-spacing 0.06em.
- Topic name: 22px, font-weight 600, color #f0ede8, margin-top 4px.
- Subject + day: "Biology · Day 3 of 7" in #8a8680, 14px, margin-top 2px.
- Estimated time: "~45 min" in #5a5753, 13px.
- Phase chips row (Learn · Recall · Challenge):
  Each chip: background #252320, color #5a5753, padding 3px 10px,
  border-radius 6px, font-size 12px. All dim — session not started yet.

Right side:
"Start Session" button.
Background #4ecdc4, color #161514, font-weight 600, font-size 14px,
padding 11px 24px, border-radius 9px, border none.
On click: navigate to /session.
On hover: background #3db8b0, transition 150ms ease.

If no session today: show "Rest day — your next session is [day]" in the card instead.
If session already completed today: show a green checkmark + "Session complete · [topic]".

SECTION 3 — THREE STAT CARDS (equal width, gap 14px)
Card style: background #1c1b19, border 1px solid #2a2826,
border-radius 14px, padding 18px 20px.
On mount: stagger fade-up with 80ms delays between cards.
On hover: translateY -2px, border-color #3a3835, transition 200ms ease.

Card 1 — Streak:
Label "Current streak" in #8a8680, 12px.
Value "[n] days" in #f0ede8, 26px, font-weight 600.
The number counts up from 0 to actual value on mount (600ms, ease-out).
Subtext "🔥 Best: [bestStreak] days" in #8a8680, 13px.

Card 2 — Sessions this month:
Label "Sessions this month" in #8a8680, 12px.
Value "[completed]" in #f0ede8, 26px, font-weight 600.
Progress bar below: [completed]/[planned] ratio.
Height 4px, background #252320, fill #4ecdc4, border-radius 99px.
Bar fills from 0 to actual width on mount (800ms, ease-out).
Subtext "[completed] of [planned] planned" in #8a8680, 13px.

Card 3 — Guarantee:
Label "Improvement guarantee" in #8a8680, 12px.
Value: "On track ✓" in #4ade80 if sessions >= 8 of 12.
Or "Behind schedule" in #fbbf24 if sessions < 8 with < 15 days left.
Or "Qualified ✓" in #4ecdc4 if sessions >= 12.
Subtext: "[n] of 12 sessions · [daysLeft] days left" in #8a8680, 13px.

SECTION 4 — SEVEN-DAY PLAN STRIP (full width, horizontal)
Label "This week" in #f0ede8, 14px, font-weight 500, margin-bottom 12px.
Seven day columns. Horizontal scroll on mobile.

Each day column:
Width flex 1. Min-width 80px. Text-align center.
Day abbr: "MON" in #8a8680, 11px, letter-spacing 0.06em.
Date number: in #f0ede8, 14px, margin-top 2px.

Session pill below date (if session exists):
Completed: background #252320, border-left 3px solid #4ade80,
topic name truncated in #8a8680, font-size 12px, border-radius 4px, padding 4px 8px.
Today: background rgba(78,205,196,0.08), border-left 3px solid #4ecdc4,
topic in #4ecdc4, font-size 12px.
Upcoming: background #1c1b19, border 1px dashed #2a2826,
topic in #5a5753, font-size 12px.
Rest day: a small "—" in #3a3835, centered.

Today's column: 2px solid teal line at very top, above the day abbr.
This line draws in from left on mount: scaleX 0 → 1, 600ms, 300ms delay.

SECTION 5 — TWO COLUMN LAYOUT (below plan strip)

LEFT COLUMN (60% width):
WEAK TOPICS CARD
Background #1c1b19, border #2a2826, border-radius 14px, padding 20px.
Header: "Focus areas" in #f0ede8, 15px, font-weight 600.
Subtext: "Based on your last 3 sessions" in #8a8680, 12px, margin-top 2px.

List of up to 3 weak topics. Each row:
- Subject color dot (4px circle: Math=#fbbf24, Biology=#4ecdc4,
  English=#a78bfa, Science=#60a5fa)
- Topic name in #f0ede8, 14px
- "Missed last session" in #8a8680, 12px
- "Review →" link in #4ecdc4, 13px — on click navigate to /chat with topic pre-loaded
Divider: 1px solid #252320 between rows.

Empty state: "No weak topics yet — great work so far" in #8a8680, 13px, centered.

RIGHT COLUMN (40% width):
RECENT SESSIONS CARD
Background #1c1b19, border #2a2826, border-radius 14px, padding 20px.
Header: "Recent sessions" in #f0ede8, 15px, font-weight 600.

List of last 4 sessions. Each row:
- Topic name in #f0ede8, 14px
- Subject in #8a8680, 12px
- Right: result chip:
  Passed: "Passed" in #4ade80, background rgba(74,222,128,0.08), padding 2px 8px, border-radius 6px
  Missed: "Missed" in #f87171, background rgba(248,113,113,0.08), padding 2px 8px, border-radius 6px
- Below topic: relative time in #5a5753, 12px ("2 days ago")
Divider between rows.

SECTION 6 — GOAL CARD (full width, bottom)
Background rgba(78,205,196,0.05), border 1px solid rgba(78,205,196,0.15),
border-radius 14px, padding 20px 24px.
Display flex, justify-content space-between, align-items center.

Left:
Small label: "YOUR GOAL THIS MONTH" in #4ecdc4, 11px, letter-spacing 0.06em.
Goal text in #f0ede8, 16px, font-weight 500, font-style italic, margin-top 6px.
"Set [n] days ago" in #8a8680, 12px, margin-top 4px.

Right:
Circular progress ring, 60px diameter.
SVG: outer ring stroke #252320, inner ring stroke #4ecdc4, strokeWidth 5.
Center text: "[%]" in #f0ede8, 14px, font-weight 600.
Ring animates on mount: strokeDashoffset from full to actual value, 1200ms, 400ms delay.
"of sessions done" below ring in #8a8680, 11px.

CHATBOT BUTTON (floating, fixed position):
Bottom 24px, right 24px. 52px circle.
Background #4ecdc4. Message SVG icon in #161514, 22px.
On hover: scale(1.08), box-shadow 0 8px 24px rgba(78,205,196,0.35).
Transition: all 200ms cubic-bezier(0.34,1.56,0.64,1).
On click: navigate to /chat.
Entrance animation on page load: slides in from bottom-right, 800ms delay.
translateX(80px) translateY(80px) opacity 0 → all 0 opacity 1.
```

---

## SESSION PAGE (app/(student)/session/page.jsx)

```jsx
Build the live study session page at /session.
Full screen, no sidebar. Focused mode.

LAYOUT:
Minimal header: "Zorvai" left + "End session" right (#8a8680, 13px, cursor pointer).
On "End session" click: confirm dialog then navigate to /dashboard.
Max-content-width: 640px, centered. Padding: 32px 24px.

PHASE INDICATOR (top):
Four steps in a horizontal row: Learn · Recall · Challenge · Feedback.
Connected by a line that fills left to right as phases complete.
Active step: #4ecdc4 text + 3px teal dot above it.
Completed steps: checkmark ✓ + #8a8680.
Upcoming: #5a5753.
Line transition: width 0 → 100% over 400ms when advancing.

TIMER (center of page):
SVG circle, 200px diameter.
Outer ring: stroke #252320, strokeWidth 6.
Progress ring: stroke #4ecdc4, strokeWidth 6.
Animates counterclockwise as time passes.
Center: "[MM:SS]" countdown in #f0ede8, 24px, font-family monospace.
Below: current phase label in #8a8680, 12px.

AI SPEAKING INDICATOR:
Three bars centered below timer. Heights animate up/down independently.
Color #4ecdc4, bar width 4px, gap 6px.
Animation: voiceWave keyframe, stagger 100ms between bars.
When AI silent: bars at flat 4px height, transition 100ms ease.

AI MESSAGE AREA:
Below wave indicator. Background #1c1b19, border-radius 14px, padding 18px.
Max-height: 200px, overflow-y auto. Color #f0ede8, font-size 15px, line-height 1.7.
New text appears with typewriter effect: 20ms per character, JavaScript interval.

RECALL PHASE:
Timer resets to 5:00.
AI message: "Close your notes. Tell me everything you remember."
AI speaking indicator goes flat (silent).

MICROPHONE BUTTON (Recall + Challenge):
64px circle, centered.
Background rgba(78,205,196,0.12), border 2px solid #4ecdc4.
Mic SVG icon, 28px, color #4ecdc4.
Recording state: background #4ecdc4, icon color #161514.
Ripple rings: expanding circles rgba(78,205,196,0.3) at 0ms, 200ms, 400ms delay.

Transcript: student speech appears below in #8a8680, italic, real-time.

CHALLENGE PHASE:
"Question [n] of 4" label in #8a8680, 12px.
Question text in #f0ede8, 20px, font-weight 500, centered.
Fades in fresh for each question.
4 progress dots below: filled teal = answered, empty = remaining.
Current dot slightly larger (pulse animation).

FEEDBACK PHASE:
Three sections animate in sequentially (stagger 200ms):

"What you nailed ✅"
Each item: #4ade80 dot + text. Fade-up on enter.

"What to revisit 📌"
Each item: #fbbf24 dot + text.

"What you missed ❌" (if any)
Each item: #f87171 dot + text.

PASS state:
Confetti burst — 12 small squares from center, rotate, fade. 800ms CSS animation.
"Moving on to next topic →" button in teal.

FAIL state:
No confetti. "Let's review the weak spots →" button in secondary style.

STUDENT INPUT (fixed bottom, Learn phase only):
Background #1c1b19, border 1px solid #2a2826, border-radius 14px.
Placeholder: "Ask a question..."
Mic icon right side — pulses teal when recording.
Send button: teal circle, appears on text input.

Voice: browser Web Speech API.
const recognition = new window.SpeechRecognition()
recognition.continuous = true
recognition.interimResults = true
recognition.lang = studentLanguage
```

---

## CHAT PAGE (app/(student)/chat/page.jsx)

```jsx
Build the always-on AI chatbot at /chat.
Same sidebar layout. Main area is a full-height chat interface.
Max-width: 680px, centered in main area.

CHAT AREA:
Height: calc(100vh - 56px - input height). Overflow-y auto.
Padding: 24px. Messages from bottom.

STUDENT MESSAGE:
Right-aligned. Background #4ecdc4. Color #161514.
Border-radius 14px 14px 4px 14px. Padding 11px 15px.
Max-width 75%. Entrance: slides from right, 200ms.

AI MESSAGE:
Left-aligned. Background #1c1b19. Color #f0ede8.
Border 1px solid #2a2826. Border-radius 14px 14px 14px 4px.
Padding 14px 18px. Max-width 80%.
Text appears with typewriter effect (20ms per char).

TYPING INDICATOR:
Three dots bouncing with stagger. Same left-aligned bubble.
Dot: 6px circle, background #8a8680.
Animation: translateY -6px → 0, 500ms, stagger 150ms, infinite.

IMAGE MESSAGE:
Student photo shown inline above text in bubble. Border-radius 10px.

INPUT AREA (fixed bottom):
Background #161514. Border-top 1px solid #2a2826. Padding 14px 24px.

Photo upload button: icon, color #5a5753, hover #4ecdc4.
Text input: background #1c1b19, border 1px solid #2a2826,
border-radius 24px, padding 12px 18px, auto-expands to 5 lines.
On focus: border-color #4ecdc4.
Send button: 40px teal circle. Disabled (grey) when empty.
On click: scale(0.9) → 1, spring ease.

EMPTY STATE:
Centered. Zorvai logo spark icon.
"Ask me anything" in #f0ede8, 20px.
"I know your subjects, your recent sessions, and where you're stuck." in #8a8680.
Three suggested chips (tap to use):
"Explain [weak topic]" · "Quiz me on [recent topic]" · "What's next?"
Chip: background #1c1b19, border #2a2826, border-radius 99px,
padding 8px 16px, font-size 13px, color #8a8680.
Hover: border-color #4ecdc4, color #4ecdc4.
```

---

## PROGRESS PAGE (app/(student)/progress/page.jsx)

```jsx
Build the student progress tracker at /progress.

SUBJECT PROGRESS BARS:
Each subject: name + progress bar + percentage.
Bar: height 6px, background #252320, fill color per subject,
border-radius 99px. Fills on mount (800ms, stagger 100ms each).
Math=#fbbf24, Biology=#4ecdc4, English=#a78bfa, Science=#60a5fa.

SESSION HISTORY TABLE:
Columns: Date · Topic · Subject · Duration · Result.
No visible column borders — just spacing.
Row dividers: 1px solid #252320.
Result chip: Passed (#4ade80 bg) or Missed (#f87171 bg), 12px.

STREAK CALENDAR:
30-day grid like GitHub contribution graph.
Study days: filled teal. Rest days: #252320. Today: ring border.

MASTERED TOPICS:
List with checkmark. #4ade80 dot + topic name.

WEAK TOPICS:
List with flag. #f87171 dot + topic name + "Review →" link.
```

---

---

# PARENT DASHBOARD PROMPT

Build all parent pages. Start with app/(parent)/layout.jsx.

## PARENT LAYOUT (app/(parent)/layout.jsx)

```jsx
Same structure as student layout but with parent-specific nav.

SIDEBAR ITEMS:
1. Overview (home) → /parent/dashboard
2. Progress (chart) → /parent/progress
3. Community (people) → /parent/community
4. Guarantee (shield) → /parent/guarantee
5. Billing (card) → /parent/billing
6. Settings (gear) → /parent/settings

Community item has unread badge:
Small teal circle top-right of icon, white number, hide when zero.
Fetch count from /api/community/unread-count on load.

Bottom: parent avatar + name + "Parent" label.
```

---

## PARENT DASHBOARD PAGE (app/(parent)/parent/dashboard/page.jsx)

```jsx
Build the parent overview dashboard.

Fetch on load:
- GET /api/progress/student/[linkedStudentId]
- GET /api/community/unread-count

SECTION 1 — CHILD SELECTOR + HEADER
Left: "Watching [childName]" in #f0ede8, 22px, font-weight 500.
Below: "Last active [relativeTime] · [streak]-day streak 🔥" in #8a8680, 14px.

SECTION 2 — FOUR STATUS CARDS

Card 1 — Studied today:
Status dot: green if yes, amber if not yet, grey if rest day.
Label "Studied today" in #8a8680, 12px.
Value: "Yes ✓" in #4ade80 / "Not yet" in #fbbf24 / "Rest day" in #5a5753.
Subtext: if yes → "Topic · duration". If not yet → "Session planned."

Card 2 — This week:
"Sessions this week" label.
"[n] of [total]" value.
Five dots row: filled teal for done, empty #252320 for remaining.
8px circles, gap 4px, border-radius 99px.

Card 3 — Streak:
"Current streak" label.
"[n] days" value, 24px, font-weight 600.
"🔥 Started [date]" in #8a8680.

Card 4 — Guarantee:
Label "Improvement guarantee".
Status text: "On track" (#4ade80) / "Behind schedule" (#fbbf24) / "Qualified ✓" (#4ecdc4).
If behind schedule: subtle amber left border (3px solid #fbbf24) on card.
Subtext: "[n] of 12 sessions · [daysLeft] days left".

SECTION 3 — GOAL CARD (full width)
Background rgba(78,205,196,0.05), border rgba(78,205,196,0.15).
Left:
Label: "YOUR GOAL FOR [CHILDNAME]" in #4ecdc4, 11px.
Goal text: what parent typed at onboarding, italic, #f0ede8.
AI summary below: plain-language status of current progress, #8a8680, 14px.
Right: same circular progress ring as student dashboard.

SECTION 4 — TWO COLUMN LAYOUT

LEFT (58%): THIS WEEK'S ACTIVITY
Seven rows (Mon-Sun):
- Day name + date
- Session pill: same states as student plan strip
  Plus MISSED state: border-left 3px solid #f87171, "Missed" in #f87171, italic.

Below week: "Send a nudge →" link in #4ecdc4, 13px.
On click: POST /api/notify/nudge → sends push notification to child.
After click: text changes to "Nudge sent ✓" in #4ade80, 2-second timeout.
After 2 seconds: greys out (can only send once per day).

RIGHT (42%): SUBJECT PROGRESS
One row per subject:
Subject name + progress bar (same colored bars as student) + percentage.
"Last studied: [relativeTime]" in #5a5753, 11px below each bar.

SECTION 5 — RECENT SESSIONS TABLE (full width)
Header: "Recent sessions" + "View all →" link.
Table: Date · Topic · Subject · Duration · Result.
Show last 5. Rows separated by 1px solid #252320.
Result chips same as student progress.

SECTION 6 — GUARANTEE PANEL (full width, bottom)
Three-column layout inside a card.

Left third:
"Improvement guarantee" heading.
"Sessions completed this window" label.
Large "[n] / 12" — n in #4ecdc4, 32px, font-weight 700.
Progress bar below.

Middle third:
"Baseline score: [score]%" — label muted, value #f0ede8.
"Current trajectory: +[n]%" — label muted, value #4ade80 (positive) or #f87171 (negative).
"Follow-up quiz: [n] days away" in #8a8680.

Right third (right-aligned):
If eligible (sessions >= 12 AND 30 days elapsed):
"Claim refund" button — border 1px solid #2a2826, background transparent,
color #f0ede8, padding 10px 20px, border-radius 8px.
Hover: background #252320.

If not yet eligible:
"Available after 12 sessions" in #5a5753, 13px. No button.

"Refunds in 5 business days" in #5a5753, 12px below.
```

---

## PARENT COMMUNITY PAGE (app/(parent)/parent/community/page.jsx)

```jsx
Build the parent community feed at /parent/community.
Max content width: 640px, centered.

PAGE HEADER:
"Family Community" in #f0ede8, 22px.
"Celebrating the wins that matter." in #8a8680, 14px.
Right: "Share a win +" button in teal.

MILESTONE NUDGES (if pending):
"🎉 Ready to share" label in #4ecdc4.
Horizontal scrollable row of nudge cards:
Background rgba(78,205,196,0.08), border rgba(78,205,196,0.2), border-radius 12px.
Milestone emoji (large) + headline + subtext.
"Share it" (teal) + "Not now" (#5a5753) buttons.
Entrance: slides in from right with stagger (0ms, 80ms, 160ms).

FEED POSTS:
Each post: background #1c1b19, border #2a2826, border-radius 14px,
padding 20px, margin-bottom 10px.
New post entrance: translateY -16px opacity 0 → 0 opacity 1, 300ms spring.

Post card anatomy:
Top row: avatar circle + parent name + relative time + overflow menu (own posts).
Win card content: teal-tinted inner card with milestone headline.
Custom text: plain text, no inner card.

Reaction row:
"🔥 [n]" "🎉 [n]" "💪 [n]" buttons.
Active: background rgba(78,205,196,0.1), color #4ecdc4.
On click: emoji pops (scale 1.5 → 1, 300ms spring). Count flips.
"[n] comments" text button → expands comments inline.
"💙 Encourage" → anonymous encouragement sent, button changes to "💙 Sent".

SHARE MODAL:
Backdrop: rgba(22,21,20,0.9), blur 8px.
Card: 480px, background #1c1b19, border #2a2826, border-radius 16px.
Opens: backdrop 150ms fade + card scale 0.94 → 1 (250ms spring).

Step 1: 4 tile grid (Streak / Score / Mastery / Custom).
Step 2: Optional text area (max 280 chars).
Step 3: Name toggle (show child name or post anonymously).
Submit: "Share to community" full-width teal button.

EMPTY STATE:
People icon in #2a2826. "Be the first to share" heading.
"When your child hits a milestone, we'll nudge you to share it here."
"Share your first win" teal button.
```

---

---

# ADMIN DASHBOARD PROMPT

Build all admin pages. Start with app/(admin)/layout.jsx.

## ADMIN LAYOUT (app/(admin)/layout.jsx)

```jsx
Same sidebar structure but with admin-specific styling.
Sidebar background: #0f0e0d (slightly darker than regular sidebar).
Add a "ADMIN" pill top of sidebar below logo: background rgba(248,113,113,0.1),
color #f87171, border 1px solid rgba(248,113,113,0.2), border-radius 99px,
padding 2px 8px, font-size 10px, font-weight 700.

SIDEBAR ITEMS:
1. Overview → /admin
2. Users → /admin/users
3. Sessions → /admin/sessions
4. Waitlist → /admin/waitlist
5. Revenue → /admin/revenue
6. Curriculum → /admin/content
7. Safety Flags → /admin/flags (red badge if unreviewed flags)

Bottom: Admin avatar + name + "Admin" label.
```

---

## ADMIN OVERVIEW PAGE (app/(admin)/admin/page.jsx)

```jsx
Build the admin overview at /admin.

Fetch on load: GET /api/admin/overview → all key metrics

SIX METRIC CARDS (2x3 grid):

Card 1: Total users
Value + breakdown: [n] students, [n] parents.

Card 2: Active subscribers
Currently paying. Delta from last week: "+[n] this week" in #4ade80.

Card 3: MRR
"$[amount]" in #4ecdc4, large. Target: "$1,000,000" below in #5a5753.
Mini progress bar toward target.

Card 4: Sessions today
Count of sessions started today. Average duration.

Card 5: Guarantee claims
Pending: [n] · Processed: [n] · Total refunded: $[amount].
If pending > 0: amber left border on card.

Card 6: Safety flags
Unreviewed flags in red. "Review →" link to /admin/flags.
If any unreviewed: red left border on card.

CHARTS SECTION:
Two charts side by side.

Chart 1: Signups over 30 days.
Simple line chart. Teal line on dark background.
Data from GET /api/admin/signups-chart.

Chart 2: MRR growth over 3 months.
Same style. Shows monthly bars.

RECENT ACTIVITY FEED:
Last 10 events across the platform:
- New signup
- Session completed
- Guarantee claim submitted
- Safety flag triggered
- Payment received
Each with icon, description, user email (anonymized if needed), relative time.

TOP COUNTRIES TABLE:
Country · Users · Sessions today · MRR contribution.
Sorted by users descending.

WAITLIST SUMMARY:
Total on waitlist · Commitment completion rate · Avg plan chosen.
"View all →" link to /admin/waitlist.
```

---

## ADMIN USERS PAGE (app/(admin)/admin/users/page.jsx)

```jsx
Build the user management page at /admin/users.

SEARCH + FILTERS ROW:
Search input (email/name). Country filter. Role filter. Paid/free filter.
All inline, same row. Background #1c1b19, border #2a2826.

USERS TABLE:
Columns: Name · Email · Role · Country · Plan · Joined · Last active · Actions.

Each row: background transparent, border-bottom 1px solid #252320.
Hover: background #1c1b19.
Role chip: "Student" or "Parent" — small pill.
Plan chip: "Monthly" / "Annual" / "Free" — teal if paid, #5a5753 if free.
Last active: relative time in #8a8680.

Actions column (three dot menu):
- View full profile → opens a slide-over panel (not a new page)
- Reset password
- Suspend account (turns row amber)
- Delete account (requires confirmation)

SLIDE-OVER PANEL (when "View full profile" clicked):
Slides in from right. Width 440px. Background #1c1b19. Border-left #2a2826.
Shows: full student/parent profile, session history, mastery by topic,
subscription status, guarantee claims.

PAGINATION:
20 per page. Previous / Next. Page number indicator.

EXPORT BUTTON:
"Export CSV" in secondary style. Downloads user data as CSV.
```

---

## ADMIN WAITLIST PAGE (app/(admin)/admin/waitlist/page.jsx)

```jsx
Build the waitlist management page at /admin/waitlist.

SUMMARY ROW:
Total signups · Commitment rate · Plan distribution pie (weekly/monthly/annual) · Paid count.

WAITLIST TABLE:
Columns: Position · Name · Email · Country · Commitment · Plan · Referrals · Joined.

Commitment column:
Green checkmark if commitment + signature completed.
Grey dash if not yet.

Plan column:
Shows chosen plan if selected. "Not chosen" in #5a5753 if not.

Referrals column:
Number of referrals they've made. Highlight in teal if > 5.

LEADERBOARD SECTION (below table):
Top 10 referrers with rank, name, city, referral count.
Gold/silver/bronze styling for top 3.

COMMITMENT VIEWER:
Click any row → modal showing their commitment letter text + subject + goal.
Also shows the Gemini-generated card image if generated.
```

---

## ADMIN REVENUE PAGE (app/(admin)/admin/revenue/page.jsx)

```jsx
Build the revenue analytics page at /admin/revenue.

KEY METRICS ROW:
MRR · ARR · Total revenue · Average revenue per user · Churn rate.
Each in a card with a small trend indicator (up/down arrow + percentage).

MRR CHART:
Line chart, 6 months. Teal line. Y-axis: dollar amounts.

PLAN BREAKDOWN:
Donut chart: Weekly / Monthly / Annual distribution.
Below: table with plan, subscriber count, revenue contribution.

CHURN ANALYSIS:
Monthly churn rate. Cohort retention table.
Row = signup month. Columns = months 1-6 retention %.
Heatmap colors: green (high retention) to red (low retention).

GUARANTEE REFUNDS:
Total refund amount · Refund rate % · Average refund time.
List of recent refunds: name, amount, reason, date.

COUNTRY BREAKDOWN:
Table: Country · Subscribers · MRR · Avg LTV.
Sort by MRR descending.
```

---

## ADMIN SAFETY FLAGS PAGE (app/(admin)/admin/flags/page.jsx)

```jsx
Build the safety flags review page at /admin/flags.

UNREVIEWED FLAGS (top, red section):
Background rgba(248,113,113,0.04), border-top 3px solid #f87171.
Count of unreviewed flags in red badge.

Each flag card:
Student name (anonymized if under 18: "Student #[id]").
Flag type: "Escalation" / "Inappropriate content" / "Curriculum concern".
Triggered at timestamp.
Relevant session context (what triggered the flag — brief excerpt only).

ACTIONS per flag:
- "Mark reviewed — no action needed" → moves to reviewed
- "Contact parent" → opens email draft
- "Suspend account" → with confirmation
- "Escalate to team" → sends internal alert

REVIEWED FLAGS:
Collapsed section. Expandable list. Shows who reviewed and when.

PRIVACY RULE (displayed at top of page):
"Student check-in content is never shown here — only the escalation flag.
Exact words are not stored per the privacy policy."
This text is always visible to remind admins of the data boundary.
```

---

## CONNECTING EVERYTHING — API ROUTES

```javascript
// Admin routes all require admin role check:
// GET  /api/admin/overview         → dashboard metrics
// GET  /api/admin/users            → paginated user list
// GET  /api/admin/users/[id]       → single user detail
// POST /api/admin/users/[id]/suspend
// POST /api/admin/users/[id]/delete
// GET  /api/admin/waitlist         → full waitlist data
// GET  /api/admin/revenue          → revenue metrics
// GET  /api/admin/signups-chart    → 30-day signup data
// GET  /api/admin/flags            → safety flags
// POST /api/admin/flags/[id]/review
// GET  /api/admin/sessions         → all sessions

// Student routes:
// GET  /api/progress/student/[id]  → full progress data
// GET  /api/sessions/today         → today's planned session
// GET  /api/reviews/due/[id]       → spaced repetition due today
// POST /api/sessions/start
// POST /api/sessions/[id]/recall
// POST /api/sessions/[id]/challenge
// POST /api/sessions/[id]/evaluate
// POST /api/chat                   → chatbot message

// Parent routes:
// GET  /api/notify/nudge           → send nudge to child
// GET  /api/community/feed         → community posts
// POST /api/community/post
// POST /api/community/react
// POST /api/community/encourage
// GET  /api/community/unread-count
// POST /api/payments/guarantee/claim
```

---

## GLOBAL ANIMATION CSS

Add to globals.css:

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-40px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes countUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(78,205,196,0.3); }
  50%       { box-shadow: 0 0 0 8px rgba(78,205,196,0); }
}

@keyframes voiceWave {
  0%, 100% { height: 8px; }
  50%       { height: 32px; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}

@keyframes ripple {
  to { transform: scale(4); opacity: 0; }
}

.page-enter {
  animation: fadeUp 400ms cubic-bezier(0.16,1,0.3,1) both;
}

.animate-on-scroll {
  opacity: 0;
}

.animate-on-scroll.visible {
  animation: fadeUp 400ms cubic-bezier(0.16,1,0.3,1) both;
}
```

Add this JavaScript to every page to trigger scroll animations:

```javascript
useEffect(() => {
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible')
        observer.unobserve(e.target)
      }
    }),
    { threshold: 0.1 }
  )
  document.querySelectorAll('.animate-on-scroll')
    .forEach(el => observer.observe(el))
  return () => observer.disconnect()
}, [])
```

Add class "animate-on-scroll" to every major section.
Add class "page-enter" to the top-level page div.
```

---

## MOBILE RULES (apply to all three dashboards)

```
Below 768px:
- Sidebar becomes bottom nav (icons only, no labels, 5 items max)
- All card grids become single column
- Two-column layouts stack vertically
- Tables become card-list format (each row = its own card)
- Chatbot float button moves to bottom-center
- Admin tables show only 3 columns on mobile (most important ones)
- Session player goes full screen with safe-area-inset padding
```
