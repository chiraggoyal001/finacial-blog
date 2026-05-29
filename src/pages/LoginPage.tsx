import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<'google' | null>(null);
  const { login, signInWithOAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      toast.success("Logged in successfully!");
      const from = (location.state as any)?.from?.pathname || "/";
      if (result.isAdmin) {
        navigate("/admin");
      } else if (result.needsOnboarding) {
        navigate("/onboarding");
      } else {
        navigate(from);
      }
    } else {
      toast.error(result.error || "Login failed. Please check your credentials.");
    }
    
    setIsLoading(false);
  };

  const handleSocial = async (provider: 'google') => {
    setIsSocialLoading(provider);
    const result = await signInWithOAuth(provider);
    if (!result.success) {
      toast.error(result.error || `${provider} login failed`);
    }
    setIsSocialLoading(null);
  };

  return (
    <main className="flex min-h-screen w-full bg-black selection:bg-white/30 p-2 transition-all duration-500 lg:h-screen lg:overflow-hidden lg:p-4 text-white dark font-inter antialiased">
      {/* Left Column (Hero & Background Video) */}
      <div className="w-[52%] hidden lg:flex relative flex-col items-center justify-end pb-32 px-12 rounded-3xl overflow-hidden shadow-2xl h-full">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4"
            type="video/mp4"
          />
        </video>

        {/* Hero Content Container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="z-10 w-full max-w-xs space-y-8"
        >
          {/* Brand/Logo */}
          <motion.div variants={childVariants}>
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/logo.svg" alt="KAMADA Logo" className="h-14 w-auto brightness-0 invert" />
            </Link>
          </motion.div>

          {/* Heading Block */}
          <motion.div variants={childVariants} className="space-y-2">
            <h1 className="text-4xl font-medium tracking-tight whitespace-nowrap">
              Welcome Back
            </h1>
            <p className="text-white/60 text-sm leading-relaxed px-4">
              Access your personalized learning, modules, and insights.
            </p>
          </motion.div>

          {/* Steps */}
          <motion.div variants={childVariants} className="space-y-3">
            <StepItem number={1} text="Sign in to account" active />
            <StepItem number={2} text="Explore learning modules" />
            <StepItem number={3} text="Read custom newsletter" />
          </motion.div>
        </motion.div>
      </div>

      {/* Right Column (Sign In Form) */}
      <div className="flex-1 flex flex-col items-center justify-center py-6 lg:py-2 px-4 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto lg:overflow-hidden bg-black">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md space-y-5 lg:space-y-3.5"
        >
          {/* Header */}
          <div className="text-center space-y-0.5">
            <h2 className="text-2xl lg:text-3xl font-medium tracking-tight">
              {t("login.welcome")}
            </h2>
            <p className="text-white/60 text-xs lg:text-sm">
              {t("login.signInAccount")}
            </p>
          </div>

          {/* Social Buttons */}
          <div className="w-full">
            <SocialButton
              icon={
                isSocialLoading === "google" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )
              }
              label={t("login.continueGoogle")}
              onClick={() => handleSocial("google")}
              disabled={isLoading || isSocialLoading !== null}
            />
          </div>

          {/* Divider */}
          <div className="relative flex py-0.5 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 bg-black px-4 text-[10px] lg:text-xs font-medium text-white/60 uppercase tracking-widest">
              {t("login.or")}
            </span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-2.5">
            <InputGroup
              id="email"
              type="email"
              label={t("login.email")}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs lg:text-sm font-medium text-white">
                  {t("login.password")}
                </label>
                <Link to="/forgot-password" className="text-xs text-white/60 hover:text-white transition-colors">
                  {t("login.forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-brand-gray border-none rounded-xl h-10 lg:h-11 px-4 pr-10 text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/20 focus:outline-none transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 lg:h-12 bg-white text-black font-semibold rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all duration-200 mt-4 flex items-center justify-center gap-2 disabled:opacity-50 text-xs lg:text-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                t("login.signIn")
              )}
            </button>
          </form>

          <p className="text-center text-xs lg:text-sm text-white/60">
            {t("login.noAccount")}{" "}
            <Link to="/signup" className="text-white font-medium hover:underline">
              {t("login.signUp")}
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}

/* Reusable components at the bottom */

interface StepItemProps {
  number: number;
  text: string;
  active?: boolean;
}

function StepItem({ number, text, active }: StepItemProps) {
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 w-full ${
        active
          ? "bg-white text-black border border-white"
          : "bg-brand-gray text-white border-none"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
          active ? "bg-black text-white" : "bg-white/10 text-white/40"
        }`}
      >
        {number}
      </div>
      <span className="font-medium text-sm">{text}</span>
    </div>
  );
}

interface SocialButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

function SocialButton({ icon, label, onClick, disabled }: SocialButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 h-10 lg:h-11 bg-black border border-white/10 rounded-xl hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-xs lg:text-sm font-medium text-white cursor-pointer"
    >
      {icon}
      {label}
    </button>
  );
}

interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const InputGroup = React.forwardRef<HTMLInputElement, InputGroupProps>(
  ({ label, type = "text", className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full text-left">
        <label htmlFor={props.id} className="text-xs lg:text-sm font-medium text-white">
          {label}
        </label>
        <input
          ref={ref}
          type={type}
          className={`w-full bg-brand-gray border-none rounded-xl h-10 lg:h-11 px-4 text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/20 focus:outline-none transition-all duration-200 ${className}`}
          {...props}
        />
      </div>
    );
  }
);
InputGroup.displayName = "InputGroup";
