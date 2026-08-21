import { MessageBubbles } from "@/components/ui/message-bubbles";

export default function DemoBubblesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface p-12">
      <h1 className="text-3xl font-display font-medium text-[var(--color-text)] mb-8 text-center">
        Message Bubbles Demo
      </h1>
      
      <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-8 max-w-4xl mx-auto w-full shadow-sm">
        <MessageBubbles 
          messages={[
            { id: "1", role: "ai", content: "Hello! Today we'll be learning about photosynthesis. Are you ready to begin?" },
            { id: "2", role: "user", content: "Yes, I'm ready. Let's start!" },
            { id: "3", role: "ai", content: "Great! Photosynthesis is the process by which plants convert light energy into chemical energy. The key ingredients are water, carbon dioxide, and sunlight." },
          ]}
          isTyping={true}
        />
      </div>
    </div>
  );
}
