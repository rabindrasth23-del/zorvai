"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageBubbles, type Message } from "@/components/ui/message-bubbles";
import { fetchTeachLesson, advanceToRecall } from "@/app/actions/session";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface LearnPhaseClientProps {
  sessionId: string;
  topic: string;
}

export function LearnPhaseClient({ sessionId, topic }: LearnPhaseClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  
  // Track if we have initiated the first fetch
  const hasFetched = useRef(false);

  const fetchLesson = async () => {
    setIsLoading(true);
    setError(null);
    
    const result = await fetchTeachLesson(sessionId, topic);
    
    if (result.success && result.data) {
      setMessages([
        {
          id: "1",
          role: "ai",
          content: result.data.content
        }
      ]);
    } else {
      setError(result.error || "An unknown error occurred.");
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchLesson();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, topic]);

  const handleAdvance = async () => {
    setIsAdvancing(true);
    await advanceToRecall(sessionId);
    // Note: We don't need to setIsLoading(false) because the server action redirects on success.
    // If it fails (which it shouldn't realistically), we would handle it, but for now we just redirect.
  };

  // Only show the "Ready to Recall" button if at least one AI message has arrived
  const hasAIResponse = messages.some((m) => m.role === "ai");

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-4 py-8 relative">
      <div className="flex-1 overflow-hidden relative border border-[var(--color-border)] rounded-[var(--radius-xl)] bg-[var(--color-surface)] shadow-sm flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]">
          <div>
            <h2 className="font-display font-medium text-lg text-[var(--color-text)]">Learn Phase</h2>
            <p className="font-sans text-sm text-[var(--color-text-muted)]">Topic: {topic}</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !isLoading && !error ? (
            // Absolute empty state if for some reason nothing triggered
            <div className="flex h-full items-center justify-center text-[var(--color-text-muted)] font-sans">
              Preparing lesson...
            </div>
          ) : (
            <MessageBubbles 
              messages={messages} 
              isTyping={isLoading} 
            />
          )}

          {/* Error Callout (Destructive variant token-style) */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="m-6 p-4 rounded-lg bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 text-[var(--color-destructive)]">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="font-sans text-sm font-medium">{error}</p>
              </div>
              <Button 
                onClick={() => fetchLesson()} 
                className="shrink-0 bg-[var(--color-destructive)] text-white hover:opacity-90 rounded-full px-4 h-9 font-sans text-sm"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer / Transition Button */}
      <div className="mt-6 flex justify-end">
        {hasAIResponse && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button 
              onClick={handleAdvance}
              disabled={isAdvancing}
              className="bg-[var(--color-primary)] text-white rounded-full px-8 h-12 text-base shadow-sm hover:shadow-md transition-all font-sans font-medium"
            >
              {isAdvancing ? "Advancing..." : "I'm ready to Recall"}
              {!isAdvancing && <ArrowRight className="ml-2 w-5 h-5" />}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
