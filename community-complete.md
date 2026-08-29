# ZORVAI — Complete Community Feature
# Everything a parent can do, backend to frontend

---

## 1. COMPLETE PARENT INTERACTIONS IN COMMUNITY

### On their own posts:
- Create a post (win card / score improvement / streak / custom text)
- Choose child first name OR post anonymously as "A Zorvai parent"
- Delete their own post anytime, no reason needed
- See reaction counts and comment count on their post
- See milestone nudges and convert them to posts with one tap

### On other parents' posts:
- React: 🔥 (inspiring) 🎉 (celebrating) 💪 (motivating)
- Remove own reaction by tapping again (toggle off)
- Comment with a short supportive message (max 200 chars)
- Send anonymous encouragement (private one-way warm message)
- See milestone cards, streaks, improvement percentages
- See first name OR "A Zorvai parent" — never more than what they chose to share

### What parents CANNOT do:
- Message another parent directly (no DMs)
- Share or repost another family's post outside the community
- React to their own post
- See which school, city, or country a child is from
- See any data beyond what the parent explicitly chose to share
- Downvote, report negatively, or post negative reactions

---

## 2. DATABASE SCHEMA

```sql
-- Community posts
create table community_posts (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references users(id) on delete cascade,
  post_type text not null check (post_type in (
    'win_card',
    'streak_milestone',
    'score_improvement',
    'subject_mastery',
    'custom_text',
    'guarantee_qualified',
    'first_session'
  )),
  child_first_name text,
  anonymous boolean default false,
  content text check (char_length(content) <= 280),
  milestone_data jsonb,
  reactions jsonb default '{"fire":0,"party":0,"muscle":0}',
  comment_count int default 0,
  visible boolean default true,
  moderation_held boolean default false,
  created_at timestamptz default now()
);

-- Reactions (prevents double-reacting)
create table community_reactions (
  id bigint generated always as identity primary key,
  post_id uuid not null references community_posts(id) on delete cascade,
  parent_id uuid not null references users(id) on delete cascade,
  reaction text not null check (reaction in ('fire', 'party', 'muscle')),
  created_at timestamptz default now(),
  unique(post_id, parent_id, reaction)
);

-- Comments
create table community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  parent_id uuid not null references users(id) on delete cascade,
  content text not null check (char_length(content) <= 200),
  visible boolean default true,
  moderation_held boolean default false,
  created_at timestamptz default now()
);

-- Anonymous encouragement (one-way private message)
create table community_encouragements (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  from_parent_id uuid not null references users(id) on delete cascade,
  to_parent_id uuid not null references users(id) on delete cascade,
  -- No content column — message is always the same generic warm message
  -- "Someone in the Zorvai community is rooting for your family 💙"
  -- This prevents misuse while keeping the warmth intact
  sent_at timestamptz default now(),
  unique(post_id, from_parent_id) -- one encouragement per post per parent
);

-- Milestone nudges (auto-triggered when child hits a milestone)
create table milestone_nudges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references users(id) on delete cascade,
  parent_id uuid not null references users(id) on delete cascade,
  milestone_type text not null check (milestone_type in (
    'first_session',
    'streak_7', 'streak_14', 'streak_30', 'streak_60', 'streak_90',
    'improvement_10', 'improvement_20', 'improvement_30', 'improvement_50',
    'subject_mastery',
    'guarantee_qualified'
  )),
  milestone_data jsonb,
  nudge_sent_at timestamptz default now(),
  shared boolean default false,
  dismissed boolean default false,
  post_id uuid references community_posts(id)
);

-- Community notification log (what a parent has seen)
create table community_last_seen (
  parent_id uuid primary key references users(id) on delete cascade,
  last_seen_at timestamptz default now()
);

-- RLS policies
alter table community_posts enable row level security;
alter table community_reactions enable row level security;
alter table community_comments enable row level security;
alter table community_encouragements enable row level security;
alter table milestone_nudges enable row level security;

-- Feed visible to all authenticated parents
create policy "feed_visible_to_parents" on community_posts
  for select using (
    auth.uid() in (select id from users where role = 'parent')
    and visible = true
    and (
      moderation_held = false
      or created_at < now() - interval '2 hours'
    )
  );

-- Parents can insert their own posts
create policy "parents_insert_own_posts" on community_posts
  for insert with check (auth.uid() = parent_id);

-- Parents can delete their own posts
create policy "parents_delete_own_posts" on community_posts
  for delete using (auth.uid() = parent_id);

-- Reactions: authenticated parents only, not on own posts
create policy "reactions_by_parents" on community_reactions
  for all using (
    auth.uid() in (select id from users where role = 'parent')
  );

-- Comments: readable by all parents, writable by owner
create policy "comments_readable" on community_comments
  for select using (
    auth.uid() in (select id from users where role = 'parent')
    and visible = true
  );

create policy "comments_insert" on community_comments
  for insert with check (auth.uid() = parent_id);

-- Encouragements: sender and recipient only
create policy "encouragements_by_sender" on community_encouragements
  for insert with check (auth.uid() = from_parent_id);

-- Nudges: only the parent they belong to
create policy "nudges_own_only" on milestone_nudges
  for all using (auth.uid() = parent_id);
```

