import React from "react";
import Image from "next/image";

export interface FeatureCard {
  icon: string;
  title: string;
  description: string;
}

interface AuthLayoutProps {
  children: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  heroImageSrc: string;
  features?: FeatureCard[];
}

const FeatureProofCard = ({ feature, delay }: { feature: FeatureCard, delay: string }) => (
  <div className={`animate-testimonial ${delay} flex flex-col gap-2 rounded-3xl bg-surface/40 backdrop-blur-xl border border-border p-5 w-64 shadow-lg`}>
    <p className="flex items-center gap-2 font-display font-semibold text-[var(--color-text)]">
      <span>{feature.icon}</span> {feature.title}
    </p>
    <p className="text-[var(--text-body-sm)] text-[var(--color-text)]/80 leading-snug">
      {feature.description}
    </p>
  </div>
);

export function AuthLayout({
  children,
  title,
  description,
  heroImageSrc,
  features = [],
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full bg-[var(--color-bg)]">
      {/* Left column: auth form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 font-display text-[var(--text-h1)] text-[var(--color-text)] leading-tight">
              {title}
            </h1>
            <p className="animate-element animate-delay-200 text-[var(--text-body)] text-[var(--color-text-muted)]">
              {description}
            </p>
            
            <div className="mt-4">
              {children}
            </div>
          </div>
        </div>
      </section>

      {/* Right column: hero image + feature proof */}
      <section className="hidden md:block flex-1 relative p-4">
        <div 
          className="animate-slide-right animate-delay-300 absolute inset-4 rounded-[var(--radius-xl)] bg-cover bg-center shadow-xl" 
          style={{ backgroundImage: `url(${heroImageSrc})` }}
        >
          {/* Subtle overlay to ensure text contrast if needed */}
          <div className="absolute inset-0 bg-black/10 rounded-[var(--radius-xl)]"></div>
        </div>
        
        {features.length > 0 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center z-10">
            <FeatureProofCard feature={features[0]} delay="animate-delay-1000" />
            {features[1] && <div className="hidden xl:flex"><FeatureProofCard feature={features[1]} delay="animate-delay-1200" /></div>}
          </div>
        )}
      </section>
    </div>
  );
}
