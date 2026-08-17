"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface ChatInterfaceProps {
  messages: ChatMessage[];
  className?: string;
}

export function ChatInterface({ messages, className }: ChatInterfaceProps) {
  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-3xl mx-auto", className)}>
      {messages.map((message) => {
        const isUser = message.role === "user";
        return (
          <div
            key={message.id}
            className={cn(
              "flex gap-4 max-w-[85%]",
              isUser ? "self-end flex-row-reverse" : "self-start"
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "flex items-center justify-center h-8 w-8 rounded-full shrink-0 shadow-sm",
                isUser ? "bg-[var(--color-accent)] text-white" : "bg-[var(--color-primary)] text-white"
              )}
            >
              {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            {/* Bubble */}
            <div className="flex flex-col gap-1">
              <div
                className={cn(
                  "p-4 rounded-[var(--radius-lg)] font-sans text-[var(--text-body)] shadow-sm leading-relaxed",
                  isUser
                    ? "bg-white border border-border text-[var(--color-text)] rounded-tr-none"
                    : "bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10 text-[var(--color-text)] rounded-tl-none"
                )}
              >
                {message.content}
              </div>
              {message.timestamp && (
                <span
                  className={cn(
                    "text-[var(--text-caption)] font-sans text-[var(--color-text-muted)] mt-1",
                    isUser ? "text-right" : "text-left"
                  )}
                >
                  {message.timestamp}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