---

## 3. API ROUTES

### GET /api/community/feed
```javascript
export async function GET(request) {
  const user = await getAuthenticatedUser(request)
  const isParent = await requireRole(user, 'parent', supabase)
  if (!isParent) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit

  // Get posts with comment counts
  const { data: posts, error } = await supabase
    .from('community_posts')
    .select(`
      id, post_type, child_first_name, anonymous, content,
      milestone_data, reactions, comment_count, created_at,
      parent_id
    `)
    .eq('visible', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  // Get this parent's reactions to know which ones to highlight
  const postIds = posts.map(p => p.id)
  const { data: myReactions } = await supabase
    .from('community_reactions')
    .select('post_id, reaction')
    .eq('parent_id', user.id)
    .in('post_id', postIds)

  // Merge own reaction data into posts
  const postsWithReactions = posts.map(post => ({
    ...post,
    isOwnPost: post.parent_id === user.id,
    myReactions: myReactions
      ?.filter(r => r.post_id === post.id)
      .map(r => r.reaction) || []
  }))

  // Update last seen timestamp
  await supabase
    .from('community_last_seen')
    .upsert({ parent_id: user.id, last_seen_at: new Date().toISOString() })

  return NextResponse.json({
    ok: true,
    posts: postsWithReactions,
    hasMore: posts.length === limit,
    page
  })
}
```

### POST /api/community/post
```javascript
export async function POST(request) {
  const user = await getAuthenticatedUser(request)
  const isParent = await requireRole(user, 'parent', supabase)
  if (!isParent) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { post_type, child_first_name, anonymous, content, milestone_data } = await request.json()

  // Validate
  if (!post_type) return NextResponse.json({ error: 'post_type required' }, { status: 400 })
  if (content && content.length > 280) {
    return NextResponse.json({ error: 'Content max 280 characters' }, { status: 400 })
  }

  // New account moderation hold (account < 30 days old)
  const { data: userRecord } = await supabase
    .from('users')
    .select('created_at')
    .eq('id', user.id)
    .single()

  const accountAgeDays = (Date.now() - new Date(userRecord.created_at)) / (1000 * 60 * 60 * 24)
  const moderationHeld = accountAgeDays < 30

  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      parent_id: user.id,
      post_type,
      child_first_name: anonymous ? null : child_first_name,
      anonymous: anonymous || false,
      content: content || null,
      milestone_data: milestone_data || null,
      moderation_held: moderationHeld
    })
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ ok: true, post: data })
}
```

### DELETE /api/community/post/[id]
```javascript
export async function DELETE(request, { params }) {
  const user = await getAuthenticatedUser(request)
  const isParent = await requireRole(user, 'parent', supabase)
  if (!isParent) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // RLS handles ownership check — will silently fail if not owner
  const { error } = await supabase
    .from('community_posts')
    .delete()
    .eq('id', params.id)
    .eq('parent_id', user.id)

  if (error) throw error
  return NextResponse.json({ ok: true })
}
```

