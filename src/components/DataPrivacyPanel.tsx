import React, { useEffect, useState } from "react";
import { Shield, Check, X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ConsentCategory {
  label: string;
  description: string;
  purpose: string;
  required: boolean;
  consented: boolean;
}

/**
 * Data Privacy Settings Panel — DPDPA Compliance
 * 
 * Renders a toggleable list of data consent categories.
 * Syncs with the backend consent API.
 */
const DataPrivacyPanel = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Record<string, ConsentCategory>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const CHATBOT_API_URL = import.meta.env.VITE_CHATBOT_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    fetch(`${CHATBOT_API_URL}/api/consent/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories);
        }
      })
      .catch(() => {
        // Default categories if backend unavailable
        setCategories({
          browsing: {
            label: "Browsing Activity",
            description: "Pages visited, scroll depth, time spent on articles",
            purpose: "Personalize content recommendations",
            required: false,
            consented: false,
          },
          financial: {
            label: "Financial Interests",
            description: "Calculator inputs, investment topics discussed in chat",
            purpose: "Provide relevant financial education",
            required: false,
            consented: false,
          },
          personal: {
            label: "Profile Information",
            description: "Name, age, region, profession from your profile",
            purpose: "Personalize responses to your life stage",
            required: false,
            consented: false,
          },
          behavioral: {
            label: "Engagement Patterns",
            description: "Reading patterns, return visits, topic preferences",
            purpose: "Improve proactive suggestion relevance",
            required: false,
            consented: false,
          },
          chat_history: {
            label: "Chat History",
            description: "Previous conversations with the chatbot",
            purpose: "Maintain conversation context",
            required: true,
            consented: true,
          },
        });
      })
      .finally(() => setLoading(false));
  }, [user?.id, CHATBOT_API_URL]);

  const handleToggle = async (category: string) => {
    if (!user?.id) return;
    const cat = categories[category];
    if (!cat || cat.required) return;

    const newValue = !cat.consented;
    setUpdating(category);

    try {
      await fetch(`${CHATBOT_API_URL}/api/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          category,
          granted: newValue,
        }),
      });

      setCategories((prev) => ({
        ...prev,
        [category]: { ...prev[category], consented: newValue },
      }));
    } catch {
      // Revert on error — keep UI consistent
    } finally {
      setUpdating(null);
    }
  };

  if (!user?.id) {
    return null; // Don't show for anonymous users
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="font-display text-base font-semibold text-foreground">
          Data Privacy Settings
        </h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Control what data the AI chatbot can use to personalize your experience.
        Required data cannot be disabled as it's needed for basic functionality.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(categories).map(([key, cat]) => (
            <div
              key={key}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                cat.consented
                  ? "border-primary/20 bg-primary/5"
                  : "border-border bg-background"
              }`}
            >
              {/* Toggle */}
              <button
                onClick={() => handleToggle(key)}
                disabled={cat.required || updating === key}
                className={`mt-0.5 flex-shrink-0 w-9 h-5 rounded-full transition-colors relative ${
                  cat.consented ? "bg-primary" : "bg-muted"
                } ${cat.required ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:opacity-90"}`}
                aria-label={`${cat.consented ? "Disable" : "Enable"} ${cat.label}`}
              >
                {updating === key ? (
                  <Loader2 className="absolute top-0.5 left-1 h-4 w-4 animate-spin text-white" />
                ) : (
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow transition-transform absolute top-0.5 ${
                      cat.consented ? "translate-x-[18px]" : "translate-x-0.5"
                    }`}
                  />
                )}
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {cat.label}
                  </span>
                  {cat.required && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cat.description}
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  <strong>Purpose:</strong> {cat.purpose}
                </p>
              </div>

              {/* Status icon */}
              <div className="flex-shrink-0 mt-0.5">
                {cat.consented ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/60 pt-2 border-t border-border">
        In compliance with the Digital Personal Data Protection Act (DPDPA), 2023.
        You can change these settings at any time. Withdrawing consent will take effect immediately.
      </p>
    </div>
  );
};

export default DataPrivacyPanel;
