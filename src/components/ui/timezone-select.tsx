"use client";

import { useId, useMemo, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface TimezoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
}

export function TimezoneSelect({ value, onChange, className, id }: TimezoneSelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const [open, setOpen] = useState(false);

  const timezones = useMemo(() => Intl.supportedValuesOf("timeZone"), []);

  const formattedTimezones = useMemo(() => {
    return timezones
      .map((timezone) => {
        const formatter = new Intl.DateTimeFormat("en", {
          timeZone: timezone,
          timeZoneName: "shortOffset",
        });
        const parts = formatter.formatToParts(new Date());
        const offset = parts.find((part) => part.type === "timeZoneName")?.value || "";
        const modifiedOffset = offset === "GMT" ? "GMT+0" : offset;

        return {
          value: timezone,
          label: `(${modifiedOffset}) ${timezone.replace(/_/g, " ")}`,
          numericOffset: parseInt(offset.replace("GMT", "").replace("+", "") || "0"),
        };
      })
      .sort((a, b) => a.numericOffset - b.numericOffset);
  }, [timezones]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={selectId}
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-12 w-full items-center justify-between rounded-md border-[1.5px] border-border bg-surface px-4 py-3 text-[var(--text-body)] font-sans text-foreground transition-colors focus-visible:border-border-focus focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <span className={cn("truncate", !value && "text-[var(--color-text-muted)]")}>
            {value ? formattedTimezones.find((timezone) => timezone.value === value)?.label : "Select timezone"}
          </span>
          <ChevronDownIcon size={16} className="text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command
          filter={(value, search) => {
            const normalizedValue = value.toLowerCase();
            const normalizedSearch = search.toLowerCase().replace(/\s+/g, "");
            return normalizedValue.includes(normalizedSearch) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search timezone..." />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {formattedTimezones.map(({ value: itemValue, label }) => (
                <CommandItem
                  key={itemValue}
                  value={itemValue}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  {label}
                  {value === itemValue && <CheckIcon size={16} className="ml-auto text-[var(--color-primary)]" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
