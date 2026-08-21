'use client';

import React, { useState } from 'react';
import { Mic, MicOff, SendHorizontal } from 'lucide-react';
import { Button } from './button';

interface AudioRecorderProps {
  onSubmit: (transcript: string, method: 'voice' | 'typed') => void;
  isSubmitting?: boolean;
}

export function AudioRecorder({ onSubmit, isSubmitting = false }: AudioRecorderProps) {
  const [textMode, setTextMode] = useState(true); // Defaulting to text mode since audio is disabled
  const [transcript, setTranscript] = useState('');

  const handleSubmit = () => {
    if (transcript.trim()) {
      onSubmit(transcript, 'typed');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-medium text-lg text-[var(--color-text)]">
            Recall Phase
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-caption)] text-[var(--color-text-muted)] font-sans">
              Voice transcription not yet connected. Please type.
            </span>
          </div>
        </div>

        {/* Text Input Fallback (Active State) */}
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Type everything you can remember..."
          className="w-full h-32 p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] font-sans resize-none focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
          disabled={isSubmitting}
        />

        <div className="flex items-center justify-between mt-6">
          {/* Disabled Mic Button (Honest Shell State) */}
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-muted)] text-[var(--color-text-muted)] opacity-70 cursor-not-allowed"
            title="Voice recording coming soon"
          >
            <MicOff size={18} />
            <span className="font-sans text-sm font-medium">Record Voice</span>
          </button>

          <Button
            onClick={handleSubmit}
            disabled={!transcript.trim() || isSubmitting}
            className="rounded-full px-6 h-10 bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Recall'}
            {!isSubmitting && <SendHorizontal size={16} className="ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
