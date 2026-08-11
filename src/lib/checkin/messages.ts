/**
 * Check-in Escalation — Fixed Notification Copy
 *
 * These are versioned, non-AI-generated messages.
 * The model classifies tier — it does NOT generate these messages.
 * This is the single most important implementation constraint:
 * it removes the highest-variance failure mode (the model inventing
 * something wrong in a high-stakes moment).
 *
 * TODO: Real copy pending expert review — do not launch with placeholder text.
 * See Checkin Escalation doc Section 4 for requirements.
 */

// ---------------------------------------------------------------------------
// Tier 1 — Parent notification (non-urgent)
// ---------------------------------------------------------------------------

// TODO: real copy pending expert review
export const TIER_1_PARENT_NOTIFICATION = {
  title: 'Check-in from Zorvai',
  body: "Your student shared something during today's check-in that sounded heavier than usual academic stress. They've been told we're letting you know so you can check in with them. No immediate concern — just a heads-up to connect when you have a moment.",
  version: '0.1.0-placeholder',
};

// ---------------------------------------------------------------------------
// Tier 1 — Student-facing disclosure (shown in UI, not model-generated)
// ---------------------------------------------------------------------------

// TODO: real copy pending expert review
export const TIER_1_STUDENT_DISCLOSURE = {
  acknowledgment:
    "It sounds like things are feeling heavier than usual — that's okay to share.",
  disclosure:
    "I'm going to let a trusted adult know so they can check in with you. This isn't about getting in trouble — it's just so someone who cares about you knows what's going on.",
  session_note:
    'We can keep going with a shorter session, or you can take a break — totally up to you.',
  version: '0.1.0-placeholder',
};

// ---------------------------------------------------------------------------
// Tier 2 — Parent notification (urgent)
// ---------------------------------------------------------------------------

// TODO: real copy pending expert review
export const TIER_2_PARENT_NOTIFICATION_URGENT = {
  title: 'Urgent: Check-in from Zorvai',
  body: "Your student expressed something during today's session that suggests they may need immediate support. Please reach out to them as soon as possible. If you're concerned about their safety, contact your local emergency services.",
  version: '0.1.0-placeholder',
};

// ---------------------------------------------------------------------------
// Tier 2 — Student-facing safety message (shown in UI, not model-generated)
// ---------------------------------------------------------------------------

// TODO: real copy pending expert review
// TODO: Crisis resource contact info must be sourced from a real directory
//       for the launch country — do NOT hardcode placeholder numbers.
export const TIER_2_STUDENT_SAFETY_MESSAGE = {
  acknowledgment:
    "I hear you, and I want you to know that what you're feeling matters.",
  disclosure:
    "I'm going to let a trusted adult know so they can check in with you — this isn't about getting in trouble, it's about making sure you have support.",
  // TODO: Replace with real, sourced crisis resource for launch country
  crisis_resources: '(Crisis resource contact info will be configured per launch country)',
  session_note:
    "You can pause your session anytime — there's no penalty. Take care of yourself first.",
  version: '0.1.0-placeholder',
};

// ---------------------------------------------------------------------------
// Review queue reason templates
// ---------------------------------------------------------------------------

export const REVIEW_QUEUE_REASONS = {
  adult_stressor_tier_1:
    'Tier 1 escalation with stressor_may_involve_linked_adult=true. Auto-notification suppressed — requires manual review before any parent contact.',
  adult_stressor_tier_2:
    'Tier 2 escalation with stressor_may_involve_linked_adult=true. Auto-notification suppressed — requires immediate manual review. Standard parent notification may be harmful.',
};
