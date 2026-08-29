"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MessageBubbles, type Message } from "@/components/ui/message-bubbles";
import { advanceToRecall } from "@/app/actions/session";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw, ArrowRight, Send, Paperclip, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LearnPhaseClientProps {
  sessionId: string;
  topicId: string;
  topicTitle: string;
}

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
];
const MAX_IMAGE_MB = 10;
const MAX_PDF_MB = 20;

export function LearnPhaseClient({ sessionId, topicId, topicTitle }: LearnPhaseClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [inputText, setInputText] = useState("");
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    base64: string;
    preview?: string;
  } | null>(null);

  const hasFetched = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track the real session ID (may differ from prop if a new session was created)
  const realSessionId = useRef(sessionId);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  // Restore messages on mount, or fetch initial lesson if none exist
  const initializeSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First try to restore existing messages
      const restoreRes = await fetch(`/api/session/teach/messages?session_id=${sessionId}`);
      if (restoreRes.ok) {
        const restoreData = await restoreRes.json();
        if (restoreData.messages && restoreData.messages.length > 0) {
          setMessages(restoreData.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            attachment_url: m.attachment_url,
            attachment_type: m.attachment_type,
            attachment_name: m.attachment_name,
          })));
          setIsLoading(false);
          scrollToBottom();
          return;
        }
      }

      // No existing messages — generate initial lesson
      const response = await fetch('/api/session/teach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id: topicId,
          session_minutes: 30,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch lesson");
      }

      // Store the real session ID returned by the API
      if (data.session_id) {
        realSessionId.current = data.session_id;
      }

      // Restore from DB again to get the persisted message with its real ID
      const afterRes = await fetch(`/api/session/teach/messages?session_id=${realSessionId.current}`);
      if (afterRes.ok) {
        const afterData = await afterRes.json();
        if (afterData.messages && afterData.messages.length > 0) {
          setMessages(afterData.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            attachment_url: m.attachment_url,
            attachment_type: m.attachment_type,
            attachment_name: m.attachment_name,
          })));
        }
      } else {
        // Fallback: show the lesson content directly
        setMessages([{
          id: "initial-lesson",
          role: "ai",
          content: data.lesson.content,
        }]);
      }

      scrollToBottom();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, topicId, scrollToBottom]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      initializeSession();
    }
  }, [initializeSession]);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`File type not supported. Use: JPEG, PNG, GIF, WebP, or PDF.`);
      return;
    }

    // Validate size
    const maxMB = file.type.startsWith('image/') ? MAX_IMAGE_MB : MAX_PDF_MB;
    if (file.size > maxMB * 1024 * 1024) {
      setError(`File too large. Maximum: ${maxMB}MB.`);
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1]; // Remove data:xxx;base64, prefix
      const preview = file.type.startsWith('image/') ? result : undefined;
      setPendingFile({ file, base64, preview });
      setError(null);
    };
    reader.readAsDataURL(file);

    // Reset file input so the same file can be selected again
    e.target.value = '';
  };

  // Send a chat message
  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text && !pendingFile) return;
    if (isSending) return;

    setIsSending(true);
    setError(null);

    // Optimistic: add student message immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      role: "user",
      content: text || (pendingFile ? `[Attached: ${pendingFile.file.name}]` : ""),
      attachment_url: pendingFile?.preview || null,
      attachment_type: pendingFile?.file.type || null,
      attachment_name: pendingFile?.file.name || null,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setInputText("");
    const currentFile = pendingFile;
    setPendingFile(null);
    scrollToBottom();

    try {
      const payload: any = {
        session_id: realSessionId.current,
        message: text || `Please look at the attached file: ${currentFile?.file.name}`,
      };

      if (currentFile) {
        payload.attachment = {
          base64: currentFile.base64,
          type: currentFile.file.type,
          name: currentFile.file.name,
        };
      }

      const response = await fetch('/api/session/teach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      // Add AI response
      setMessages(prev => [
        ...prev,
        {
          id: data.message.id,
          role: "ai" as const,
          content: data.message.content,
        },
      ]);
      scrollToBottom();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleAdvance = async () => {
    setIsAdvancing(true);
    try {
      await advanceToRecall(realSessionId.current);
    } catch {
      setIsAdvancing(false);
      setError("Failed to advance to recall phase.");
    }
  };

  const hasAIResponse = messages.some((m) => m.role === "ai");

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] w-full max-w-5xl mx-auto px-4 py-6 md:py-8 relative">
      <div className="flex-1 overflow-hidden relative border border-[var(--color-border)] rounded-[var(--radius-xl)] bg-[var(--color-surface)] shadow-md flex flex-col transition-all">
        {/* Header */}
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
              isTyping={isLoading || isSending} 
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
              {messages.length === 0 && (
                <Button 
                  onClick={() => { hasFetched.current = false; initializeSession(); }}
                  className="shrink-0 bg-[var(--color-destructive)] text-white hover:opacity-90 rounded-full px-5 h-10 font-sans text-sm shadow-sm hover:shadow-md transition-all"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Retry Connection
                </Button>
              )}
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Chat Input Area */}
        {hasAIResponse && (
          <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:p-4">
            {/* Pending file preview */}
            <AnimatePresence>
              {pendingFile && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]"
                >
                  {pendingFile.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pendingFile.preview} alt="Preview" className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-[var(--color-primary)]/10 flex items-center justify-center">
                      <Paperclip className="w-4 h-4 text-[var(--color-primary)]" />
                    </div>
                  )}
                  <span className="flex-1 text-sm font-sans text-[var(--color-text)] truncate">
                    {pendingFile.file.name}
                  </span>
                  <button
                    onClick={() => setPendingFile(null)}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors p-1"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-end gap-2 max-w-2xl mx-auto">
              {/* File upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors disabled:opacity-50"
                aria-label="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Text input */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a follow-up question..."
                  disabled={isSending}
                  rows={1}
                  className="w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 pr-12 font-sans text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] disabled:opacity-50 transition-all max-h-32"
                  style={{ minHeight: '42px' }}
                  onInput={(e) => {
                    const el = e.target as HTMLTextAreaElement;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 128) + 'px';
                  }}
                />
              </div>

              {/* Send button */}
              <button
                onClick={sendMessage}
                disabled={isSending || (!inputText.trim() && !pendingFile)}
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-primary)] text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
              {isAdvancing ? "Extracting key concepts & advancing..." : "I'm ready to Recall"}
              {!isAdvancing && <ArrowRight className="ml-2 w-5 h-5" />}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
