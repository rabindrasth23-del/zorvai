"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, SendHorizontal, Square, AlertCircle, Loader2, Volume2 } from "lucide-react";
import { Button } from "./button";
import { motion, AnimatePresence } from "motion/react";

interface VoiceInteractionProps {
  onSubmit: (transcript: string, method: "voice" | "typed") => void;
  isSubmitting?: boolean;
}

type MicState = "idle" | "requesting_permission" | "granted" | "denied";
type InteractionState = "idle" | "listening" | "ai_speaking" | "transcribing";

export function VoiceInteraction({ onSubmit, isSubmitting = false }: VoiceInteractionProps) {
  // Permission & Interaction State
  const [micState, setMicState] = useState<MicState>("idle");
  const [interactionState, setInteractionState] = useState<InteractionState>("idle");
  const [textMode, setTextMode] = useState(false);
  
  // Audio & Transcript State
  const [transcript, setTranscript] = useState("");
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecordingStream();
    };
  }, []);

  const stopRecordingStream = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  };

  const requestPermission = async () => {
    setMicState("requesting_permission");
    setPermissionError(null);
    try {
      // Just check permission, then immediately stop the stream to respect privacy
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicState("granted");
    } catch (err) {
      console.error("Mic permission denied:", err);
      setMicState("denied");
      setPermissionError("Microphone access is needed for voice sessions. You can still use the text chatbot without microphone access.");
      setTextMode(true);
    }
  };

  const startRecording = async () => {
    setTranscriptionError(null);
    setTranscript("");
    chunksRef.current = [];

    // If we haven't formally checked permission, do it now, but we actually need the stream to stay open here
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        transcribeAndSubmit(blob);
      };

      mediaRecorder.start();
      setMicState("granted");
      setInteractionState("listening");
    } catch (err) {
      console.error("Failed to start recording:", err);
      setMicState("denied");
      setPermissionError("Microphone access denied. You can still use the text chatbot without microphone access.");
      setTextMode(true);
    }
  };

  const stopRecording = () => {
    setInteractionState("idle");
    stopRecordingStream(); // This triggers onstop, which fires transcribeAndSubmit
  };

  const transcribeAndSubmit = async (blob: Blob) => {
    setInteractionState("transcribing");
    setTranscriptionError(null);

    try {
      const formData = new FormData();
      formData.append("file", blob, "recording.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to transcribe audio");
      }

      const resultTranscript = data.transcript?.trim() || "";
      
      if (resultTranscript.length < 10 || resultTranscript.split(" ").length < 3) {
        throw new Error("We couldn't hear enough of your answer. Please try explaining again.");
      }

      setTranscript(resultTranscript);
      
      // Simulate AI Speaking visually before submitting/advancing 
      // (Future extension point for real TTS)
      setInteractionState("ai_speaking");
      setTimeout(() => {
        setInteractionState("idle");
        onSubmit(resultTranscript, "voice");
      }, 1500);

    } catch (err) {
      setTranscriptionError(err instanceof Error ? err.message : "Transcription failed");
      setInteractionState("idle");
    }
  };

  const handleTextSubmit = () => {
    if (transcript.trim()) {
      onSubmit(transcript, "typed");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-md overflow-hidden transition-all">
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-2">
          <div>
            <h3 className="font-display font-semibold text-xl tracking-tight text-[var(--color-text)]">
              Recall Phase
            </h3>
            <p className="font-sans text-sm text-[var(--color-text-muted)]">
              {textMode 
                ? "Type your explanation below." 
                : "Speak your explanation aloud. The AI will listen and evaluate."}
            </p>
          </div>
          {textMode && (
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--color-warning)] bg-[var(--color-warning)]/10 px-3 py-1 rounded-full shrink-0">
              <AlertCircle size={14} />
              Text Mode
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
          <div className="flex flex-col items-center justify-center py-12 bg-[var(--color-bg)]/50 rounded-[var(--radius-lg)] border border-[var(--color-border)]/50 relative overflow-hidden">
            
            {/* Visual State: AI Speaking */}
            <AnimatePresence>
              {interactionState === "ai_speaking" && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-primary)]/5"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="w-24 h-24 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)]"
                  >
                    <Volume2 className="w-10 h-10" />
                  </motion.div>
                  <p className="mt-4 font-medium text-[var(--color-primary)]">AI is processing...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Visual State: Transcribing / Submitting */}
            {(interactionState === "transcribing" || isSubmitting) && interactionState !== "ai_speaking" ? (
              <div className="flex flex-col items-center gap-4 text-[var(--color-primary)]">
                <Loader2 className="w-10 h-10 animate-spin" />
                <span className="font-sans font-medium text-sm">
                  {interactionState === "transcribing" ? "Transcribing your answer..." : "Submitting..."}
                </span>
              </div>
            ) : interactionState === "listening" ? (
              /* Visual State: Listening */
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 bg-[var(--color-accent)] rounded-full"
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
                  Stop Listening
                </Button>
              </div>
            ) : interactionState === "idle" ? (
              /* Visual State: Idle */
              <div className="flex flex-col items-center gap-6 z-10">
                <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                  <Mic className="w-8 h-8 opacity-80" />
                </div>
                
                {micState === "idle" || micState === "requesting_permission" ? (
                  <Button
                    onClick={requestPermission}
                    disabled={micState === "requesting_permission"}
                    className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 rounded-full px-8 h-12 shadow-sm font-sans font-medium transition-transform hover:-translate-y-0.5"
                  >
                    Enable Microphone
                  </Button>
                ) : (
                  <Button
                    onClick={startRecording}
                    className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 rounded-full px-8 h-12 shadow-sm font-sans font-medium transition-transform hover:-translate-y-0.5"
                  >
                    Start Speaking
                  </Button>
                )}

                <button
                  onClick={() => setTextMode(true)}
                  className="text-xs font-sans text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline underline-offset-2 transition-colors"
                >
                  Prefer to type? Switch to text mode
                </button>
              </div>
            ) : null}
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
              placeholder="Type your explanation..."
              className="w-full h-40 p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] font-sans resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all"
              disabled={isSubmitting || interactionState !== "idle"}
            />
            <div className="flex justify-between items-center">
              <button
                onClick={() => setTextMode(false)}
                className="text-sm font-sans text-[var(--color-primary)] hover:underline underline-offset-2"
                disabled={isSubmitting || interactionState !== "idle"}
              >
                ← Switch to voice mode
              </button>
              <Button
                onClick={handleTextSubmit}
                disabled={!transcript.trim() || isSubmitting || interactionState !== "idle"}
                className="rounded-full px-6 h-11 bg-[var(--color-text)] text-[var(--color-surface)] hover:bg-[var(--color-text)]/90 transition-opacity font-medium"
              >
                {isSubmitting ? "Submitting..." : "Submit Typed Recall"}
                {!isSubmitting && <SendHorizontal size={16} className="ml-2" />}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
