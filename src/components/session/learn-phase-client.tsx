"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageBubbles, type Message } from "@/components/ui/message-bubbles";
import { advanceToRecall } from "@/app/actions/session";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface LearnPhaseClientProps {
  sessionId: string;
  topicId: string;
  topicTitle: string;
}

export function LearnPhaseClient({ sessionId, topicId, topicTitle }: LearnPhaseClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  
  // Track if we have initiated the first fetch
  const hasFetched = useRef(false);

  const fetchLesson = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/session/teach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id: topicId,
          session_minutes: 30 // Deliberate v1 default, supports override later
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch lesson");
      }

      setMessages([
        {
          id: "1",
          role: "ai",
          content: data.lesson.content
        }
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchLesson();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, topicId]);

  const handleAdvance = async () => {
    setIsAdvancing(true);
    await advanceToRecall(sessionId);
    // Note: We don't need to setIsLoading(false) because the server action redirects on success.
    // If it fails (which it shouldn't realistically), we would handle it, but for now we just redirect.
  };

  // Only show the "Ready to Recall" button if at least one AI message has arrived
  const hasAIResponse = messages.some((m) => m.role === "ai");

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] w-full max-w-5xl mx-auto px-4 py-6 md:py-8 relative">
      <div className="flex-1 overflow-hidden relative border border-[var(--color-border)] rounded-[var(--radius-xl)] bg-[var(--color-surface)] shadow-md flex flex-col transition-all">
        {/* Header - High Density */}
        <div className="p-5 md:p-6 border-b border-[var(--color-border)] flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-bg)] gap-2">
          <div className="flex flex-col gap-1">
            <h2 className="font-display font-semibold text-2xl tracking-tight text-[var(--color-text)]">
              Learn Phase
            </h2>
            <p className="font-sans text-sm md:text-base text-[var(--color-text-muted)] max-w-2xl">
              Topic: <span className="text-[var(--color-text)] font-medium">{topicTitle}</span>
            </p>
          </div>
          {hasAIResponse && !error && (
            <span className="hidden md:flex text-xs font-medium uppercase tracking-wider text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1 rounded-full items-center">
              Active Session
            </span>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto bg-[var(--color-bg)]/30 p-2 md:p-6">
          {messages.length === 0 && !isLoading && !error ? (
            <div className="flex flex-col h-full items-center justify-center text-[var(--color-text-muted)] font-sans gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] animate-spin" />
              <p className="font-medium text-[var(--color-text)]">Generating Socratic lesson...</p>
              <p className="text-sm">Tailoring to your field, country, and timezone.</p>
            </div>
          ) : (
            <MessageBubbles 
              messages={messages} 
              isTyping={isLoading} 
            />
          )}

          {/* Error Callout */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="mt-6 mx-auto max-w-2xl p-5 rounded-[var(--radius-lg)] bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 text-[var(--color-destructive)]">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="font-sans text-sm font-medium leading-relaxed">{error}</p>
              </div>
              <Button 
                onClick={() => fetchLesson()} 
                className="shrink-0 bg-[var(--color-destructive)] text-white hover:opacity-90 rounded-full px-5 h-10 font-sans text-sm shadow-sm hover:shadow-md transition-all"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Retry Connection
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer / Transition Button */}
      <div className="mt-6 flex justify-end pb-4">
        {hasAIResponse && !error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Button 
              onClick={handleAdvance}
              disabled={isAdvancing}
              className="bg-[var(--color-primary)] text-white rounded-full px-8 h-12 text-base shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all font-sans font-medium"
            >
              {isAdvancing ? "Advancing to Recall..." : "I'm ready to Recall"}
              {!isAdvancing && <ArrowRight className="ml-2 w-5 h-5" />}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
