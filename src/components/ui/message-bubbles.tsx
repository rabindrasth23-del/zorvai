'use client';

import React from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { FileText, ImageIcon } from 'lucide-react';

export type MessageRole = 'ai' | 'user';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
}

interface MessageBubblesProps {
  messages: Message[];
  /** Optional typing indicator state */
  isTyping?: boolean;
}

/**
 * Renders an attachment inside a message bubble.
 * - Images: shows thumbnail if URL is still valid, graceful fallback if null/broken
 * - PDFs: shows a file card with name
 * - Null URL (deleted after phase advance): shows a muted "File was here" note
 */
function AttachmentDisplay({ url, type, name }: {
  url?: string | null;
  type?: string | null;
  name?: string | null;
}) {
  if (!type && !name) return null;

  // File was deleted (attachment_url nulled after phase advance)
  if (!url) {
    return (
      <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-xs font-sans">
        {type?.startsWith('image/') ? (
          <ImageIcon className="w-3.5 h-3.5" />
        ) : (
          <FileText className="w-3.5 h-3.5" />
        )}
        <span>{name || 'Attached file'} (no longer available)</span>
      </div>
    );
  }

  const isImage = type?.startsWith('image/');

  if (isImage) {
    return (
      <div className="mt-2 rounded-lg overflow-hidden border border-[var(--color-border)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={name || 'Attached image'}
          className="max-w-full max-h-64 object-contain bg-[var(--color-bg)]"
          onError={(e) => {
            // If image fails to load (deleted), show fallback
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <div
          className="hidden items-center gap-2 px-3 py-2 text-[var(--color-text-muted)] text-xs font-sans"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>{name || 'Image'} (no longer available)</span>
        </div>
      </div>
    );
  }

  // PDF / other document
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-primary)] text-sm font-sans hover:bg-[var(--color-primary)]/5 transition-colors"
    >
      <FileText className="w-4 h-4" />
      <span className="truncate">{name || 'Document'}</span>
    </a>
  );
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
              {isUser ? (
                // User messages: plain text
                <span>{msg.content}</span>
              ) : (
                // AI messages: rendered markdown with math support
                <div className="prose prose-sm max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2 [&_li]:mb-1 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-1 [&_code]:bg-[var(--color-surface)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-[var(--color-surface)] [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--color-primary)] [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:text-[var(--color-text-muted)] [&_strong]:font-semibold [&_em]:italic">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}

              {/* Attachment display */}
              {(msg.attachment_type || msg.attachment_name) && (
                <AttachmentDisplay
                  url={msg.attachment_url}
                  type={msg.attachment_type}
                  name={msg.attachment_name}
                />
              )}
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
