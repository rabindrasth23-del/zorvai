/**
 * AI Provider Engine — Zod Schemas
 *
 * One schema per call type. Every AI response is validated against
 * these before being returned to the caller. If validation fails,
 * the engine falls through to the next provider in the chain.
 */

import { z } from 'zod';
import type { CallType } from './config';

// ---------------------------------------------------------------------------
// Plan generation
// ---------------------------------------------------------------------------

export const PlanTopicSchema = z.object({
  day: z.number().int().min(1).max(7),
  title: z.string().min(1),
  description: z.string().min(1),
});

export const PlanResponseSchema = z.object({
  topics: z.array(PlanTopicSchema).min(1),
});

export type PlanResponse = z.infer<typeof PlanResponseSchema>;

// ---------------------------------------------------------------------------
// Teach (Learn phase)
// ---------------------------------------------------------------------------

export const TeachResponseSchema = z.object({
  content: z.string().min(1),
  key_concepts: z.array(z.string()).min(1),
});

export type TeachResponse = z.infer<typeof TeachResponseSchema>;

// ---------------------------------------------------------------------------
// Recall listener
// ---------------------------------------------------------------------------

/**
 * Recall is a passthrough — stores the student's spoken transcript.
 * No structured AI output to validate. The schema is minimal:
 * we accept the transcript as-is from the route, not from an AI call.
 */
export const RecallResponseSchema = z.object({
  transcript_received: z.literal(true),
});

export type RecallResponse = z.infer<typeof RecallResponseSchema>;

// ---------------------------------------------------------------------------
// Challenge generator
// ---------------------------------------------------------------------------

export const ChallengeQuestionSchema = z.object({
  type: z.enum(['fact', 'understanding', 'application', 'mixed']),
  question: z.string().min(1),
  expected_answer: z.string().min(1),
});

export const ChallengeResponseSchema = z.object({
  questions: z.array(ChallengeQuestionSchema).length(4),
});

export type ChallengeResponse = z.infer<typeof ChallengeResponseSchema>;

// ---------------------------------------------------------------------------
// Feedback evaluator
// ---------------------------------------------------------------------------

export const FeedbackResponseSchema = z.object({
  understood: z.array(z.string()),
  missed: z.array(z.string()),
  review_next: z.array(z.string()),
  passed: z.boolean(),
});

export type FeedbackResponse = z.infer<typeof FeedbackResponseSchema>;

// ---------------------------------------------------------------------------
// Chatbot
// ---------------------------------------------------------------------------

export const ChatbotResponseSchema = z.object({
  answer: z.string().min(1),
});

export type ChatbotResponse = z.infer<typeof ChatbotResponseSchema>;

// ---------------------------------------------------------------------------
// Check-in classifier (Phase 3.5)
// ---------------------------------------------------------------------------

export const CheckinResponseSchema = z.object({
  tier: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  rationale: z.string().min(1),
  suggested_session_adjustment: z.enum(['normal', 'shorter', 'pause_offer']),
  stressor_may_involve_linked_adult: z.boolean(),
});

export type CheckinResponse = z.infer<typeof CheckinResponseSchema>;

// ---------------------------------------------------------------------------
// Onboarding & Safety
// ---------------------------------------------------------------------------

export const OnboardingTransitionResponseSchema = z.object({
  transition_text: z.string().min(1),
});

export type OnboardingTransitionResponse = z.infer<typeof OnboardingTransitionResponseSchema>;

export const SafetyClassifierResponseSchema = z.object({
  safe: z.boolean(),
  flag_reason: z.string(),
});

export type SafetyClassifierResponse = z.infer<typeof SafetyClassifierResponseSchema>;

// ---------------------------------------------------------------------------
// Teach chat (conversational Learn phase — plain text response)
// ---------------------------------------------------------------------------

export const TeachChatResponseSchema = z.object({
  response: z.string().min(1),
});

export type TeachChatResponse = z.infer<typeof TeachChatResponseSchema>;

// ---------------------------------------------------------------------------
// Key concepts extraction (background call after learn conversation)
// ---------------------------------------------------------------------------

export const KeyConceptsExtractResponseSchema = z.object({
  key_concepts: z.array(z.string()).min(1),
});

export type KeyConceptsExtractResponse = z.infer<typeof KeyConceptsExtractResponseSchema>;

// ---------------------------------------------------------------------------
// Schema registry — maps call type to its Zod schema
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RESPONSE_SCHEMAS: Record<CallType, z.ZodType<any>> = {
  plan: PlanResponseSchema,
  teach: TeachResponseSchema,
  teach_chat: TeachChatResponseSchema,
  key_concepts_extract: KeyConceptsExtractResponseSchema,
  recall: RecallResponseSchema,
  challenge: ChallengeResponseSchema,
  feedback: FeedbackResponseSchema,
  chatbot: ChatbotResponseSchema,
  checkin: CheckinResponseSchema,
  onboarding_transition: OnboardingTransitionResponseSchema,
  safety_classifier: SafetyClassifierResponseSchema,
};
