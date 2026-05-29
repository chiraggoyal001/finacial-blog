import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React__default, { useState, useEffect, useRef, useCallback } from "react";
import { Plus, X, ThumbsUp, ThumbsDown, RefreshCw, MoreHorizontal, ChevronDown, Send } from "lucide-react";
import { u as useAuth, S as Skeleton, I as Input, B as Button } from "./server-build-vbFEqsCI.js";
import "node:stream";
import "@react-router/node";
import "react-router";
import "isbot";
import "react-dom/server";
import "@tanstack/react-query";
import "next-themes";
import "sonner";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-tooltip";
import "@supabase/supabase-js";
import "@radix-ui/react-slot";
import "react-router-dom";
import "@radix-ui/react-switch";
import "@radix-ui/react-dialog";
import "@radix-ui/react-avatar";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-radio-group";
import "@radix-ui/react-label";
import "@radix-ui/react-progress";
import "@radix-ui/react-separator";
import "dompurify";
import "motion/react";
import "@radix-ui/react-checkbox";
import "zxcvbn";
import "@radix-ui/react-select";
import "@radix-ui/react-tabs";
import "@radix-ui/react-slider";
import "react-day-picker";
import "@radix-ui/react-scroll-area";
import "recharts";
import "@radix-ui/react-alert-dialog";
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);
  return prefersReducedMotion;
};
const usePrefersContrast = () => {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-contrast: more)");
    setPrefersHighContrast(mediaQuery.matches);
    const handleChange = (e) => {
      setPrefersHighContrast(e.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);
  return prefersHighContrast;
};
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      const hasTouch = window.matchMedia("(pointer: coarse)").matches;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(hasTouch || isSmallScreen);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return isMobile;
};
const QUICK_REPLIES = [
  "What modules are available?",
  "How do I subscribe?",
  "Tell me about the Junior section",
  "What events are upcoming?"
];
const GYAAN_AVATAR = "🦉";
const formatMessageContent = (text, isUser = false) => {
  if (!text) return "";
  const bulletRegex = /\*(?=\s*[\uD800-\uDFFF\u2600-\u27BF]|\s+)/g;
  const processedText = text.replace(bulletRegex, "\n• ");
  const sections = processedText.split("---");
  return sections.map((section, secIdx) => {
    const lines = section.split("\n");
    const renderedLines = lines.map((line, lineIdx) => {
      const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
      const parsedBold = boldParts.map((boldPart, boldIdx) => {
        let isBold = false;
        let textToParse = boldPart;
        if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
          isBold = true;
          textToParse = boldPart.slice(2, -2);
        }
        const italicParts = textToParse.split(/(\*[^*]+\*)/g);
        const parsedItalic = italicParts.map((italicPart, italicIdx) => {
          let isItalic = false;
          let textToFormat = italicPart;
          if (italicPart.startsWith("*") && italicPart.endsWith("*")) {
            isItalic = true;
            textToFormat = italicPart.slice(1, -1);
          }
          const codeParts = textToFormat.split(/(`[^`]+`)/g);
          const parsedCode = codeParts.map((codePart, codeIdx) => {
            let isCode = false;
            let textToHighlight = codePart;
            if (codePart.startsWith("`") && codePart.endsWith("`")) {
              isCode = true;
              textToHighlight = codePart.slice(1, -1);
            }
            const rupeeRegex = /(₹\d+(?:\.\d+)?(?:,\d+)*(?:\s*(?:Lakh|Crore|Lakhs|Crores|k|M|B|\/month))?)/g;
            const rupeeParts = textToHighlight.split(rupeeRegex);
            const parsedRupees = rupeeParts.map((rupeePart, rupeeIdx) => {
              if (rupeePart.startsWith("₹")) {
                return /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: `font-mono font-semibold ${isUser ? "text-primary-foreground/90 underline decoration-dotted" : "text-amber-700 dark:text-amber-400"}`,
                    children: rupeePart
                  },
                  `r-${rupeeIdx}`
                );
              }
              return rupeePart;
            });
            if (isCode) {
              return /* @__PURE__ */ jsx(
                "code",
                {
                  className: `font-mono text-xs px-1.5 py-0.5 rounded font-semibold ${isUser ? "bg-black/20 text-primary-foreground" : "bg-muted text-secondary-foreground"}`,
                  children: parsedRupees
                },
                `c-${codeIdx}`
              );
            }
            return /* @__PURE__ */ jsx(React__default.Fragment, { children: parsedRupees }, `c-${codeIdx}`);
          });
          if (isItalic) {
            return /* @__PURE__ */ jsx(
              "span",
              {
                className: `italic ${isUser ? "opacity-90" : "text-foreground/80 font-light"}`,
                children: parsedCode
              },
              `i-${italicIdx}`
            );
          }
          return /* @__PURE__ */ jsx(React__default.Fragment, { children: parsedCode }, `i-${italicIdx}`);
        });
        if (isBold) {
          return /* @__PURE__ */ jsx(
            "strong",
            {
              className: `font-semibold ${isUser ? "text-primary-foreground" : "text-foreground"}`,
              children: parsedItalic
            },
            `b-${boldIdx}`
          );
        }
        return /* @__PURE__ */ jsx(React__default.Fragment, { children: parsedItalic }, `b-${boldIdx}`);
      });
      const trimmedLine = line.trim();
      const isBullet = trimmedLine.startsWith("•");
      return /* @__PURE__ */ jsx(
        "span",
        {
          className: `block ${isBullet ? "pl-4 -indent-4 my-1" : ""} leading-relaxed`,
          children: lines.length > 1 && trimmedLine === "" ? /* @__PURE__ */ jsx("span", { className: "block h-2" }) : parsedBold
        },
        lineIdx
      );
    });
    return /* @__PURE__ */ jsxs(React__default.Fragment, { children: [
      secIdx > 0 && /* @__PURE__ */ jsx("hr", { className: "my-2 border-border/40" }),
      renderedLines
    ] }, secIdx);
  });
};
const getConfidenceLevel = (content) => {
  const lower = content.toLowerCase();
  if (lower.includes("predict") || lower.includes("forecast") || lower.includes("will go up") || lower.includes("returns") || lower.includes("buy") || lower.includes("sell") || lower.includes("portfolio") || lower.includes("personalized")) {
    return "low";
  }
  if (lower.includes("recommend") || lower.includes("should") || lower.includes("suggest") || lower.includes("compare") || lower.includes("better than") || lower.includes("stocks") || lower.includes("invest") || lower.includes("subscribe")) {
    return "medium";
  }
  return "high";
};
const getRelativeTime = (date) => {
  const now = /* @__PURE__ */ new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1e3);
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};
const ChatbotWidget = () => {
  var _a, _b;
  const { user } = useAuth();
  const [isBot, setIsBot] = useState(false);
  useEffect(() => {
    const AI_BOT_REGEX = /gptbot|chatgpt|claudebot|claude-web|google-extended|applebot-extended|perplexitybot|cohere-cohere-ai|facebookbot|bytesspider|headless|phantomjs|selenium|playwright|puppeteer/i;
    if (typeof navigator !== "undefined" && AI_BOT_REGEX.test(navigator.userAgent)) {
      setIsBot(true);
    }
  }, []);
  if (isBot) return null;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hasCustomPos, setHasCustomPos] = useState(false);
  const [chatPosition, setChatPosition] = useState({ horizontal: "left", vertical: "bottom" });
  const [streamingId, setStreamingId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const [isFabVisible, setIsFabVisible] = useState(true);
  const [chatSize, setChatSize] = useState({ width: 320, height: 450 });
  const [isResizing, setIsResizing] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [suggestedFollowUps, setSuggestedFollowUps] = useState([]);
  const [failedMessageId, setFailedMessageId] = useState(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const chatEndRef = useRef(null);
  const fabRef = useRef(null);
  const streamIntervalRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const closeButtonRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const SCROLL_THRESHOLD = 100;
  const prefersReducedMotion = useReducedMotion();
  const prefersHighContrast = usePrefersContrast();
  const isMobile = useIsMobile();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const swipeRef = useRef(null);
  const [nudgeBubble, setNudgeBubble] = useState(null);
  const nudgeTimerRef = useRef(null);
  useEffect(() => {
    if (isOpen || !(user == null ? void 0 : user.id)) return;
    const CHATBOT_API_URL = "https://finacial-chatbot.onrender.com";
    let cancelled = false;
    const checkNudge = async () => {
      try {
        const resp = await fetch(`${CHATBOT_API_URL}/api/nudge/${user.id}`, {
          headers: {
            "X-Client-Platform": "Web-Kamada-Human"
          }
        });
        if (!resp.ok || cancelled) return;
        const data = await resp.json();
        if (data.should_nudge && data.opener_text && !cancelled) {
          setNudgeBubble({
            text: data.opener_text,
            nudgeId: data.nudge_id,
            type: data.nudge_type
          });
          setUnreadCount(1);
          nudgeTimerRef.current = setTimeout(() => {
            if (!cancelled) setNudgeBubble(null);
          }, 15e3);
        }
      } catch {
      }
    };
    const timer = setTimeout(checkNudge, 3e4);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    };
  }, [isOpen, user == null ? void 0 : user.id]);
  useEffect(() => {
    var _a2;
    (_a2 = chatEndRef.current) == null ? void 0 : _a2.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, streamingId]);
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setIsScrolledUp(distanceFromBottom > SCROLL_THRESHOLD);
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [messages.length]);
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);
  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, []);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);
  useEffect(() => {
    var _a2;
    if (!isOpen) return;
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;
    (_a2 = inputRef.current) == null ? void 0 : _a2.focus();
    const focusableElements = chatContainer.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const handleTabKey = (e) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement == null ? void 0 : lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement == null ? void 0 : firstElement.focus();
      }
    };
    document.addEventListener("keydown", handleTabKey);
    return () => document.removeEventListener("keydown", handleTabKey);
  }, [isOpen]);
  useEffect(() => {
    var _a2;
    if (!isOpen) {
      (_a2 = fabRef.current) == null ? void 0 : _a2.focus();
    }
  }, [isOpen]);
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "bot" && !streamingId) {
      setAnnouncement(`Gyaan AI: ${lastMessage.content}`);
    }
  }, [messages, streamingId]);
  const now = () => /* @__PURE__ */ new Date();
  const scrollToBottom = useCallback(() => {
    var _a2;
    (_a2 = chatEndRef.current) == null ? void 0 : _a2.scrollIntoView({ behavior: "smooth" });
  }, []);
  const startNewChat = useCallback(() => {
    setMessages([]);
    setInput("");
    setIsTyping(false);
    setStreamingId(null);
    setSuggestedFollowUps([]);
    setFailedMessageId(null);
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
  }, []);
  useCallback((messageId, fullText, emoji) => {
    let currentIndex = 0;
    const charsPerTick = 2;
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
    }
    streamIntervalRef.current = setInterval(() => {
      currentIndex += charsPerTick;
      if (currentIndex >= fullText.length) {
        currentIndex = fullText.length;
        if (streamIntervalRef.current) {
          clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
        }
        setStreamingId(null);
      }
      setMessages(
        (prev) => prev.map(
          (m) => m.id === messageId ? { ...m, content: fullText.slice(0, currentIndex) } : m
        )
      );
    }, 30);
  }, []);
  const sendMessage = useCallback(async (text, isRetry = false) => {
    var _a2;
    if (!text.trim()) return;
    if (!isRetry) {
      setFailedMessageId(null);
      setSuggestedFollowUps([]);
    }
    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      time: now()
    };
    if (!isRetry) {
      setMessages((prev) => [...prev, userMsg]);
    }
    setInput("");
    setIsTyping(true);
    const botMsgId = (Date.now() + 1).toString();
    const botMsg = { id: botMsgId, role: "bot", content: "", time: now() };
    try {
      const chatHistory = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content
      }));
      const CHATBOT_API_URL = "https://finacial-chatbot.onrender.com";
      const response = await fetch(`${CHATBOT_API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Platform": "Web-Kamada-Human"
        },
        body: JSON.stringify({
          message: text,
          user_id: (user == null ? void 0 : user.id) || null,
          session_id: sessionIdRef.current,
          history: chatHistory,
          article_slug: window.location.pathname
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
      setStreamingId(botMsgId);
      const reader = (_a2 = response.body) == null ? void 0 : _a2.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      let buffer = "";
      let currentEvent = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            if (trimmedLine.startsWith("event: ")) {
              currentEvent = trimmedLine.slice(7).trim();
              continue;
            }
            if (trimmedLine.startsWith("data: ")) {
              const data = trimmedLine.slice(6);
              if (currentEvent === "done") {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.session_id) {
                    sessionIdRef.current = parsed.session_id;
                  }
                  setSuggestedFollowUps(["Tell me more", "What else can you do?", "Help me with finance"]);
                } catch (e) {
                  console.error("Failed to parse done event:", e);
                }
              } else if (currentEvent === "error") {
                console.error("Chatbot error event:", data);
                setMessages(
                  (prev) => prev.map(
                    (m) => m.id === botMsgId ? {
                      ...m,
                      content: "Sorry, I encountered an error. Please try again.",
                      failed: true
                    } : m
                  )
                );
                setFailedMessageId(botMsgId);
              } else {
                fullResponse += data;
                setMessages(
                  (prev) => prev.map(
                    (m) => m.id === botMsgId ? { ...m, content: fullResponse } : m
                  )
                );
              }
            }
          }
        }
      }
      setStreamingId(null);
      if (!fullResponse) {
        const syncResp = await fetch(`${CHATBOT_API_URL}/api/chat/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Client-Platform": "Web-Kamada-Human"
          },
          body: JSON.stringify({
            message: text,
            user_id: (user == null ? void 0 : user.id) || null,
            history: chatHistory
          })
        });
        const syncData = await syncResp.json();
        if (syncData.response) {
          fullResponse = syncData.response;
          setMessages(
            (prev) => prev.map(
              (m) => m.id === botMsgId ? { ...m, content: fullResponse } : m
            )
          );
        }
        setSuggestedFollowUps(["Tell me more", "What else can you do?", "Help me with finance"]);
      }
    } catch (err) {
      console.error("Error calling chatbot:", err);
      setIsTyping(false);
      setStreamingId(null);
      const errorMsgId = Date.now().toString();
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== botMsgId);
        return [...filtered, {
          id: errorMsgId,
          role: "bot",
          content: "I'm having trouble connecting right now. Please try again later.",
          time: now(),
          failed: true
        }];
      });
      setFailedMessageId(errorMsgId);
    }
  }, [user, messages]);
  const handleRetry = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage) {
      setMessages((prev) => prev.filter((m) => m.id !== failedMessageId));
      setFailedMessageId(null);
      sendMessage(lastUserMessage.content, true);
    }
  }, [messages, failedMessageId, sendMessage]);
  const sessionIdRef = useRef(null);
  const handleFeedback = useCallback((messageId, type) => {
    setMessages(
      (prev) => prev.map(
        (m) => m.id === messageId ? { ...m, feedback: m.feedback === type ? null : type } : m
      )
    );
    const CHATBOT_API_URL = "https://finacial-chatbot.onrender.com";
    fetch(`${CHATBOT_API_URL}/api/chat/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Platform": "Web-Kamada-Human"
      },
      body: JSON.stringify({
        message_id: messageId,
        session_id: sessionIdRef.current,
        feedback: type,
        user_id: (user == null ? void 0 : user.id) || null
      })
    }).catch(() => {
    });
  }, [user == null ? void 0 : user.id]);
  const handleMouseDown = (e) => {
    if (isOpen) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      elemX: hasCustomPos ? position.x : 0,
      elemY: hasCustomPos ? position.y : 0
    };
  };
  const handleTouchStart = useCallback((e) => {
    if (isOpen || !isMobile) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      elemX: hasCustomPos ? position.x : 0,
      elemY: hasCustomPos ? position.y : 0
    };
  }, [isOpen, hasCustomPos, position, isMobile]);
  const handleChatTouchStart = useCallback((e) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    swipeRef.current = { startY: touch.clientY, startTime: Date.now() };
  }, [isMobile]);
  const handleChatTouchEnd = useCallback((e) => {
    if (!isMobile || !swipeRef.current || !isOpen) return;
    const touch = e.changedTouches[0];
    const deltaY = touch.clientY - swipeRef.current.startY;
    const deltaTime = Date.now() - swipeRef.current.startTime;
    if (deltaY > 80 && deltaTime < 300) {
      setIsOpen(false);
    }
    swipeRef.current = null;
  }, [isMobile, isOpen]);
  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: chatSize.width,
      startHeight: chatSize.height
    };
  };
  useEffect(() => {
    const handleResizeMove = (e) => {
      if (!isResizing || !resizeRef.current) return;
      const dx = e.clientX - resizeRef.current.startX;
      const dy = e.clientY - resizeRef.current.startY;
      const widthMultiplier = chatPosition.horizontal === "right" ? -1 : 1;
      const heightMultiplier = chatPosition.vertical === "top" ? -1 : 1;
      const newWidth = Math.max(280, Math.min(600, resizeRef.current.startWidth + dx * widthMultiplier));
      const newHeight = Math.max(350, Math.min(700, resizeRef.current.startHeight + dy * heightMultiplier));
      setChatSize({ width: newWidth, height: newHeight });
    };
    const handleResizeEnd = () => {
      setIsResizing(false);
      resizeRef.current = null;
    };
    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor = "nwse-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, chatPosition]);
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      let newX = dragRef.current.elemX - dx;
      let newY = dragRef.current.elemY - dy;
      const fabSize = 56;
      const margin = 24;
      const maxX = window.innerWidth - fabSize - margin;
      const maxY = window.innerHeight - fabSize - margin;
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      setPosition({ x: newX, y: newY });
      setHasCustomPos(true);
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);
  useEffect(() => {
    const handleTouchMove = (e) => {
      if (!isDragging || !dragRef.current || !isMobile) return;
      e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - dragRef.current.startX;
      const dy = touch.clientY - dragRef.current.startY;
      let newX = dragRef.current.elemX - dx;
      let newY = dragRef.current.elemY - dy;
      const fabSize = 56;
      const margin = 16;
      const maxX = window.innerWidth - fabSize - margin;
      const maxY = window.innerHeight - fabSize - margin - (keyboardHeight > 0 ? keyboardHeight : 0);
      newX = Math.max(margin, Math.min(newX, maxX));
      newY = Math.max(margin, Math.min(newY, maxY));
      setPosition({ x: newX, y: newY });
      setHasCustomPos(true);
    };
    const handleTouchEnd = () => setIsDragging(false);
    if (isDragging && isMobile) {
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
    }
    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, isMobile, keyboardHeight]);
  useEffect(() => {
    if (!isMobile || !isOpen) return;
    const handleVisualViewportResize = () => {
      const vv2 = window.visualViewport;
      if (!vv2) return;
      const heightDiff = window.innerHeight - vv2.height;
      if (heightDiff > 100) {
        setKeyboardHeight(heightDiff);
      } else {
        setKeyboardHeight(0);
      }
    };
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", handleVisualViewportResize);
      return () => vv.removeEventListener("resize", handleVisualViewportResize);
    }
  }, [isMobile, isOpen]);
  const style = hasCustomPos ? { right: position.x, bottom: position.y } : {};
  const calculateChatPosition = useCallback(() => {
    if (!fabRef.current) return { horizontal: "left", vertical: "bottom" };
    const rect = fabRef.current.getBoundingClientRect();
    const chatWidth = 320;
    const chatHeight = 450;
    const margin = 16;
    const spaceRight = window.innerWidth - rect.right;
    rect.left;
    const spaceBottom = window.innerHeight - rect.bottom;
    rect.top;
    const extendLeft = spaceRight < chatWidth + margin;
    const placeAbove = spaceBottom < chatHeight + margin;
    return {
      horizontal: extendLeft ? "right" : "left",
      vertical: placeAbove ? "bottom" : "top"
    };
  }, []);
  useEffect(() => {
    if (isOpen) {
      setChatPosition(calculateChatPosition());
    }
  }, [isOpen, calculateChatPosition]);
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        setChatPosition(calculateChatPosition());
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, calculateChatPosition]);
  const getPositionClasses = () => {
    if (isMobile) {
      return "absolute bottom-16 left-0";
    }
    const hClass = chatPosition.horizontal === "left" ? "left-0" : "right-0";
    const vClass = chatPosition.vertical === "bottom" ? "bottom-16" : "top-16";
    return `absolute ${vClass} ${hClass}`;
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `fixed z-40 transition-all duration-300 ${isMobile ? "bottom-6 left-6" : "bottom-6 right-6"}`,
      style: {
        ...style,
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))"
      },
      children: [
        /* @__PURE__ */ jsx("div", { className: "sr-only", role: "status", "aria-live": "polite", "aria-atomic": "true", children: announcement }),
        /* @__PURE__ */ jsx("div", { id: "chat-context", className: "sr-only", children: messages.length === 0 ? "Start a conversation with Gyaan AI" : `Conversation with Gyaan AI: ${messages.length} message${messages.length !== 1 ? "s" : ""}` }),
        isOpen && /* @__PURE__ */ jsxs(
          "div",
          {
            ref: chatContainerRef,
            onTouchStart: handleChatTouchStart,
            onTouchEnd: handleChatTouchEnd,
            className: `${getPositionClasses()} bg-card/85 backdrop-blur-md border ${prefersHighContrast ? "border-2 border-black dark:border-white" : "border-border/40"} rounded-2xl shadow-elevation-3 overflow-hidden ${prefersReducedMotion ? "" : "animate-scale-in"} flex flex-col ${isMobile ? "max-h-[70vh] w-[calc(100vw-3rem)]" : ""}`,
            style: { width: isMobile ? void 0 : chatSize.width, height: isMobile && keyboardHeight > 0 ? Math.min(chatSize.height, window.innerHeight - keyboardHeight - 100) : chatSize.height },
            role: "dialog",
            "aria-modal": "true",
            "aria-label": "Chat with Gyaan AI",
            children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  onMouseDown: handleResizeStart,
                  className: "absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-10 group",
                  "aria-label": "Resize chat",
                  title: "Drag to resize",
                  children: /* @__PURE__ */ jsx("div", { className: "absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-muted-foreground/40 rounded-br-sm group-hover:border-primary transition-colors" })
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "bg-card/95 border-b border-border/40 px-4 py-3 flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-full bg-secondary/15 flex items-center justify-center text-xl", children: GYAAN_AVATAR }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-foreground font-display", children: "Gyaan AI" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground", children: isTyping ? "Thinking..." : streamingId ? "Typing..." : "Online • Ready to help" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: startNewChat,
                      className: "text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted/50",
                      "aria-label": "New chat",
                      title: "New chat",
                      children: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      ref: closeButtonRef,
                      onClick: () => setIsOpen(false),
                      className: "text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted/50",
                      "aria-label": "Close chat",
                      children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  ref: messagesContainerRef,
                  className: "overflow-y-auto p-3 pb-14 space-y-3 bg-muted/30 flex-1 scrollbar-hide relative",
                  style: { height: chatSize.height - 120 },
                  children: [
                    messages.length === 0 && /* @__PURE__ */ jsxs("div", { className: "text-center py-6 space-y-3", children: [
                      /* @__PURE__ */ jsx("div", { className: "w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-3xl", children: GYAAN_AVATAR }),
                      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
                        "Hi! I'm ",
                        /* @__PURE__ */ jsx("strong", { children: "Gyaan" }),
                        " 🦉 How can I help you today? 👋"
                      ] }),
                      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5 justify-center", children: QUICK_REPLIES.map((q) => /* @__PURE__ */ jsx("button", { onClick: () => sendMessage(q), className: "text-[10px] font-mono px-2.5 py-1 rounded-full border border-secondary/30 bg-secondary/5 text-secondary-foreground hover:bg-secondary/15 transition-colors", "aria-label": `Quick reply: ${q}`, children: q }, q)) })
                    ] }),
                    messages.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5 justify-center py-2", children: (showQuickReplies ? QUICK_REPLIES : []).map((q) => /* @__PURE__ */ jsx("button", { onClick: () => sendMessage(q), className: "text-[10px] font-mono px-2.5 py-1 rounded-full border border-secondary/30 bg-secondary/5 text-secondary-foreground hover:bg-secondary/15 transition-colors", "aria-label": `Quick reply: ${q}`, children: q }, q)) }),
                    messages.map((m) => /* @__PURE__ */ jsxs("div", { className: `flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`, children: [
                      m.role === "bot" && /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1 text-sm", children: GYAAN_AVATAR }),
                      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 max-w-[75%]", children: [
                        /* @__PURE__ */ jsxs("div", { className: `px-3 py-2 rounded-xl text-sm ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm"}`, children: [
                          /* @__PURE__ */ jsx("div", { className: "whitespace-pre-wrap text-sm leading-relaxed", children: m.content ? /* @__PURE__ */ jsxs(Fragment, { children: [
                            formatMessageContent(m.content, m.role === "user"),
                            m.role === "bot" && streamingId === m.id && /* @__PURE__ */ jsx("span", { className: "inline-block w-1.5 h-3.5 bg-primary animate-pulse ml-0.5 align-middle" })
                          ] }) : m.role === "bot" && streamingId === m.id && /* @__PURE__ */ jsxs("div", { className: "space-y-2 w-full", children: [
                            /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-full" }),
                            /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-5/6" }),
                            /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-4/6" })
                          ] }) }),
                          /* @__PURE__ */ jsx("p", { className: `text-[9px] mt-1 ${m.role === "user" ? "text-primary-foreground/80 font-medium" : "text-muted-foreground"}`, children: getRelativeTime(m.time) })
                        ] }),
                        m.role === "bot" && !streamingId && m.content && /* @__PURE__ */ jsxs(Fragment, { children: [
                          getConfidenceLevel(m.content) === "medium" && /* @__PURE__ */ jsxs("div", { className: "mt-0.5 text-[9px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-200/50 flex items-center gap-1 font-medium w-fit", children: [
                            /* @__PURE__ */ jsx("span", { children: "⚠" }),
                            " AI-generated — verify with advisor"
                          ] }),
                          getConfidenceLevel(m.content) === "low" && /* @__PURE__ */ jsxs("div", { className: "mt-0.5 text-[9px] text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded border border-red-200/50 flex items-center gap-1 font-medium w-fit", children: [
                            /* @__PURE__ */ jsx("span", { children: "🚨" }),
                            " Not financial advice. Consult an advisor."
                          ] })
                        ] }),
                        m.role === "bot" && !streamingId && m.content && /* @__PURE__ */ jsxs("div", { className: "flex gap-1 ml-1", children: [
                          /* @__PURE__ */ jsx(
                            "button",
                            {
                              onClick: () => handleFeedback(m.id, "like"),
                              className: `p-1 rounded transition-all ${m.feedback === "like" ? "bg-green-100 text-green-600" : "hover:bg-muted text-muted-foreground"}`,
                              "aria-label": "Mark response as helpful",
                              "aria-pressed": m.feedback === "like",
                              children: /* @__PURE__ */ jsx(ThumbsUp, { className: `h-3 w-3 ${m.feedback === "like" ? "fill-current" : ""}` })
                            }
                          ),
                          /* @__PURE__ */ jsx(
                            "button",
                            {
                              onClick: () => handleFeedback(m.id, "dislike"),
                              className: `p-1 rounded transition-all ${m.feedback === "dislike" ? "bg-red-100 text-red-600" : "hover:bg-muted text-muted-foreground"}`,
                              "aria-label": "Mark response as not helpful",
                              "aria-pressed": m.feedback === "dislike",
                              children: /* @__PURE__ */ jsx(ThumbsDown, { className: `h-3 w-3 ${m.feedback === "dislike" ? "fill-current" : ""}` })
                            }
                          )
                        ] })
                      ] })
                    ] }, m.id)),
                    isTyping && /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-start", children: [
                      /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1 text-sm", children: GYAAN_AVATAR }),
                      /* @__PURE__ */ jsx("div", { className: "bg-card border border-border rounded-xl rounded-bl-sm px-3 py-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Gyaan is typing..." }),
                        /* @__PURE__ */ jsxs("div", { className: "flex gap-0.5", "aria-hidden": "true", children: [
                          /* @__PURE__ */ jsx("span", { className: `w-1 h-1 rounded-full bg-primary ${prefersReducedMotion ? "" : "animate-bounce"}`, style: { animationDelay: "0ms" } }),
                          /* @__PURE__ */ jsx("span", { className: `w-1 h-1 rounded-full bg-primary ${prefersReducedMotion ? "" : "animate-bounce"}`, style: { animationDelay: "150ms" } }),
                          /* @__PURE__ */ jsx("span", { className: `w-1 h-1 rounded-full bg-primary ${prefersReducedMotion ? "" : "animate-bounce"}`, style: { animationDelay: "300ms" } })
                        ] })
                      ] }) })
                    ] }),
                    failedMessageId && /* @__PURE__ */ jsx("div", { className: "flex justify-center py-2", children: /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: handleRetry,
                        className: "text-[11px] px-3 py-1.5 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive flex items-center gap-1.5 transition-colors font-medium",
                        "aria-label": "Retry failed message",
                        children: [
                          /* @__PURE__ */ jsx(RefreshCw, { className: "h-3 w-3" }),
                          "Retry"
                        ]
                      }
                    ) }),
                    suggestedFollowUps.length > 0 && messages.length > 0 && ((_a = messages[messages.length - 1]) == null ? void 0 : _a.role) === "bot" && !streamingId && !failedMessageId && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 py-2", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground text-center uppercase tracking-wide font-medium", children: "Suggested questions" }),
                      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5 justify-center", children: suggestedFollowUps.map((q) => /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => {
                            sendMessage(q);
                            setSuggestedFollowUps([]);
                          },
                          className: "text-[10px] font-mono px-3 py-1.5 rounded-full border border-secondary/30 bg-secondary/5 text-secondary-foreground hover:bg-secondary/15 transition-colors",
                          "aria-label": `Follow-up: ${q}`,
                          children: q
                        },
                        q
                      )) })
                    ] }),
                    messages.length > 0 && ((_b = messages[messages.length - 1]) == null ? void 0 : _b.role) === "bot" && !streamingId && /* @__PURE__ */ jsx("div", { className: "flex justify-center py-1", children: /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: () => setShowQuickReplies(!showQuickReplies),
                        className: "text-[11px] px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground flex items-center gap-1 transition-colors",
                        "aria-label": showQuickReplies ? "Hide quick replies" : "Show quick replies",
                        children: [
                          /* @__PURE__ */ jsx(MoreHorizontal, { className: "h-3 w-3" }),
                          showQuickReplies ? "Hide options" : "More options"
                        ]
                      }
                    ) }),
                    /* @__PURE__ */ jsx("div", { ref: chatEndRef })
                  ]
                }
              ),
              isScrolledUp && messages.length > 0 && /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: scrollToBottom,
                  className: "absolute bottom-[68px] left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-20",
                  "aria-label": "Scroll to latest message",
                  title: "Scroll to bottom",
                  children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 animate-bounce" })
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "p-3 border-t border-border flex gap-2", children: [
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    ref: inputRef,
                    value: input,
                    onChange: (e) => setInput(e.target.value),
                    onKeyDown: (e) => e.key === "Enter" && sendMessage(input),
                    placeholder: "Ask Gyaan anything...",
                    className: `text-sm h-9 ${prefersHighContrast ? "border-2 border-black dark:border-white" : ""}`,
                    "aria-label": "Type your message",
                    "aria-describedby": "chat-context"
                  }
                ),
                /* @__PURE__ */ jsx(Button, { size: "icon", className: "h-9 w-9 shrink-0", onClick: () => sendMessage(input), disabled: !input.trim(), "aria-label": "Send message", children: /* @__PURE__ */ jsx(Send, { className: "h-3.5 w-3.5" }) })
              ] })
            ]
          }
        ),
        nudgeBubble && !isOpen && /* @__PURE__ */ jsxs("div", { className: "absolute bottom-20 right-0 w-64 bg-card border border-border rounded-xl shadow-xl p-3 animate-fade-in", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                const CHATBOT_API_URL = "https://finacial-chatbot.onrender.com";
                fetch(`${CHATBOT_API_URL}/api/nudge-dismiss`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ nudge_id: nudgeBubble.nudgeId, user_id: user == null ? void 0 : user.id })
                }).catch(() => {
                });
                setNudgeBubble(null);
              },
              className: "absolute top-1 right-1 p-0.5 rounded-full text-muted-foreground hover:text-foreground transition-colors",
              "aria-label": "Dismiss",
              children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3" })
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground pr-4", children: nudgeBubble.text }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                const CHATBOT_API_URL = "https://finacial-chatbot.onrender.com";
                fetch(`${CHATBOT_API_URL}/api/nudge-engage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ nudge_id: nudgeBubble.nudgeId, user_id: user == null ? void 0 : user.id })
                }).catch(() => {
                });
                setIsOpen(true);
                setMessages([{ id: Date.now().toString(), role: "bot", content: nudgeBubble.text, time: /* @__PURE__ */ new Date() }]);
                setNudgeBubble(null);
              },
              className: "mt-2 text-xs text-primary hover:underline font-medium",
              children: "Let's chat →"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "absolute -bottom-2 right-6 w-4 h-4 bg-card border-r border-b border-border transform rotate-45" })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            ref: fabRef,
            onMouseDown: handleMouseDown,
            onTouchStart: handleTouchStart,
            onClick: () => !isDragging && setIsOpen(!isOpen),
            className: `relative w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 ${isDragging ? "cursor-grabbing scale-110" : "cursor-grab hover:scale-105"} ${isOpen || prefersReducedMotion ? "rotate-0" : isFabVisible ? "animate-bounce" : "translate-y-20 opacity-0 pointer-events-none"}`,
            style: prefersReducedMotion ? {} : { animationIterationCount: isFabVisible ? 3 : 0, animationDuration: "1.5s" },
            "aria-label": isOpen ? "Close chat" : `Open chat${unreadCount > 0 ? `, ${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : ""}`,
            "aria-expanded": isOpen,
            children: [
              isOpen ? /* @__PURE__ */ jsx(X, { className: "h-6 w-6" }) : /* @__PURE__ */ jsx("span", { className: "text-2xl", "aria-hidden": "true", children: GYAAN_AVATAR }),
              !isOpen && unreadCount > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center border-2 border-background", "aria-hidden": "true", children: unreadCount > 9 ? "9+" : unreadCount })
            ]
          }
        )
      ]
    }
  );
};
export {
  ChatbotWidget as default
};