### POST /api/community/react
```javascript
export async function POST(request) {
  const user = await getAuthenticatedUser(request)
  const isParent = await requireRole(user, 'parent', supabase)
  if (!isParent) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { post_id, reaction } = await request.json()

  // Prevent reacting to own post
  const { data: post } = await supabase
    .from('community_posts')
    .select('parent_id')
    .eq('id', post_id)
    .single()

  if (post.parent_id === user.id) {
    return NextResponse.json({ error: 'Cannot react to your own post' }, { status: 400 })
  }

  // Check if reaction exists (toggle behavior)
  const { data: existing } = await supabase
    .from('community_reactions')
    .select('id')
    .eq('post_id', post_id)
    .eq('parent_id', user.id)
    .eq('reaction', reaction)
    .maybeSingle()

  if (existing) {
    // Remove reaction
    await supabase
      .from('community_reactions')
      .delete()
      .eq('id', existing.id)

    // Decrement count on post
    await supabase.rpc('decrement_reaction', { post_id, reaction_type: reaction })
    return NextResponse.json({ ok: true, action: 'removed' })
  } else {
    // Add reaction
    await supabase
      .from('community_reactions')
      .insert({ post_id, parent_id: user.id, reaction })

    // Increment count on post
    await supabase.rpc('increment_reaction', { post_id, reaction_type: reaction })
    return NextResponse.json({ ok: true, action: 'added' })
  }
}
```

### POST /api/community/comment
```javascript
export async function POST(request) {
  const user = await getAuthenticatedUser(request)
  const isParent = await requireRole(user, 'parent', supabase)
  if (!isParent) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { post_id, content } = await request.json()

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 })
  }
  if (content.length > 200) {
    return NextResponse.json({ error: 'Comment max 200 characters' }, { status: 400 })
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('created_at')
    .eq('id', user.id)
    .single()

  const accountAgeDays = (Date.now() - new Date(userRecord.created_at)) / (1000 * 60 * 60 * 24)

  const { data, error } = await supabase
    .from('community_comments')
    .insert({
      post_id,
      parent_id: user.id,
      content: content.trim(),
      moderation_held: accountAgeDays < 30
    })
    .select()
    .single()

  if (error) throw error

  // Increment comment count on post
  await supabase
    .from('community_posts')
    .update({ comment_count: supabase.raw('comment_count + 1') })
    .eq('id', post_id)

  return NextResponse.json({ ok: true, comment: data })
}
```

### GET /api/community/comments/[post_id]
```javascript
export async function GET(request, { params }) {
  const user = await getAuthenticatedUser(request)
  const isParent = await requireRole(user, 'parent', supabase)
  if (!isParent) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('community_comments')
    .select('id, content, created_at, parent_id')
    .eq('post_id', params.post_id)
    .eq('visible', true)
    .order('created_at', { ascending: true })

  if (error) throw error

  // Get parent names for comments
  // Return "A Zorvai parent" placeholder — comments are not anonymous
  // but we only return first name for privacy
  const parentIds = [...new Set(data.map(c => c.parent_id))]
  const { data: parents } = await supabase
    .from('users')
    .select('id, name')
    .in('id', parentIds)

  const parentMap = Object.fromEntries(parents.map(p => [p.id, p.name?.split(' ')[0] || 'A parent']))

  const commentsWithNames = data.map(c => ({
    ...c,
    parent_first_name: parentMap[c.parent_id],
    isOwnComment: c.parent_id === user.id
  }))

  return NextResponse.json({ ok: true, comments: commentsWithNames })
}
```

