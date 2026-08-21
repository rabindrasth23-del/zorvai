"use client";
import React from "react";
import { VoiceInteraction } from "@/components/ui/voice-interaction";

export default function DemoVoice() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-8 text-center text-[var(--color-text)]">Voice UI Demo</h1>
        <VoiceInteraction 
          onSubmit={(transcript, method) => {
            console.log("Submitted:", transcript, method);
            alert(`Submitted via ${method}:\n\n${transcript}`);
          }} 
        />
      </div>
    </div>
  );
}
