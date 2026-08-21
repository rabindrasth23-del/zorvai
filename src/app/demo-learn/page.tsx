"use client";

import React, { useState } from "react";
import { MessageBubbles, type Message } from "@/components/ui/message-bubbles";
import { Button } from "@/components/ui/button";

export default function DemoLearnPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: "Let's dive into photosynthesis! Where do you think plants get the energy to create their own food?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { id: Date.now().toString(), role: "user" as const, content: input }];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setMessages([...newMessages, { 
        id: (Date.now() + 1).toString(), 
        role: "ai", 
        content: "That's exactly right! The sun provides the energy. What is the green pigment in plants that absorbs this sunlight?" 
      }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[100vh] w-full max-w-5xl mx-auto px-4 py-6 md:py-8 relative bg-[var(--color-bg)]">
      <div className="flex-1 overflow-hidden relative border border-[var(--color-border)] rounded-[var(--radius-xl)] bg-[var(--color-surface)] shadow-md flex flex-col transition-all">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-[var(--color-border)] flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-bg)] gap-2">
          <div className="flex flex-col gap-1">
            <h2 className="font-display font-semibold text-2xl tracking-tight text-[var(--color-text)]">
              Learn Phase Demo
            </h2>
            <p className="font-sans text-sm md:text-base text-[var(--color-text-muted)] max-w-2xl">
              Topic: <span className="text-[var(--color-text)] font-medium">Photosynthesis</span>
            </p>
          </div>
          <span className="hidden md:flex text-xs font-medium uppercase tracking-wider text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1 rounded-full items-center">
            Active Session
          </span>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto bg-[var(--color-bg)]/30 p-2 md:p-6 pb-20">
          <MessageBubbles messages={messages} isTyping={isTyping} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] absolute bottom-0 w-full left-0">
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer..."
              disabled={isTyping}
              className="flex-1 rounded-full border border-[var(--color-border)] px-4 py-2 font-sans focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
            />
            <Button type="submit" disabled={isTyping || !input.trim()} className="rounded-full bg-[var(--color-primary)] text-white px-6">
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