### POST /api/community/encourage
```javascript
export async function POST(request) {
  const user = await getAuthenticatedUser(request)
  const isParent = await requireRole(user, 'parent', supabase)
  if (!isParent) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { post_id } = await request.json()

  // Get the post owner
  const { data: post } = await supabase
    .from('community_posts')
    .select('parent_id')
    .eq('id', post_id)
    .single()

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (post.parent_id === user.id) {
    return NextResponse.json({ error: 'Cannot encourage yourself' }, { status: 400 })
  }

  // Insert encouragement (unique constraint prevents sending twice)
  const { error } = await supabase
    .from('community_encouragements')
    .insert({
      post_id,
      from_parent_id: user.id,
      to_parent_id: post.parent_id
    })

  if (error?.code === '23505') {
    return NextResponse.json({ error: 'Already encouraged this post' }, { status: 400 })
  }
  if (error) throw error

  // Send notification to the recipient
  // Message is always generic — never reveals who sent it
  const { data: recipient } = await supabase
    .from('users')
    .select('email, name')
    .eq('id', post.parent_id)
    .single()

  await sendEmail({
    to: recipient.email,
    subject: 'Someone is rooting for your family 💙',
    text: `Hi ${recipient.name?.split(' ')[0] || 'there'},\n\nSomeone in the Zorvai community saw your post and wanted you to know they're rooting for your family.\n\nKeep going. 💙\n\nThe Zorvai team`
  })

  return NextResponse.json({ ok: true })
}
```

### GET /api/community/milestones
```javascript
export async function GET(request) {
  const user = await getAuthenticatedUser(request)
  const isParent = await requireRole(user, 'parent', supabase)
  if (!isParent) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('milestone_nudges')
    .select('*')
    .eq('parent_id', user.id)
    .eq('shared', false)
    .eq('dismissed', false)
    .order('nudge_sent_at', { ascending: false })

  return NextResponse.json({ ok: true, milestones: data || [] })
}
```

### POST /api/community/milestones/dismiss
```javascript
export async function POST(request) {
  const user = await getAuthenticatedUser(request)
  const { nudge_id } = await request.json()

  await supabase
    .from('milestone_nudges')
    .update({ dismissed: true })
    .eq('id', nudge_id)
    .eq('parent_id', user.id)

  return NextResponse.json({ ok: true })
}
```

### GET /api/community/unread-count
```javascript
// Returns number of new posts since parent last visited
export async function GET(request) {
  const user = await getAuthenticatedUser(request)
  const isParent = await requireRole(user, 'parent', supabase)
  if (!isParent) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: lastSeen } = await supabase
    .from('community_last_seen')
    .select('last_seen_at')
    .eq('parent_id', user.id)
    .maybeSingle()

  if (!lastSeen) return NextResponse.json({ ok: true, count: 0 })

  const { count } = await supabase
    .from('community_posts')
    .select('*', { count: 'exact', head: true })
    .eq('visible', true)
    .gt('created_at', lastSeen.last_seen_at)
    .neq('parent_id', user.id) // don't count own posts as unread

  return NextResponse.json({ ok: true, count: count || 0 })
}
```

---

## 4. MILESTONE TRIGGER (add to session evaluate route)

```javascript
// lib/milestones.js
export async function checkAndTriggerMilestones(studentId, supabase) {
  const { data: student } = await supabase
    .from('student_profiles')
    .select('parent_id, streak, baseline_score, current_score')
    .eq('id', studentId)
    .single()

  if (!student?.parent_id) return // no parent linked

  const { count: sessionCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('passed', true)

  const milestones = []

  // First session
  if (sessionCount === 1) {
    milestones.push({ type: 'first_session', data: {} })
  }

  // Streak milestones
  const STREAK_MILESTONES = [7, 14, 30, 60, 90]
  if (STREAK_MILESTONES.includes(student.streak)) {
    milestones.push({
      type: `streak_${student.streak}`,
      data: { streak_days: student.streak }
    })
  }

  // Score improvement milestones
  if (student.baseline_score && student.current_score) {
    const pct = Math.round(
      ((student.current_score - student.baseline_score) / student.baseline_score) * 100
    )
    const IMPROVEMENT_MILESTONES = [10, 20, 30, 50]
    for (const milestone of IMPROVEMENT_MILESTONES) {
      if (pct >= milestone) {
        // Check if this milestone was already nudged
        const { data: existing } = await supabase
          .from('milestone_nudges')
          .select('id')
          .eq('student_id', studentId)
          .eq('milestone_type', `improvement_${milestone}`)
          .maybeSingle()

        if (!existing) {
          milestones.push({
            type: `improvement_${milestone}`,
            data: { improvement_pct: milestone }
          })
        }
      }
    }
  }

  // Insert all new milestones and notify parent
  for (const milestone of milestones) {
    await supabase.from('milestone_nudges').insert({
      student_id: studentId,
      parent_id: student.parent_id,
      milestone_type: milestone.type,
      milestone_data: milestone.data
    })

    // Push notification to parent
    await notifyParentMilestone(student.parent_id, studentId, milestone)
  }
}
```

---

## 5. SUPABASE HELPER FUNCTIONS

```sql
-- Increment reaction count safely
create or replace function increment_reaction(post_id uuid, reaction_type text)
returns void as $$
begin
  update community_posts
  set reactions = jsonb_set(
    reactions,
    array[reaction_type],
    to_jsonb((reactions->>reaction_type)::int + 1)
  )
  where id = post_id;
end;
$$ language plpgsql;

-- Decrement reaction count safely (minimum 0)
create or replace function decrement_reaction(post_id uuid, reaction_type text)
returns void as $$
begin
  update community_posts
  set reactions = jsonb_set(
    reactions,
    array[reaction_type],
    to_jsonb(greatest(0, (reactions->>reaction_type)::int - 1))
  )
  where id = post_id;
end;
$$ language plpgsql;
```

---

## 6. UI PROMPT — COMPLETE COMMUNITY PAGE

Paste into Cursor or Antigravity:

---

Build the parent community page at /parent/community for Zorvai.

DESIGN SYSTEM (match exactly to zorvai.vercel.app):
Background: #161514
Card surface: #1e1d1b
Card border: 1px solid #2e2c29
Border radius cards: 12px
Border radius inner: 8px
Text primary: #f0ede8
Text secondary: #8a8680
Text muted: #5a5753
Accent teal: #4ecdc4
Teal bg: rgba(78,205,196,0.08)
Teal border: rgba(78,205,196,0.2)
Success: #4ade80
Warning: #fbbf24
Danger: #f87171
Font: system-ui, -apple-system, sans-serif
No drop shadows anywhere — use border + background contrast for depth
No Google Fonts

ADD TO SIDEBAR:
Between Progress and Guarantee:
Icon: two-person SVG, 18x18px, stroke 1.5, stroke color currentColor
Label: "Community"
Notification badge: small circle 18px, background #4ecdc4, 
color #161514, font-size 10px, font-weight 700, positioned top-right
of icon. Only shown when unread count > 0.

PAGE LAYOUT:
Max content width: 680px, centered in main area.
Padding: 32px desktop, 20px mobile.

SECTION 1 — PAGE HEADER:
Left: "Family Community" in #f0ede8, 22px, font-weight 600.
Below: "Celebrating the wins that matter." in #8a8680, 14px.
Right: "Share a win +" button.
Background: #4ecdc4, color: #161514, font-weight: 600, 
font-size: 14px, padding: 10px 20px, border-radius: 8px.

SECTION 2 — MILESTONE NUDGES (show only if pending milestones exist):
Label above: "🎉  Ready to share" in #4ecdc4, 11px, 
letter-spacing 0.08em, font-weight 600, margin-bottom 10px.

Horizontally scrollable row of nudge cards:
Each card: min-width 240px, background rgba(78,205,196,0.08),
border 1px solid rgba(78,205,196,0.2), border-radius 12px, padding 16px.
Gap between cards: 10px.

Inside each card:
- Milestone emoji large (32px): 🔥 streak, 📈 improvement, ✅ mastery,
  🎯 first session, 🏆 guarantee qualified
- Milestone headline in #f0ede8, 15px, font-weight 600:
  Streak: "7-day streak!"
  Improvement: "Up 23% in Math!"
  First session: "First session complete!"
  Mastery: "Calculus module done!"
  Guarantee: "Guarantee qualified!"
- Subtext in #8a8680, 12px: "[Child] hit this today"
- Two buttons:
  "Share it" — background #4ecdc4, color #161514, padding 7px 14px,
  border-radius 6px, font-size 13px, font-weight 600.
  "Not now" — background transparent, color #5a5753, 
  padding 7px 10px, font-size 13px.
  Buttons side by side, gap 8px.

SECTION 3 — FEED POSTS:
Map through posts array. Each post is a card:
background #1e1d1b, border 1px solid #2e2c29, border-radius 12px,
padding 20px, margin-bottom 10px.

POST CARD TOP ROW:
Left: Avatar circle 40px diameter.
Background color: derived from parent name using this function:
const colors = ['#4ecdc4','#fbbf24','#a78bfa','#4ade80','#f87171','#60a5fa']
const colorIndex = name.charCodeAt(0) % colors.length
background: colors[colorIndex]
Color: #161514. Initials (first letter of name) in 15px, font-weight 700.
If anonymous: show a generic person icon SVG instead of initials.

Right of avatar:
Top line: parent first name in #f0ede8, 14px, font-weight 500.
If anonymous: "A Zorvai parent" in #8a8680, 14px, font-style italic.
Bottom line: relative time in #5a5753, 12px. 
Use: "just now" / "2 hours ago" / "yesterday" / "3 days ago" — 
never show exact timestamps.

Far right (only on own posts):
Three dot "···" button in #5a5753. On click: dropdown card appears:
background #252422, border 1px solid #2e2c29, border-radius 8px,
padding 4px.
One item: "Delete post" in #f87171, 14px, padding 8px 16px.
Click confirms with a simple "Are you sure?" inline text + 
"Yes, delete" / "Cancel" — not a modal.

WIN CARD CONTENT (post_type = win_card or any milestone type):
A styled inner card:
background rgba(78,205,196,0.06), border 1px solid rgba(78,205,196,0.15),
border-radius 10px, padding 16px, margin-top 12px.

Inside:
Row: milestone emoji (24px) + headline in #f0ede8, 16px, font-weight 600.
Examples:
- "🔥 30-day streak!"
- "📈 Up 23% in Math this month"
- "✅ Completed the full Calculus module"
- "🎯 First session done!"
Below headline: if post has content text — show it in #8a8680, 14px,
line-height 1.6, margin-top 8px.
Bottom right: "Powered by Zorvai" in #5a5753, 10px,
letter-spacing 0.04em.

CUSTOM TEXT CONTENT (post_type = custom_text):
Just the text in #f0ede8, 15px, line-height 1.65, margin-top 10px.
No inner card.

REACTION ROW (below all content):
margin-top 14px, padding-top 14px, border-top 1px solid #252422.
Display flex, align-items center, gap 4px.

Three reaction buttons:
Each: display flex, align-items center, gap 6px.
padding 6px 12px, border-radius 6px, font-size 14px.
Default: background transparent, color #8a8680.
Active (own reaction): background rgba(78,205,196,0.1), color #4ecdc4.
Hover: background #252422.
Transition: all 150ms ease.

Reactions: "🔥 12" "🎉 8" "💪 5"
Numbers update optimistically on click before API response.

Separator: a "·" in #2e2c29 at 16px, margin 0 8px.

Comment trigger: "3 comments" as text in #8a8680, 13px, 
cursor pointer. Hover: color #f0ede8.
If zero comments: show "Add a comment" in #5a5753, 13px.

Separator: another "·" in #2e2c29.

Encourage button: "💙 Encourage" in #8a8680, 13px, cursor pointer.
After sending: "💙 Sent" in #4ecdc4, 13px. Disabled after one send.
Only shown on other people's posts, not own.

COMMENTS SECTION (expanded on click, collapses on click again):
margin-top 12px, padding-top 12px, border-top 1px solid #252422.

Each comment:
Display flex, gap 10px, margin-bottom 12px.
Avatar: 28px circle, same color logic as post avatar.
Right side: 
Name in #f0ede8, 13px, font-weight 500 + "· 2h ago" in #5a5753, 12px.
Comment text in #8a8680, 14px, line-height 1.5.

Comment input (at bottom of comments section):
background #252422, border none, border-radius 8px,
padding 10px 14px, color #f0ede8, font-size 14px,
width 100%, outline none, resize none, min-height 40px.
Placeholder: "Add a comment..." in #5a5753.
On focus: subtle teal outline: box-shadow 0 0 0 2px rgba(78,205,196,0.2).
Press Enter to submit (not Shift+Enter). Shift+Enter adds a new line.
After submit: input clears, comment appears at bottom with fade-in.

LOAD MORE:
After all posts: centered text "Load more" in #8a8680, 13px.
Cursor pointer. Hover: color #f0ede8.
If loading: "Loading..." in #5a5753.
If no more posts: "You're all caught up" in #5a5753, 13px.

EMPTY STATE (no posts in feed yet):
Centered, margin-top 60px.
SVG: two people outline, 48px, color #2e2c29.
Heading: "Be the first to share" in #f0ede8, 18px, font-weight 600,
margin-top 16px.
Subtext: "When your child hits a milestone, we'll nudge you to
share it here. One win at a time." in #8a8680, 14px, 
line-height 1.6, max-width 280px.
Button: "Share your first win" in teal, margin-top 20px.

SHARE A WIN MODAL:
Triggered by "Share a win +" button and by nudge "Share it" buttons.
Overlay: position fixed, inset 0, background rgba(22,21,20,0.9),
backdrop-filter blur(8px), z-index 50.
Center vertically and horizontally.

Modal card: background #1e1d1b, border 1px solid #2e2c29,
border-radius 16px, width 480px, max-width calc(100vw - 40px),
padding 28px. Max-height 90vh, overflow-y auto.

Modal header:
"Share a win" in #f0ede8, 18px, font-weight 600.
Close button (×) top right: color #8a8680, font-size 20px,
cursor pointer, hover color #f0ede8.

STEP 1 — What to share (2x2 grid of option tiles):
Each tile: background #252422, border 1px solid #2e2c29,
border-radius 10px, padding 14px, cursor pointer,
text-align center, transition border-color 150ms ease.
Hover: border-color #2e2c29 (no change — hover is subtle).
Selected: border-color #4ecdc4, background rgba(78,205,196,0.08).

Tile 1: 🔥 "Streak milestone"
Tile 2: 📈 "Score improvement"
Tile 3: ✅ "Topic mastered"
Tile 4: ✍️ "Write my own"

Emoji: 24px. Label: #f0ede8, 13px, font-weight 500, margin-top 8px.

If coming from a milestone nudge: pre-select the relevant tile.

STEP 2 — Note (optional):
Shown below tiles after selection. Smooth height transition.
Label: "Add a note (optional)" in #8a8680, 12px, margin-bottom 6px.
Textarea: same style as comment input above, min-height 80px.
Character counter: right-aligned, "240/280" in #5a5753, 11px.
Under 30 chars left: #fbbf24. Under 10: #f87171.

STEP 3 — Child name privacy:
Toggle row: "Show child's name" label in #f0ede8, 14px.
Toggle: 36px wide, 20px tall pill toggle.
On (default): background #4ecdc4. Off: background #252422.
Transition: all 200ms ease.
If on: show first name input, pre-filled, 
background #252422, border 1px solid #2e2c29, border-radius 8px,
padding 8px 12px, color #f0ede8, font-size 14px, width 100%.
If off: "Posted as: A Zorvai parent" in #8a8680, 13px, font-style italic.

SUBMIT BUTTON (full width):
"Share to community" — background #4ecdc4, color #161514,
font-weight 600, font-size 15px, padding 13px, border-radius 8px,
width 100%, border none, cursor pointer, margin-top 20px.
Disabled (opacity 0.4, cursor not-allowed) until a tile is selected.
Loading state: "Sharing..." + a simple dot animation.

Disclaimer below button:
"Visible to all Zorvai families" in #5a5753, 12px, text-align center.

MOBILE (below 640px):
Modal: full-screen (100vw, 100vh, border-radius 0, padding 20px).
Reaction buttons: emoji only, no number unless it's >0.
Comments: render in a slide-up sheet instead of inline.
Milestone nudge cards: stack vertically, full width, not horizontal scroll.
Encourage button: hidden on mobile to keep the reaction row clean —
accessible via the ··· overflow menu instead.

---

## 7. COMMUNITY GUIDELINES PAGE (/parent/community/guidelines)

Plain text page, same dark design. No legal language.

Heading: "Community guidelines" in #f0ede8, 22px, font-weight 600.

Content:
"This is a space for families to celebrate what's going right.

What belongs here:
✅ Your child's study milestones and wins
✅ Encouragement for other families
✅ Honest, kind words when things feel hard

What doesn't belong here:
❌ Comparing children or results
❌ Academic advice presented as fact
❌ Anything that could identify a specific child beyond their first name
❌ Criticism, negativity, or anything you wouldn't say to someone's face

We quietly remove content that doesn't fit. Repeated issues
result in community access being paused.

Questions or concerns: hello@zorvai.ai"

---

## 8. WEEKLY DIGEST ADDITION

Add this block to the Sunday parent email digest
(only when there were community posts that week):

Subject line variant when community is active:
"[Child]'s week + what other Zorvai families are celebrating"

New section in digest HTML (after the session summary):

---
🏆 From the community this week

[3 post previews — each showing:]
"[Parent name or 'A Zorvai parent']: [milestone headline]"
e.g. "A Zorvai parent: 30-day streak! 🔥"
e.g. "Priya: Up 18% in Math this month 📈"

→ [See all wins in the community]
---

This turns the weekly email from a private data report into something
parents look forward to — a window into what's possible for other families,
making their own child's progress feel part of something bigger.
