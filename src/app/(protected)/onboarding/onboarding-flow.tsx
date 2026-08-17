"use client";

import * as React from "react";
import { Stepper, Step } from "@/components/ui/stepper";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useRouter } from "next/navigation";
import { MultiSelect } from "@/components/ui/multi-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitOnboardingAction } from "./actions";

// Define the steps
const steps = [
  { id: "basics", title: "Basics" },
  { id: "location", title: "Location" },
  { id: "setup", title: "Setup" },
  { id: "commitment", title: "Commitment" },
  { id: "finish", title: "Finish" }
];

export function OnboardingFlow() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [languageOpen, setLanguageOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  
  // State for all onboarding data
  const [formData, setFormData] = React.useState({
    name: "",
    field: "",
    customField: "", // For the "Other" free-text fallback
    country: "",
    timezone: "",
    educationLevel: "",
    subjects: [] as string[],
    language: "",
    study_hours_per_day: 0.5, // Default to visual minimum
    studyHoursTouched: false, // Track if user engaged with the slider
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Silent timezone auto-capture on mount
  React.useEffect(() => {
    try {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detectedTimezone) {
        setFormData(prev => ({ ...prev, timezone: detectedTimezone }));
      }
    } catch (e) {
      console.error("Failed to detect timezone", e);
    }
  }, []);

  const handleNext = () => {
    // Validate Step 1
    if (currentStep === 0) {
      const newErrors: Record<string, string> = {};
      if (!formData.name.trim()) newErrors.name = "Name is required";
      if (!formData.field) newErrors.field = "Please select a field of study";
      if (formData.field === "Other" && !formData.customField.trim()) {
        newErrors.customField = "Please specify your field";
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
    }

    // Validate Step 2
    if (currentStep === 1) {
      const newErrors: Record<string, string> = {};
      if (!formData.country.trim()) newErrors.country = "Country is required";
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
    }

    // Validate Step 3
    if (currentStep === 2) {
      const newErrors: Record<string, string> = {};
      if (!formData.educationLevel) newErrors.educationLevel = "Please select your education level";
      if (formData.subjects.length === 0) newErrors.subjects = "Please add at least one subject";
      if (!formData.language) newErrors.language = "Please select your primary language";
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
    }

    // Validate Step 4
    if (currentStep === 3) {
      const newErrors: Record<string, string> = {};
      
      // Require the user to interact with the slider to consciously confirm their commitment
      if (!formData.studyHoursTouched) {
        newErrors.study_hours_per_day = "Please adjust the slider to confirm your daily study target.";
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSubmit = () => {
    setSubmitError(null);
    startTransition(async () => {
      const payload = {
        name: formData.name,
        field: formData.field === "Other" ? formData.customField : formData.field,
        country: formData.country,
        timezone: formData.timezone,
        educationLevel: formData.educationLevel as "Middle School" | "High School" | "University" | "Professional or Self-Study",
        subjects: formData.subjects,
        language: formData.language,
        studyHoursPerDay: formData.study_hours_per_day,
      };

      const { error } = await submitOnboardingAction(payload);
      
      if (error) {
        setSubmitError(error);
      } else {
        router.push("/dashboard");
      }
    });
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="bg-surface rounded-3xl border border-border p-6 sm:p-10 shadow-sm animate-element">
      <Stepper steps={steps} currentStep={currentStep} className="mb-10" />

      <div className="min-h-[300px]">
        {/* STEP 1: BASICS */}
        {currentStep === 0 && (
          <div className="space-y-8 animate-element">
            <div className="space-y-2">
              <h2 className="text-[var(--text-h3)] font-display text-[var(--color-text)]">
                Let's start with the basics
              </h2>
              <p className="text-[var(--text-body)] text-[var(--color-text-muted)] font-sans">
                Tell us your name and what you're focusing on right now.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-[var(--text-body-sm)] font-medium text-[var(--color-text)] font-sans">
                  What's your name?
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Alex"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="flex h-12 w-full rounded-xl border-[1.5px] border-border bg-transparent px-4 py-2 text-[var(--text-body)] font-sans text-[var(--color-text)] transition-colors focus-visible:outline-none focus-visible:border-[var(--color-border-focus)] focus-visible:ring-[3px] focus-visible:ring-ring aria-[invalid=true]:border-[var(--color-destructive)]"
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <span className="text-[var(--text-caption)] text-[var(--color-destructive)] font-sans">
                    {errors.name}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="field" className="text-[var(--text-body-sm)] font-medium text-[var(--color-text)] font-sans">
                  What field are you studying?
                </label>
                <Select
                  value={formData.field}
                  onValueChange={(value) => setFormData({ ...formData, field: value })}
                >
                  <SelectTrigger 
                    id="field"
                    className={`h-12 rounded-xl border-[1.5px] ${errors.field ? 'border-[var(--color-destructive)]' : 'border-border'}`}
                  >
                    <SelectValue placeholder="Select your primary field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="School">School / High School</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Medicine">Medicine / Healthcare</SelectItem>
                    <SelectItem value="Programming">Programming / Tech</SelectItem>
                    <SelectItem value="Exam Prep">Exam Prep (SAT, MCAT, etc.)</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.field && (
                  <span className="text-[var(--text-caption)] text-[var(--color-destructive)] font-sans">
                    {errors.field}
                  </span>
                )}
              </div>

              {formData.field === "Other" && (
                <div className="space-y-2 animate-element">
                  <label htmlFor="customField" className="text-[var(--text-body-sm)] font-medium text-[var(--color-text)] font-sans">
                    Please specify your field
                  </label>
                  <input
                    id="customField"
                    type="text"
                    placeholder="e.g. Law, Architecture, Languages"
                    value={formData.customField}
                    onChange={(e) => setFormData({ ...formData, customField: e.target.value })}
                    className="flex h-12 w-full rounded-xl border-[1.5px] border-border bg-transparent px-4 py-2 text-[var(--text-body)] font-sans text-[var(--color-text)] transition-colors focus-visible:outline-none focus-visible:border-[var(--color-border-focus)] focus-visible:ring-[3px] focus-visible:ring-ring aria-[invalid=true]:border-[var(--color-destructive)]"
                    aria-invalid={!!errors.customField}
                  />
                  {errors.customField && (
                    <span className="text-[var(--text-caption)] text-[var(--color-destructive)] font-sans">
                      {errors.customField}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: LOCATION */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-element">
            <div className="space-y-2">
              <h2 className="text-[var(--text-h3)] font-display text-[var(--color-text)]">
                Where are you studying?
              </h2>
              <p className="text-[var(--text-body)] text-[var(--color-text-muted)] font-sans">
                This helps us personalize examples and align with your local curriculum.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="country" className="text-[var(--text-body-sm)] font-medium text-[var(--color-text)] font-sans">
                  Country
                </label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData({ ...formData, country: value })}
                >
                  <SelectTrigger 
                    id="country"
                    className={`h-12 rounded-xl border-[1.5px] ${errors.country ? 'border-[var(--color-destructive)]' : 'border-border'}`}
                  >
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {[
                      "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
                    ].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && (
                  <span className="text-[var(--text-caption)] text-[var(--color-destructive)] font-sans">
                    {errors.country}
                  </span>
                )}
              </div>
              
              {/* Silent timezone capture confirmation.
                  Guarded by `formData.timezone && ...` which means it will not render
                  at all while `timezone` is empty string (initial state), nor will it 
                  show 'undefined'. It only appears after the useEffect successfully populates it. 
              */}
              {formData.timezone && (
                <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] font-sans flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Timezone auto-detected as {formData.timezone}
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: SETUP */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-element">
            <div className="space-y-2">
              <h2 className="text-[var(--text-h3)] font-display text-[var(--color-text)]">
                What are you focusing on?
              </h2>
              <p className="text-[var(--text-body)] text-[var(--color-text-muted)] font-sans">
                Set up your curriculum and language preferences.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[var(--text-body-sm)] font-medium text-[var(--color-text)] font-sans">
                  Education Level
                </label>
                <Select
                  value={formData.educationLevel}
                  onValueChange={(value) => setFormData({ ...formData, educationLevel: value })}
                >
                  <SelectTrigger 
                    className={`h-12 rounded-xl border-[1.5px] ${errors.educationLevel ? 'border-[var(--color-destructive)]' : 'border-border'}`}
                  >
                    <SelectValue placeholder="Select your education level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Middle School">Middle School</SelectItem>
                    <SelectItem value="High School">High School</SelectItem>
                    <SelectItem value="University">University</SelectItem>
                    <SelectItem value="Professional or Self-Study">Professional or Self-Study</SelectItem>
                  </SelectContent>
                </Select>
                {errors.educationLevel && (
                  <span className="text-[var(--text-caption)] text-[var(--color-destructive)] font-sans">
                    {errors.educationLevel}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[var(--text-body-sm)] font-medium text-[var(--color-text)] font-sans">
                  Subjects
                </label>
                <MultiSelect
                  value={formData.subjects}
                  onChange={(val) => setFormData({ ...formData, subjects: val })}
                  options={["Math", "Physics", "Chemistry", "Biology", "History", "Literature", "Computer Science", "Economics", "Psychology", "Law", "Medicine", "Philosophy"]}
                  placeholder="Select or type subjects (e.g. Calculus, Organic Chemistry)"
                  className={errors.subjects ? 'border-[var(--color-destructive)]' : ''}
                />
                {errors.subjects && (
                  <span className="text-[var(--text-caption)] text-[var(--color-destructive)] font-sans">
                    {errors.subjects}
                  </span>
                )}
              </div>

              <div className="space-y-2 flex flex-col">
                <label className="text-[var(--text-body-sm)] font-medium text-[var(--color-text)] font-sans">
                  Primary Language
                </label>
                <Popover open={languageOpen} onOpenChange={setLanguageOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={languageOpen}
                      className={`h-12 justify-between rounded-xl border-[1.5px] px-4 font-normal hover:bg-transparent ${
                        !formData.language ? "text-[var(--color-text-muted)]" : "text-[var(--color-text)]"
                      } ${errors.language ? 'border-[var(--color-destructive)]' : 'border-border'}`}
                    >
                      {formData.language || "Select a language..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search languages..." />
                      <CommandList className="max-h-[250px]">
                        <CommandEmpty>No language found.</CommandEmpty>
                        <CommandGroup>
                          {[
                            "English", "Spanish", "French", "German", "Chinese", "Japanese", 
                            "Korean", "Arabic", "Hindi", "Portuguese", "Russian", "Italian",
                            "Dutch", "Turkish", "Vietnamese", "Indonesian", "Thai", "Swedish"
                          ].map((lang) => (
                            <CommandItem
                              key={lang}
                              value={lang}
                              onSelect={(currentValue) => {
                                setFormData({ ...formData, language: lang })
                                setLanguageOpen(false)
                              }}
                              className="text-[var(--text-body)]"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.language === lang ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {lang}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.language && (
                  <span className="text-[var(--text-caption)] text-[var(--color-destructive)] font-sans">
                    {errors.language}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: COMMITMENT */}
        {currentStep === 3 && (
          <div className="space-y-8 animate-element">
            <div className="space-y-2">
              <h2 className="text-[var(--text-h3)] font-display text-[var(--color-text)]">
                Make a commitment.
              </h2>
              <p className="text-[var(--text-body)] text-[var(--color-text-muted)] font-sans">
                Set a realistic daily target. Consistency matters more than cramming.
              </p>
            </div>

            <div className="space-y-8 mt-12">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label id="study-hours-label" className="text-[var(--text-body)] font-medium text-[var(--color-text)] font-sans">
                    Target Study Time
                  </label>
                  <span className="text-[var(--text-h4)] font-display text-[var(--color-primary)] font-bold">
                    {formData.studyHoursTouched ? `${formData.study_hours_per_day.toFixed(1)} hrs / day` : "Set a target"}
                  </span>
                </div>
                
                <Slider
                  min={0.5}
                  max={8.0}
                  step={0.5}
                  value={[formData.study_hours_per_day]}
                  onValueChange={(vals) => setFormData({ ...formData, study_hours_per_day: vals[0], studyHoursTouched: true })}
                  className="pt-4"
                  aria-labelledby="study-hours-label"
                  aria-valuetext={formData.studyHoursTouched ? `${formData.study_hours_per_day} hours per day` : "No target set"}
                />
                
                <div className="flex justify-between text-[var(--text-caption)] text-[var(--color-text-muted)] font-sans px-1">
                  <span>0.5 hrs</span>
                  <span>4.0 hrs</span>
                  <span>8.0 hrs</span>
                </div>

                {errors.study_hours_per_day && (
                  <p className="text-[var(--text-caption)] text-[var(--color-destructive)] font-sans mt-2" role="alert">
                    {errors.study_hours_per_day}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: FINISH */}
        {currentStep === 4 && (
          <div className="space-y-8 animate-element flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="h-16 w-16 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-[var(--text-h3)] font-display text-[var(--color-text)]">
                You're all set
              </h2>
              <p className="text-[var(--text-body)] text-[var(--color-text-muted)] font-sans max-w-md mx-auto">
                Your personalized learning environment is ready. We'll track your daily target of {formData.study_hours_per_day} hours.
              </p>
            </div>
            
            {submitError && (
              <div 
                className="w-full max-w-md p-4 mt-6 bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] rounded-xl border border-[var(--color-destructive)]/20 text-sm font-medium font-sans flex items-start text-left"
                role="alert"
                aria-live="assertive"
              >
                <div className="mr-3 mt-0.5" aria-hidden="true">⚠️</div>
                <div>{submitError}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-10 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || isPending}
          className="rounded-xl h-11 px-6 font-sans border-border"
          aria-label="Go back to previous step"
        >
          Back
        </Button>
        <Button
          onClick={currentStep === steps.length - 1 ? handleSubmit : handleNext}
          disabled={isPending}
          className="rounded-xl h-11 px-8 font-sans font-medium min-w-[140px]"
          aria-live="polite"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Saving...</span>
            </>
          ) : currentStep === steps.length - 1 ? (
            "Complete Setup"
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </div>
  );
}
