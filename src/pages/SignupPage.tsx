import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SignupPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subscribe, setSubscribe] = useState(true);
  const [mailPref, setMailPref] = useState<"intrusive" | "non-intrusive">("non-intrusive");
  const [notifyLaunches, setNotifyLaunches] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      setOtpSent(true);
      toast.info("OTP sent to your email (prototype: enter any 6 digits)");
      return;
    }
    if (otp.length < 4) {
      toast.error("Please enter a valid OTP");
      return;
    }
    signup({
      firstName,
      lastName,
      email,
      password,
      isSubscribed: subscribe,
      mailPreference: mailPref,
      notifyLaunches,
    });
    toast.success("Account created successfully!");
    navigate("/");
  };

  const handleSocial = (provider: string) => {
    toast.info(`${provider} signup is a prototype placeholder.`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="font-display text-3xl font-bold text-primary">Blog</Link>
          <h1 className="text-2xl font-bold text-foreground mt-4">Create Account</h1>
          <p className="text-sm text-muted-foreground">Join our community today</p>
        </div>

        {/* Social */}
        <div className="space-y-3">
          <Button variant="outline" className="w-full rounded-xl h-11 gap-2" onClick={() => handleSocial("Google")}>
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </Button>
          <Button variant="outline" className="w-full rounded-xl h-11 gap-2" onClick={() => handleSocial("X")}>
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Continue with X
          </Button>
          <Button variant="outline" className="w-full rounded-xl h-11 gap-2" onClick={() => handleSocial("Apple")}>
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Continue with Apple
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-xl h-11" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-xl h-11" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl h-11" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl h-11" required />
          </div>

          {otpSent && (
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code (OTP)</Label>
              <Input id="otp" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className="rounded-xl h-11 font-mono tracking-widest text-center" maxLength={6} />
            </div>
          )}

          {/* Subscribe + Preferences */}
          <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/30">
            <div className="flex items-center gap-2">
              <Checkbox id="subscribe" checked={subscribe} onCheckedChange={(c) => setSubscribe(!!c)} />
              <Label htmlFor="subscribe" className="text-sm">Subscribe to newsletter</Label>
            </div>
            {subscribe && (
              <div className="pl-6 space-y-2">
                <Label className="text-xs text-muted-foreground">Mail Update Type</Label>
                <RadioGroup value={mailPref} onValueChange={(v) => setMailPref(v as "intrusive" | "non-intrusive")} className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="non-intrusive" id="non-intrusive" />
                    <Label htmlFor="non-intrusive" className="text-sm">Non-intrusive</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="intrusive" id="intrusive" />
                    <Label htmlFor="intrusive" className="text-sm">All updates</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox id="notify" checked={notifyLaunches} onCheckedChange={(c) => setNotifyLaunches(!!c)} />
              <Label htmlFor="notify" className="text-sm">Notify me about new launches & events</Label>
            </div>
          </div>

          <Button type="submit" className="w-full rounded-xl h-11 font-semibold">
            {otpSent ? "Create Account" : "Continue"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
