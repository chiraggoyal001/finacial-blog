import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useAnalytics } from "@/lib/analytics";
import { toast } from "sonner";
import { Loader2, User, MapPin, Briefcase, Heart, Sparkles, ChevronRight, Check } from "lucide-react";
import { FINANCE_INTERESTS, INDIAN_STATES } from "@/lib/types";

interface ProfileFormData {
  age: string;
  region: string;
  interests: string[];
  profession: string;
  hobbies: string;
  description: string;
}

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, markOnboardingComplete } = useAuth();
  const { trackOnboardingComplete, trackOnboardingSkip } = useAnalytics();
  const [isLoading, setIsLoading] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [completedFields, setCompletedFields] = useState(0);

  // Refs for field navigation
  const ageRef = useRef<HTMLInputElement>(null);
  const regionRef = useRef<HTMLSelectElement>(null);
  const professionRef = useRef<HTMLInputElement>(null);
  const hobbiesRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Handle Enter key to move to next field
  const handleKeyDown = (e: React.KeyboardEvent, nextRef?: React.RefObject<HTMLElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
      } else {
        // Last field - submit form
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const [formData, setFormData] = useState<ProfileFormData>({
    age: "",
    region: "",
    interests: [],
    profession: "",
    hobbies: "",
    description: "",
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  // Calculate completion progress
  useEffect(() => {
    let count = 0;
    if (formData.age && parseInt(formData.age) > 0) count++;
    if (formData.region) count++;
    if (formData.interests.length > 0) count++;
    if (formData.profession.trim()) count++;
    if (formData.hobbies.trim()) count++;
    if (formData.description.trim()) count++;
    setCompletedFields(count);
  }, [formData]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          age: formData.age ? parseInt(formData.age) : null,
          region: formData.region || null,
          interests: formData.interests.length > 0 ? formData.interests : null,
          profession: formData.profession || null,
          hobbies: formData.hobbies || null,
          description: formData.description || null,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (error) {
        toast.error("Failed to save profile. Please try again.");
        console.error(error);
        return;
      }

      // Track analytics and update AuthContext
      trackOnboardingComplete();
      markOnboardingComplete(); // Removes navbar badge

      toast.success("Profile completed! Welcome aboard.");
      navigate("/");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;

    setIsSkipping(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          onboarding_skipped_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error marking onboarding skipped:", error);
      }

      // Track onboarding skip with count of filled fields
      trackOnboardingSkip(completedFields);

      toast.info("You can complete your profile anytime from the profile page.");
      navigate("/");
    } catch (error) {
      navigate("/");
    } finally {
      setIsSkipping(false);
    }
  };

  const getProgressPercentage = () => {
    return Math.round((completedFields / 6) * 100);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Progress Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Complete Your Profile
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Help us personalize your experience. All fields are optional - fill as many as you'd like!
          </p>
          
          {/* Progress Bar */}
          <div className="mt-6 max-w-xs mx-auto">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Profile Completion</span>
              <span>{getProgressPercentage()}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {completedFields} of 6 fields completed
            </p>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Section */}
          <div className="rounded-xl border border-border bg-muted/30 p-6 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">About You</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Age */}
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium">
                  Age
                </Label>
                <Input
                  ref={ageRef}
                  id="age"
                  type="number"
                  placeholder="25"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, regionRef)}
                  className="rounded-xl h-11"
                  min="1"
                  max="120"
                />
                <p className="text-xs text-muted-foreground">
                  Helps us recommend age-appropriate content
                </p>
              </div>

              {/* Region */}
              <div className="space-y-2">
                <Label htmlFor="region" className="text-sm font-medium">
                  Region
                </Label>
                <select
                  ref={regionRef}
                  id="region"
                  value={formData.region}
                  onChange={(e) => handleInputChange("region", e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, professionRef)}
                  className="w-full h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Select your state</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  For region-specific financial insights
                </p>
              </div>
            </div>

            {/* Profession */}
            <div className="space-y-2">
              <Label htmlFor="profession" className="text-sm font-medium">
                Profession
              </Label>
              <Input
                ref={professionRef}
                id="profession"
                placeholder="e.g., Software Engineer, Student, Business Owner"
                value={formData.profession}
                onChange={(e) => handleInputChange("profession", e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, hobbiesRef)}
                className="rounded-xl h-11"
              />
              <p className="text-xs text-muted-foreground">
                Helps us suggest relevant financial strategies
              </p>
            </div>
          </div>

          {/* Interests Section */}
          <div className="rounded-xl border border-border bg-muted/30 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">Your Interests</h2>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Financial Topics You're Interested In
              </Label>
              <div className="flex flex-wrap gap-2">
                {FINANCE_INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                      formData.interests.includes(interest)
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {formData.interests.includes(interest) && (
                        <Check className="h-3 w-3" />
                      )}
                      {interest}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Select all that apply. We'll curate content based on your interests.
              </p>
            </div>
          </div>

          {/* Personal Touch Section */}
          <div className="rounded-xl border border-border bg-muted/30 p-6 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">Personal Touch</h2>
            </div>

            {/* Hobbies */}
            <div className="space-y-2">
              <Label htmlFor="hobbies" className="text-sm font-medium">
                Hobbies
              </Label>
              <Input
                ref={hobbiesRef}
                id="hobbies"
                placeholder="e.g., Reading, Traveling, Cricket, Photography"
                value={formData.hobbies}
                onChange={(e) => handleInputChange("hobbies", e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, descriptionRef)}
                className="rounded-xl h-11"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Tell Us About Yourself
              </Label>
              <Textarea
                ref={descriptionRef}
                id="description"
                placeholder="Share a bit about your financial goals, experience level, or what you hope to learn..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, undefined)}
                className="rounded-xl min-h-[100px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This helps us understand your financial journey better
              </p>
            </div>
          </div>

          {/* Completion Preview */}
          {completedFields >= 3 && (
            <div className="rounded-xl border border-green-200 bg-green-50/50 dark:bg-green-950/20 p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium text-green-800 dark:text-green-300">
                    Great progress!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                    You've filled {completedFields} fields. Your profile will help us deliver personalized content.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 rounded-xl h-11 font-semibold"
              disabled={isLoading || isSkipping}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Profile
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              className="rounded-xl h-11 px-6"
              disabled={isLoading || isSkipping}
            >
              {isSkipping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Skipping...
                </>
              ) : (
                "Skip for Now"
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            You can always update these details later in your profile settings
          </p>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
