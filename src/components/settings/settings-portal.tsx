"use client";

import React, { useState } from "react";
import { User, Target, Shield, HelpCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

interface SettingsPortalProps {
  initialData: {
    name: string;
    email: string;
    study_hours_per_day: number;
  };
}

type TabId = "profile" | "study" | "privacy" | "help";

export function SettingsPortal({ initialData }: SettingsPortalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const tabs = [
    { id: "profile", label: "Profile & Account", icon: User },
    { id: "study", label: "Study Preferences", icon: Target },
    { id: "privacy", label: "Privacy & Security", icon: Shield },
    { id: "help", label: "Help Center", icon: HelpCircle },
  ] as const;

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
        <nav className="flex flex-col gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] text-left font-sans text-[var(--text-body-sm)] font-medium transition-all ${
                  isActive
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
        
        <div className="mt-auto pt-8 border-t border-[var(--color-border)]">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-left font-sans text-[var(--text-body-sm)] font-medium text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded-[var(--radius-lg)] transition-all"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 bg-surface border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] p-6 md:p-10 min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8 h-full"
          >
            {activeTab === "profile" && (
              <ProfileTab initialData={initialData} />
            )}
            {activeTab === "study" && (
              <StudyTab initialData={initialData} />
            )}
            {activeTab === "privacy" && (
              <PrivacyTab />
            )}
            {activeTab === "help" && (
              <HelpTab />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function ProfileTab({ initialData }: { initialData: SettingsPortalProps["initialData"] }) {
  return (
    <div className="flex flex-col h-full animate-in fade-in">
      <h2 className="text-2xl font-display font-medium text-[var(--color-text)] mb-6">Profile & Account</h2>
      <div className="flex flex-col gap-6 max-w-md">
        <div>
          <label className="block text-[var(--text-body-sm)] font-medium text-[var(--color-text)] mb-2">Name</label>
          <input 
            type="text" 
            defaultValue={initialData.name}
            disabled
            className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] font-sans opacity-70 cursor-not-allowed focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[var(--text-body-sm)] font-medium text-[var(--color-text)] mb-2">Email Address</label>
          <input 
            type="email" 
            defaultValue={initialData.email}
            disabled
            className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] font-sans opacity-70 cursor-not-allowed focus:outline-none"
          />
        </div>
        
        <div className="pt-4 border-t border-[var(--color-border)] mt-4">
          <h3 className="text-lg font-display font-medium text-[var(--color-destructive)] mb-2">Danger Zone</h3>
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] font-sans mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <Button variant="outline" className="text-[var(--color-destructive)] border-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 font-sans">
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}

function StudyTab({ initialData }: { initialData: SettingsPortalProps["initialData"] }) {
  return (
    <div className="flex flex-col h-full animate-in fade-in">
      <h2 className="text-2xl font-display font-medium text-[var(--color-text)] mb-6">Study Preferences</h2>
      <div className="flex flex-col gap-6 max-w-md">
        <div>
          <label className="block text-[var(--text-body-sm)] font-medium text-[var(--color-text)] mb-2">Daily Goal (Hours)</label>
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="1" 
              max="8" 
              defaultValue={initialData.study_hours_per_day || 2}
              disabled
              className="flex-1 accent-[var(--color-primary)] cursor-not-allowed opacity-70"
            />
            <span className="font-mono font-medium text-[var(--color-text)] w-8 text-right">
              {initialData.study_hours_per_day}h
            </span>
          </div>
        </div>
        
        <div>
          <label className="block text-[var(--text-body-sm)] font-medium text-[var(--color-text)] mb-2">Timezone</label>
          <select disabled className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] font-sans opacity-70 cursor-not-allowed focus:outline-none">
            <option>Auto-detected</option>
          </select>
        </div>

        <div className="pt-4">
          <Button disabled className="bg-[var(--color-primary)] text-white hover:opacity-90 opacity-70 cursor-not-allowed font-sans w-full sm:w-auto">
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}

function PrivacyTab() {
  return (
    <div className="flex flex-col h-full animate-in fade-in">
      <h2 className="text-2xl font-display font-medium text-[var(--color-text)] mb-6">Privacy & Security</h2>
      
      <div className="flex flex-col gap-6">
        <div className="p-5 border border-[var(--color-border)] rounded-[var(--radius-lg)] flex gap-4 items-start bg-[var(--color-bg)]">
          <div className="mt-1">
            <input type="checkbox" defaultChecked disabled className="w-5 h-5 accent-[var(--color-primary)] rounded opacity-70" />
          </div>
          <div>
            <h3 className="font-sans font-medium text-[var(--color-text)] text-base">Allow AI Voice Analysis</h3>
            <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] font-sans mt-1 leading-relaxed">
              Permit Zorvai to transcribe your voice during the Recall phase. Audio is processed ephemerally and is not permanently stored or used to train public models.
            </p>
          </div>
        </div>

        <div className="p-5 border border-[var(--color-border)] rounded-[var(--radius-lg)] flex gap-4 items-start bg-[var(--color-bg)]">
          <div className="mt-1">
            <input type="checkbox" defaultChecked disabled className="w-5 h-5 accent-[var(--color-primary)] rounded opacity-70" />
          </div>
          <div>
            <h3 className="font-sans font-medium text-[var(--color-text)] text-base">Parent Data Sharing</h3>
            <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] font-sans mt-1 leading-relaxed">
              Allow linked parent accounts to view your study streaks, daily goals met, and subject mastery levels. Private Socratic chat transcripts are never shared.
            </p>
          </div>
        </div>
        
        <div className="pt-4">
           <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] mt-3">
             Privacy settings editing is disabled in this preview.
           </p>
        </div>
      </div>
    </div>
  );
}

