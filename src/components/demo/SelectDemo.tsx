import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useId } from "react";

export function SelectDemo() {
  const id = useId();
  return (
    <div className="space-y-[var(--space-2)] min-w-[300px]">
      <Label htmlFor={id}>Field of Study (Re-themed Select)</Label>
      <Select defaultValue="1">
        <SelectTrigger id={id}>
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">School</SelectItem>
          <SelectItem value="2">Engineering</SelectItem>
          <SelectItem value="3">Medicine</SelectItem>
          <SelectItem value="4">Law</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
