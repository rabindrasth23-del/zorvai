'use client';

import React from 'react';
import { motion } from 'motion/react';

export type MessageRole = 'ai' | 'user';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
}

interface MessageBubblesProps {
  messages: Message[];
  /** Optional typing indicator state */
  isTyping?: boolean;
}

export function MessageBubbles({ messages, isTyping = false }: MessageBubblesProps) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto py-4">
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        
        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.4,
              ease: [0.23, 1, 0.32, 1], // Calm, premium easing
              delay: index * 0.05,
            }}
            className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                relative max-w-[85%] px-5 py-4 font-sans text-[var(--text-body)] leading-[var(--lh-body)] shadow-sm
                ${isUser 
                  ? 'bg-[var(--color-primary)] text-white rounded-2xl rounded-br-sm' 
                  : 'bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] rounded-2xl rounded-bl-sm'
                }
              `}
            >
              {msg.content}
            </div>
          </motion.div>
        );
      })}

      {isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full justify-start"
        >
          <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl rounded-bl-sm px-4 py-4 shadow-sm flex items-center gap-1.5 h-[52px]">
            <motion.div 
              className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
            />
            <motion.div 
              className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut", delay: 0.2 }}
            />
            <motion.div 
              className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut", delay: 0.4 }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
