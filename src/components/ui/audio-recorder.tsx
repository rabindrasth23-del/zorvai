'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, SendHorizontal, Square, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './button';
import { motion } from 'motion/react';

interface AudioRecorderProps {
  onSubmit: (transcript: string, method: 'voice' | 'typed') => void;
  isSubmitting?: boolean;
}

export function AudioRecorder({ onSubmit, isSubmitting = false }: AudioRecorderProps) {
  const [textMode, setTextMode] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startRecording = async () => {
    setPermissionError(null);
    setTranscriptionError(null);
    setAudioBlob(null);
    setTranscript('');
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Mic permission denied:', err);
      setPermissionError('Microphone access denied. Falling back to typed mode.');
      setTextMode(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const transcribeAndSubmit = async (blob: Blob) => {
    setIsTranscribing(true);
    setTranscriptionError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', blob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to transcribe audio');
      }

      // Empty transcript check
      const resultTranscript = data.transcript?.trim() || '';
      
      // If it's effectively empty (e.g., just background noise or < 3 words)
      if (resultTranscript.length < 10 || resultTranscript.split(' ').length < 3) {
        throw new Error("We couldn't hear enough of your answer. Please try explaining again.");
      }

      setTranscript(resultTranscript);
      onSubmit(resultTranscript, 'voice');
    } catch (err) {
      setTranscriptionError(err instanceof Error ? err.message : 'Transcription failed');
      // Clear the blob so they have to record again
      setAudioBlob(null);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleTextSubmit = () => {
    if (transcript.trim()) {
      onSubmit(transcript, 'typed');
    }
  };

  // Auto-transcribe when audio blob is ready
  useEffect(() => {
    if (audioBlob && !isTranscribing) {
      transcribeAndSubmit(audioBlob);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-md overflow-hidden transition-all">
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-2">
          <div>
            <h3 className="font-display font-semibold text-xl tracking-tight text-[var(--color-text)]">
              Recall Phase
            </h3>
            <p className="font-sans text-sm text-[var(--color-text-muted)]">
              Speak your explanation aloud. The AI will listen and evaluate.
            </p>
          </div>
          {textMode && (
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--color-warning)] bg-[var(--color-warning)]/10 px-3 py-1 rounded-full shrink-0">
              <AlertCircle size={14} />
              Backup Text Mode
            </span>
          )}
        </div>

        {/* Error States */}
        {(permissionError || transcriptionError) && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/20 text-[var(--color-destructive)] flex items-start gap-2 font-sans text-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{permissionError || transcriptionError}</p>
          </motion.div>
        )}

        {/* Interaction Area */}
        {!textMode ? (
          <div className="flex flex-col items-center justify-center py-10 bg-[var(--color-bg)]/50 rounded-[var(--radius-lg)] border border-[var(--color-border)]/50">
            {isTranscribing || isSubmitting ? (
              <div className="flex flex-col items-center gap-4 text-[var(--color-primary)]">
                <Loader2 className="w-10 h-10 animate-spin" />
                <span className="font-sans font-medium text-sm">
                  {isTranscribing ? 'Transcribing your answer...' : 'Submitting...'}
                </span>
              </div>
            ) : isRecording ? (
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute inset-0 bg-[var(--color-accent)]/20 rounded-full"
                  />
                  <div className="w-20 h-20 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center relative z-10 border border-[var(--color-accent)]/30 text-[var(--color-accent)]">
                    <Mic className="w-8 h-8" />
                  </div>
                </div>
                <Button
                  onClick={stopRecording}
                  className="bg-[var(--color-text)] text-[var(--color-surface)] hover:bg-[var(--color-text)]/90 rounded-full px-8 h-12 shadow-sm font-sans font-medium"
                >
                  <Square className="w-4 h-4 mr-2 fill-current" />
                  Stop & Submit
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                  <Mic className="w-8 h-8" />
                </div>
                <Button
                  onClick={startRecording}
                  className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 rounded-full px-8 h-12 shadow-sm font-sans font-medium transition-transform hover:-translate-y-0.5"
                >
                  Start Recording
                </Button>
                <button
                  onClick={() => setTextMode(true)}
                  className="text-xs font-sans text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline underline-offset-2 transition-colors"
                >
                  Mic broken? Use text fallback (Degraded)
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Text Fallback Mode */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-4"
          >
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Type your explanation (Please try to use the microphone if possible, as speaking is the core mechanism of Recall)..."
              className="w-full h-40 p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] font-sans resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all"
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center">
              <button
                onClick={() => setTextMode(false)}
                className="text-sm font-sans text-[var(--color-primary)] hover:underline underline-offset-2"
                disabled={isSubmitting}
              >
                ← Try microphone again
              </button>
              <Button
                onClick={handleTextSubmit}
                disabled={!transcript.trim() || isSubmitting}
                className="rounded-full px-6 h-11 bg-[var(--color-text)] text-[var(--color-surface)] hover:bg-[var(--color-text)]/90 transition-opacity font-medium"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Typed Recall'}
                {!isSubmitting && <SendHorizontal size={16} className="ml-2" />}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
