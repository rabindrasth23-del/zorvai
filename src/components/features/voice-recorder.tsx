"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface VoiceRecorderProps {
  onStopRecording?: (blob: Blob | null, duration: number) => void;
  className?: string;
}

export function VoiceRecorder({ onStopRecording, className }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Simulated audio levels for animated bars
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(12).fill(10));
  const animationRef = useRef<number | null>(null);

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
    animateBars();
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setAudioLevels(Array(12).fill(10));
    
    // Simulate blob return
    if (onStopRecording) onStopRecording(null, recordingTime);
  };

  const animateBars = () => {
    setAudioLevels((prev) => 
      prev.map(() => 10 + Math.random() * 40) // Random heights between 10% and 50%
    );
    animationRef.current = requestAnimationFrame(() => {
      setTimeout(animateBars, 100);
    });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("flex items-center gap-4 bg-surface border border-border p-3 rounded-full shadow-sm w-fit", className)}>
      {!isRecording ? (
        <Button
          onClick={startRecording}
          size="icon"
          className="rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 h-10 w-10 text-white shadow-md transition-transform active:scale-95"
        >
          <Mic className="h-5 w-5" />
          <span className="sr-only">Start recording</span>
        </Button>
      ) : (
        <Button
          onClick={stopRecording}
          size="icon"
          variant="destructive"
          className="rounded-full h-10 w-10 shadow-md transition-transform active:scale-95 animate-pulse"
        >
          <Square className="h-4 w-4 fill-current" />
          <span className="sr-only">Stop recording</span>
        </Button>
      )}

      {isRecording && (
        <>
          {/* Animated Waveform Bars */}
          <div className="flex items-center gap-1 h-6 px-2">
            {audioLevels.map((level, i) => (
              <div
                key={i}
                className="w-1 bg-[var(--color-primary)] rounded-full transition-all duration-100 ease-in-out"
                style={{ height: `${level}%` }}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="font-mono text-[var(--text-body-sm)] text-[var(--color-text)] font-medium w-12 text-right pr-2">
            {formatTime(recordingTime)}
          </div>
        </>
      )}
    </div>
  );
}
