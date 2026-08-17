"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

export type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  showMarks?: boolean;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, showMarks = false, min = 1, max = 5, step = 1, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    min={min}
    max={max}
    step={step}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-border">
      <SliderPrimitive.Range className="absolute h-full bg-[var(--color-primary)]" />
    </SliderPrimitive.Track>
    
    {/* Render optional marks for 1-5 step slider */}
    {showMarks && (
      <div className="absolute w-full flex justify-between px-2.5 top-5">
        {Array.from({ length: max - min + 1 }).map((_, i) => (
          <span key={i} className="text-[var(--text-caption)] text-[var(--color-text-muted)] font-sans">
            {min + i}
          </span>
        ))}
      </div>
    )}

    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-[var(--color-primary)] bg-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-[var(--color-muted)] cursor-grab active:cursor-grabbing" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