function HelpTab() {
  return (
    <div className="flex flex-col h-full animate-in fade-in">
      <h2 className="text-2xl font-display font-medium text-[var(--color-text)] mb-6">Help Center</h2>
      
      <div className="flex flex-col gap-4">
        <details className="group border border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-bg)] [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer items-center justify-between gap-1.5 p-5 font-sans font-medium text-[var(--color-text)]">
            How does the Socratic Learn phase work?
            <span className="shrink-0 transition duration-300 group-open:-rotate-180">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </summary>
          <div className="p-5 pt-0 border-t border-[var(--color-border)] mt-2">
            <p className="font-sans text-[var(--text-body-sm)] text-[var(--color-text-muted)] leading-relaxed pt-2">
              Instead of lecturing you, our AI asks you targeted questions. This active recall method is scientifically proven to improve long-term retention compared to passively reading notes.
            </p>
          </div>
        </details>

        <details className="group border border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-bg)] [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer items-center justify-between gap-1.5 p-5 font-sans font-medium text-[var(--color-text)]">
            How do I link a parent account?
            <span className="shrink-0 transition duration-300 group-open:-rotate-180">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </summary>
          <div className="p-5 pt-0 border-t border-[var(--color-border)] mt-2">
            <p className="font-sans text-[var(--text-body-sm)] text-[var(--color-text-muted)] leading-relaxed pt-2">
              Go to your Dashboard and find the "Parent Connection" section. Give that 8-character invite code to your parent. Once they enter it on their dashboard, they will be linked to your account.
            </p>
          </div>
        </details>
      </div>

      <div className="mt-auto pt-8 flex items-center justify-between bg-[var(--color-primary)]/5 p-6 rounded-[var(--radius-xl)] border border-[var(--color-primary)]/10">
        <div>
          <h3 className="font-display font-medium text-[var(--color-text)] text-lg">Still need help?</h3>
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] font-sans mt-1">Our support team is here for you.</p>
        </div>
        <Button className="bg-[var(--color-primary)] text-white hover:opacity-90 font-sans rounded-full shadow-sm">
          Contact Support
        </Button>
      </div>
    </div>
  );
}
