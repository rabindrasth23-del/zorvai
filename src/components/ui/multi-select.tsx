"use client";

import * as React from "react";
import { XIcon } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Command as CommandPrimitive } from "cmdk";

export interface MultiSelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value: string[];
  onChange: (value: string[]) => void;
  options?: string[]; // Array of suggested subjects
  placeholder?: string;
  maxSelections?: number;
  "aria-label"?: string;
}

export function MultiSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select or type a subject...",
  maxSelections,
  className,
  "aria-label": ariaLabel = "Multi-select input",
  ...props
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isAtMax = maxSelections !== undefined && value.length >= maxSelections;

  const handleUnselect = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleSelect = (currentValue: string) => {
    if (isAtMax) return;
    
    // Case-insensitive duplicate check
    const isDuplicate = value.some((v) => v.toLowerCase() === currentValue.toLowerCase());
    if (!isDuplicate) {
      onChange([...value, currentValue]);
    }
    setInputValue("");
    // Keep popover open after selection to allow multiple selections quickly
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      handleUnselect(value[value.length - 1]);
    }
    
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim();
      const isDuplicate = value.some((v) => v.toLowerCase() === newTag.toLowerCase());
      if (!isDuplicate && !isAtMax) {
        onChange([...value, newTag]);
      }
      setInputValue("");
      setOpen(false);
    }
    
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <CommandPrimitive shouldFilter={false} className="flex flex-col gap-[var(--space-2)] w-full overflow-visible bg-transparent">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            // role is implicitly managed by cmdk on the input itself now
            className={cn(
              "flex min-h-[52px] w-full flex-wrap items-center gap-[var(--space-2)] rounded-md border-[1.5px] border-border bg-surface px-4 py-3 transition-colors focus-within:border-border-focus focus-within:ring-[3px] focus-within:ring-ring cursor-text",
              className,
              isAtMax && "bg-[var(--color-muted)] border-transparent"
            )}
            onClick={() => {
              if (!isAtMax) {
                setOpen(true);
                inputRef.current?.focus();
              }
            }}
            {...props}
          >
            <div role="list" aria-label="Selected subjects" className="flex flex-wrap items-center gap-[var(--space-2)]">
              {value.map((tag) => (
                <span
                  key={tag}
                  role="listitem"
                  // Verified: Exact match to landing page FeaturesSection subject tag visual
                  className="flex items-center gap-1 bg-white text-[var(--color-text)] font-sans font-medium text-[var(--text-body-sm)] px-[var(--space-4)] py-[var(--space-2)] rounded-[var(--radius-full)] shadow-[var(--shadow-sm)] border border-border"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUnselect(tag);
                    }}
                    className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label={`Remove ${tag}`}
                  >
                    <XIcon className="h-3 w-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
            
            <CommandPrimitive.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              onKeyDown={handleKeyDown}
              placeholder={value.length === 0 ? placeholder : ""}
              className="flex-1 bg-transparent text-[var(--text-body)] font-sans text-foreground placeholder:text-[var(--color-text-muted)] outline-none min-w-[140px] disabled:cursor-not-allowed"
              disabled={isAtMax}
              aria-label={ariaLabel}
            />
          </div>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <CommandList>
            {inputValue.trim().length > 0 && !value.some(v => v.toLowerCase() === inputValue.trim().toLowerCase()) && (
              <CommandItem
                key="create-custom"
                value={inputValue.trim()}
                onSelect={handleSelect}
                className="font-medium text-[var(--color-primary)]"
              >
                Create &quot;{inputValue.trim()}&quot;
              </CommandItem>
            )}
            
            {options.length > 0 && (
              <CommandGroup heading="Suggestions">
                {options
                  .filter((opt) => 
                    !value.some(v => v.toLowerCase() === opt.toLowerCase()) && 
                    opt.toLowerCase().includes(inputValue.toLowerCase())
                  )
                  .slice(0, 10)
                  .map((opt) => (
                  <CommandItem
                    key={opt}
                    value={opt}
                    onSelect={(val) => {
                      handleSelect(val);
                    }}
                  >
                    {opt}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {inputValue.length === 0 && options.length === 0 && (
              <CommandEmpty>No suggestions available.</CommandEmpty>
            )}
          </CommandList>
        </PopoverContent>
      </Popover>

      {isAtMax && (
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] font-sans font-medium" aria-live="polite">
          Maximum of {maxSelections} subjects reached.
        </p>
      )}

      {/* Screen Reader Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {value.length > 0 ? `${value.length} subject${value.length === 1 ? '' : 's'} selected: ${value.join(', ')}` : "No subjects selected"}
      </div>
    </CommandPrimitive>
  );
}
