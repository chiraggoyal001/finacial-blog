import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";
import { Loader2, Check, X, Shield, ChevronDown, Eye, EyeOff } from "lucide-react";
import zxcvbn from "zxcvbn";

const SignupPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subscribe, setSubscribe] = useState(true);
  const [mailPref, setMailPref] = useState<"intrusive" | "non-intrusive">("non-intrusive");
  const [notifyLaunches, setNotifyLaunches] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showRequirementsError, setShowRequirementsError] = useState(false);
  const { signup, signInWithOAuth } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Check for pending subscription from anonymous user flow
  useEffect(() => {
    const pendingEmail = localStorage.getItem("pendingSubscriptionEmail");
    const pendingFrequency = localStorage.getItem("pendingSubscriptionFrequency");
    
    if (pendingEmail) {
      setEmail(pendingEmail);
      setSubscribe(true);
      // Set mail preference based on frequency
      if (pendingFrequency === "daily") {
        setMailPref("intrusive");
      } else {
        setMailPref("non-intrusive");
      }
      // Clear the pending subscription data
      localStorage.removeItem("pendingSubscriptionEmail");
      localStorage.removeItem("pendingSubscriptionFrequency");
    }
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  // Password requirements for visual feedback (not strict enforcement)
  const requirements = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "At least one uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "At least one lowercase letter", test: (p: string) => /[a-z]/.test(p) },
    { label: "At least one number", test: (p: string) => /[0-9]/.test(p) },
    { label: "At least one special character", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  ];

  // Calculate password strength and check requirements
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, feedback: { suggestions: [] } };
    return zxcvbn(password);
  }, [password]);

  const metRequirements = requirements.map(req => req.test(password));
  const metCount = metRequirements.filter(Boolean).length;
  const allRequirementsMet = metCount === requirements.length;

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return false;
    }
    // Allow weak passwords with a warning - only block if < 8 chars
    setPasswordError("");
    return true;
  };

  const getStrengthColor = (score: number) => {
    const colors = ["bg-red-500", "bg-red-400", "bg-yellow-400", "bg-green-400", "bg-green-500"];
    return colors[score] || "bg-gray-200";
  };

  const getStrengthLabel = (score: number) => {
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    return labels[score] || "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    if (!allRequirementsMet) {
      setShowRequirementsError(true);
      setPasswordError("Please meet all password requirements");
      return;
    }
    setShowRequirementsError(false);
    
    setIsLoading(true);
    
    const result = await signup({ 
      firstName, 
      lastName, 
      email, 
      password, 
      isSubscribed: subscribe, 
      mailPreference: mailPref, 
      notifyLaunches 
    });
    
    if (result.success) {
      if (result.error) {
        // Email confirmation required
        toast.success("Account created! " + result.error);
        navigate("/login");
      } else {
        toast.success("Account created successfully!");
        // Redirect to onboarding to complete profile
        navigate("/onboarding");
      }
    } else {
      toast.error(result.error || "Signup failed. Please try again.");
    }
    
    setIsLoading(false);
  };

  const handleSocial = async (provider: 'google' | 'twitter') => {
    const result = await signInWithOAuth(provider);
    if (!result.success) {
      toast.error(result.error || `${provider} signup failed`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="font-display text-3xl font-bold text-primary">Blog</Link>
          <h1 className="text-2xl font-bold text-foreground mt-4">{t("signup.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("signup.subtitle")}</p>
        </div>
        <div className="space-y-3">
          <Button variant="outline" className="w-full rounded-xl h-11 gap-2" onClick={() => handleSocial("google")}>
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {t("login.continueGoogle")}
          </Button>
          <Button variant="outline" className="w-full rounded-xl h-11 gap-2" onClick={() => handleSocial("twitter")}>
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            {t("login.continueX")}
          </Button>
        </div>
        <div className="flex items-center gap-3"><Separator className="flex-1" /><span className="text-xs text-muted-foreground">{t("login.or")}</span><Separator className="flex-1" /></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="firstName">{t("signup.firstName")}</Label><Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-xl h-11" required /></div>
            <div className="space-y-2"><Label htmlFor="lastName">{t("signup.lastName")}</Label><Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-xl h-11" required /></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("login.email")}</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => validateEmail(e.target.value)}
              className={`rounded-xl h-11 ${emailError ? "border-red-500" : ""}`} 
              required 
            />
            {emailError && <p className="text-xs text-red-500">{emailError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("login.password")}</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"}
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                onBlur={(e) => {
                  validatePassword(e.target.value);
                }}
                className={`rounded-xl h-11 pr-10 ${passwordError ? "border-red-500" : ""}`} 
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Password Requirements Tooltip */}
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1 cursor-help"
                  >
                    <Shield className={`h-4 w-4 ${allRequirementsMet ? "text-green-500" : "text-muted-foreground"}`} />
                    <span>{metCount}/{requirements.length} requirements met</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="start"
                  sideOffset={8}
                  className="w-72 p-3 space-y-2 bg-popover border shadow-lg"
                >
                  {/* Strength Meter in Tooltip */}
                  {password.length > 0 && (
                    <div className="space-y-1.5 pb-2 border-b">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${getStrengthColor(passwordStrength.score)}`}
                            style={{ width: `${(passwordStrength.score + 1) * 20}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          passwordStrength.score <= 1 ? "text-red-500" : 
                          passwordStrength.score === 2 ? "text-yellow-600" : "text-green-600"
                        }`}>
                          {getStrengthLabel(passwordStrength.score)}
                        </span>
                      </div>
                      {passwordStrength.feedback.suggestions.length > 0 && (
                        <p className="text-xs text-muted-foreground leading-tight">
                          {passwordStrength.feedback.suggestions[0]}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Requirements List */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-foreground">Requirements:</p>
                    <div className="space-y-1">
                      {requirements.map((req, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs">
                          {metRequirements[idx] ? (
                            <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                          ) : (
                            <X className="h-3 w-3 text-gray-300 flex-shrink-0" />
                          )}
                          <span className={metRequirements[idx] ? "text-green-600" : "text-muted-foreground"}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground pt-1.5 border-t leading-tight">
                    8+ chars recommended. Mix letters, numbers, and symbols.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
            
            {/* Requirements Error - shown when validation fails on submit */}
            {showRequirementsError && !allRequirementsMet && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                <p className="text-xs font-medium text-red-600">Password requirements not met:</p>
                <div className="space-y-1">
                  {requirements.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs">
                      {metRequirements[idx] ? (
                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="h-3 w-3 text-red-400 flex-shrink-0" />
                      )}
                      <span className={metRequirements[idx] ? "text-green-600" : "text-red-500"}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/30">
            <div className="flex items-center gap-2"><Checkbox id="subscribe" checked={subscribe} onCheckedChange={(c) => setSubscribe(!!c)} /><Label htmlFor="subscribe" className="text-sm">{t("signup.subscribeNewsletter")}</Label></div>
            {subscribe && (
              <div className="pl-6 space-y-2">
                <Label className="text-xs text-muted-foreground">{t("signup.mailType")}</Label>
                <RadioGroup value={mailPref} onValueChange={(v) => setMailPref(v as "intrusive" | "non-intrusive")} className="flex gap-4">
                  <div className="flex items-center gap-1.5"><RadioGroupItem value="non-intrusive" id="non-intrusive" /><Label htmlFor="non-intrusive" className="text-sm">{t("signup.nonIntrusive")}</Label></div>
                  <div className="flex items-center gap-1.5"><RadioGroupItem value="intrusive" id="intrusive" /><Label htmlFor="intrusive" className="text-sm">{t("signup.allUpdates")}</Label></div>
                </RadioGroup>
              </div>
            )}
            <div className="flex items-center gap-2"><Checkbox id="notify" checked={notifyLaunches} onCheckedChange={(c) => setNotifyLaunches(!!c)} /><Label htmlFor="notify" className="text-sm">{t("signup.notifyLaunches")}</Label></div>
          </div>
          <Button type="submit" className="w-full rounded-xl h-11 font-semibold" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              t("signup.createAccount")
            )}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">{t("signup.haveAccount")}{" "}<Link to="/login" className="text-primary font-medium hover:underline">{t("signup.logIn")}</Link></p>
      </div>
    </div>
  );
};

export default SignupPage;
