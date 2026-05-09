import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, Send, User, ThumbsUp, ThumbsDown, Plus, MoreHorizontal, ChevronDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// Hook to detect reduced motion preference
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
};

// Hook to detect high contrast preference
const usePrefersContrast = () => {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-contrast: more)");
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersHighContrast;
};

// Hook to detect mobile/touch devices
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

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  time: Date;
  feedback?: "like" | "dislike" | null;
  failed?: boolean;
}

const QUICK_REPLIES = [
  "What modules are available?",
  "How do I subscribe?",
  "Tell me about the Junior section",
  "What events are upcoming?",
];

const BOT_RESPONSES: Record<string, { text: string; emoji: string }> = {
  modules: { text: "We have three main learning modules: **Stock Market Fundamentals**, **Personal Finance Mastery**, and **Fintech Revolution**. Each is broken into chapters with quizzes! 📚", emoji: "🧑‍🏫" },
  subscribe: { text: "You can subscribe from the **Subscribe** page or the newsletter section on our homepage. We offer daily, weekly, and monthly digest options! 📬", emoji: "👉" },
  junior: { text: "The **Junior** section has fun, interactive lessons designed for young learners! It includes video and reading modules on topics like investing basics and the history of money. 🎮", emoji: "🥳" },
  events: { text: "We host **community meetups**, **quiz nights**, and **bootcamps**! Check out the Events page for upcoming sessions. 🎉", emoji: "🤩" },
  default: { text: "Thanks for reaching out! I can help you with information about our modules, newsletters, events, and more. Try asking about a specific topic! 🤝", emoji: "😊" },
};

const getResponse = (msg: string): { text: string; emoji: string } => {
  const lower = msg.toLowerCase();
  if (lower.includes("module") || lower.includes("course") || lower.includes("learn")) return BOT_RESPONSES.modules;
  if (lower.includes("subscri") || lower.includes("newsletter") || lower.includes("sign up")) return BOT_RESPONSES.subscribe;
  if (lower.includes("junior") || lower.includes("kid") || lower.includes("young") || lower.includes("beginner")) return BOT_RESPONSES.junior;
  if (lower.includes("event") || lower.includes("meetup") || lower.includes("bootcamp") || lower.includes("quiz")) return BOT_RESPONSES.events;
  return BOT_RESPONSES.default;
};

// Follow-up suggestions based on topic
const FOLLOW_UPS: Record<string, string[]> = {
  modules: ["How long does each module take?", "Are there certificates?", "What is the difficulty level?"],
  subscribe: ["Is there a free trial?", "How do I cancel?", "What payment methods are accepted?"],
  junior: ["What age is Junior for?", "Are parents involved?", "Is it gamified?"],
  events: ["How do I RSVP?", "Are events recorded?", "How often are they held?"],
  default: ["Tell me about pricing", "What topics do you cover?", "How do I get started?"],
};

// Dynamic delay based on message length
const calculateTypingDelay = (textLength: number): number => {
  const baseDelay = 300;
  const perCharDelay = 15;
  const maxDelay = 2500;
  return Math.min(maxDelay, baseDelay + textLength * perCharDelay);
};

const GYAAN_AVATAR = "🦉";

// Helper to get relative time
const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

interface ChatPosition {
  horizontal: "left" | "right";
  vertical: "top" | "bottom";
}

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hasCustomPos, setHasCustomPos] = useState(false);
  const [chatPosition, setChatPosition] = useState<ChatPosition>({ horizontal: "left", vertical: "bottom" });
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [announcement, setAnnouncement] = useState<string>("");
  const [isFabVisible, setIsFabVisible] = useState(true);
  const [chatSize, setChatSize] = useState<{ width: number; height: number }>({ width: 320, height: 450 });
  const [isResizing, setIsResizing] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([]);
  const [failedMessageId, setFailedMessageId] = useState<string | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; elemX: number; elemY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const SCROLL_THRESHOLD = 100;
  const prefersReducedMotion = useReducedMotion();
  const prefersHighContrast = usePrefersContrast();
  const isMobile = useIsMobile();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const swipeRef = useRef<{ startY: number; startTime: number } | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, streamingId]);

  // Scroll tracking for "scroll to bottom" button
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

  // FAB always visible - auto-hide on scroll disabled

  // Reset unread count when chat is opened
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

  // Escape key handler to close chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus trapping within chat when open
  useEffect(() => {
    if (!isOpen) return;

    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    // Focus the input when chat opens
    inputRef.current?.focus();

    const focusableElements = chatContainer.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener("keydown", handleTabKey);
    return () => document.removeEventListener("keydown", handleTabKey);
  }, [isOpen]);

  // Return focus to FAB when closing
  useEffect(() => {
    if (!isOpen) {
      fabRef.current?.focus();
    }
  }, [isOpen]);

  // Announce new bot messages to screen readers
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "bot" && !streamingId) {
      setAnnouncement(`Gyaan AI: ${lastMessage.content}`);
    }
  }, [messages, streamingId]);


  const now = () => new Date();

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleFeedback = useCallback((messageId: string, type: "like" | "dislike") => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, feedback: m.feedback === type ? null : type } : m
      )
    );
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

  const streamText = useCallback((messageId: string, fullText: string, emoji: string) => {
    let currentIndex = 0;
    const charsPerTick = 2; // Characters to reveal per tick

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

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content: fullText.slice(0, currentIndex) }
            : m
        )
      );
    }, 30); // 30ms between updates for smooth effect
  }, []);

  const sendMessage = useCallback((text: string, isRetry: boolean = false) => {
    if (!text.trim()) return;
    
    // Clear any previous failed state when sending new message
    if (!isRetry) {
      setFailedMessageId(null);
      setSuggestedFollowUps([]);
    }
    
    const userMsg: Message = { 
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

    const resp = getResponse(text);
    const delay = calculateTypingDelay(resp.text.length);
    
    // Determine response type for follow-ups
    const lower = text.toLowerCase();
    let responseType = "default";
    if (lower.includes("module") || lower.includes("course") || lower.includes("learn")) responseType = "modules";
    else if (lower.includes("subscri") || lower.includes("newsletter") || lower.includes("sign up")) responseType = "subscribe";
    else if (lower.includes("junior") || lower.includes("kid") || lower.includes("young") || lower.includes("beginner")) responseType = "junior";
    else if (lower.includes("event") || lower.includes("meetup") || lower.includes("bootcamp") || lower.includes("quiz")) responseType = "events";

    setTimeout(() => {
      const botMsgId = (Date.now() + 1).toString();
      const botMsg: Message = { id: botMsgId, role: "bot", content: "", time: now() };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
      setStreamingId(botMsgId);
      streamText(botMsgId, resp.text, resp.emoji);
      
      // Set suggested follow-ups (pick 2-3 randomly)
      const followUps = FOLLOW_UPS[responseType];
      const shuffled = [...followUps].sort(() => 0.5 - Math.random());
      setSuggestedFollowUps(shuffled.slice(0, 3));
      
      // Increment unread if chat is closed
      setUnreadCount((prev) => (!isOpen ? prev + 1 : prev));
    }, delay);
  }, [streamText, isOpen]);

  const handleRetry = useCallback(() => {
    // Find the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    if (lastUserMessage) {
      // Remove the failed message
      setMessages((prev) => prev.filter(m => m.id !== failedMessageId));
      setFailedMessageId(null);
      // Retry sending
      sendMessage(lastUserMessage.content, true);
    }
  }, [messages, failedMessageId, sendMessage]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      elemX: hasCustomPos ? position.x : 0, elemY: hasCustomPos ? position.y : 0,
    };
  };

  // Touch drag handlers for mobile FAB
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isOpen || !isMobile) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragRef.current = {
      startX: touch.clientX, startY: touch.clientY,
      elemX: hasCustomPos ? position.x : 0, elemY: hasCustomPos ? position.y : 0,
    };
  }, [isOpen, hasCustomPos, position, isMobile]);

  // Swipe down to close chat (mobile only)
  const handleChatTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    swipeRef.current = { startY: touch.clientY, startTime: Date.now() };
  }, [isMobile]);

  const handleChatTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !swipeRef.current || !isOpen) return;
    const touch = e.changedTouches[0];
    const deltaY = touch.clientY - swipeRef.current.startY;
    const deltaTime = Date.now() - swipeRef.current.startTime;

    // Swipe down > 80px in < 300ms to close
    if (deltaY > 80 && deltaTime < 300) {
      setIsOpen(false);
    }
    swipeRef.current = null;
  }, [isMobile, isOpen]);

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: chatSize.width,
      startHeight: chatSize.height,
    };
  };

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current) return;
      
      const dx = e.clientX - resizeRef.current.startX;
      const dy = e.clientY - resizeRef.current.startY;
      
      // Adjust based on horizontal position (left/right)
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
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      // Calculate new position
      let newX = dragRef.current.elemX - dx;
      let newY = dragRef.current.elemY - dy;

      // Clamp to viewport bounds (FAB is 56px = w-14)
      const fabSize = 56;
      const margin = 24; // bottom-6 and right-6 = 24px
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

  // Touch drag move handler for mobile FAB
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !dragRef.current || !isMobile) return;
      e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - dragRef.current.startX;
      const dy = touch.clientY - dragRef.current.startY;

      let newX = dragRef.current.elemX - dx;
      let newY = dragRef.current.elemY - dy;

      // Stricter bounds for mobile - keep FAB within safe area
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

  // Handle mobile keyboard opening (visual viewport API)
  useEffect(() => {
    if (!isMobile || !isOpen) return;

    const handleVisualViewportResize = () => {
      const vv = (window as any).visualViewport;
      if (!vv) return;

      const heightDiff = window.innerHeight - vv.height;
      // If keyboard opened (height shrinks significantly)
      if (heightDiff > 100) {
        setKeyboardHeight(heightDiff);
      } else {
        setKeyboardHeight(0);
      }
    };

    const vv = (window as any).visualViewport;
    if (vv) {
      vv.addEventListener("resize", handleVisualViewportResize);
      return () => vv.removeEventListener("resize", handleVisualViewportResize);
    }
  }, [isMobile, isOpen]);

  const style = hasCustomPos ? { right: position.x, bottom: position.y } : {};

  // Calculate optimal chat position based on FAB location
  const calculateChatPosition = useCallback((): ChatPosition => {
    if (!fabRef.current) return { horizontal: "left", vertical: "bottom" };

    const rect = fabRef.current.getBoundingClientRect();
    const chatWidth = 320; // w-80 = 20rem = 320px
    const chatHeight = 450; // approximate chat window height
    const margin = 16;

    const spaceRight = window.innerWidth - rect.right;
    const spaceLeft = rect.left;
    const spaceBottom = window.innerHeight - rect.bottom;
    const spaceTop = rect.top;

    // Determine horizontal direction
    // If not enough space to the right of FAB, extend to the left
    const extendLeft = spaceRight < chatWidth + margin;

    // Determine vertical direction
    // If not enough space below FAB, place chat above FAB (using bottom-16)
    const placeAbove = spaceBottom < chatHeight + margin;

    return {
      horizontal: extendLeft ? "right" : "left",
      vertical: placeAbove ? "bottom" : "top",
    };
  }, []);

  // Update chat position when opening
  useEffect(() => {
    if (isOpen) {
      setChatPosition(calculateChatPosition());
    }
  }, [isOpen, calculateChatPosition]);

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        setChatPosition(calculateChatPosition());
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, calculateChatPosition]);

  // Get positioning classes and styles based on chat position
  // horizontal: "left" means chat extends rightward from FAB (using left-0)
  // horizontal: "right" means chat extends leftward from FAB (using right-0)
  // vertical: "bottom" means chat is above FAB (using bottom-16)
  // vertical: "top" means chat is below FAB (using top-16)
  const getPositionClasses = () => {
    const hClass = chatPosition.horizontal === "left" ? "left-0" : "right-0";
    const vClass = chatPosition.vertical === "bottom" ? "bottom-16" : "top-16";
    return `absolute ${vClass} ${hClass}`;
  };


  return (
    <div
      className={`fixed z-40 transition-all duration-300 ${
        isMobile ? "bottom-6 left-6" : "bottom-6 right-6"
      }`}
      style={{
        ...style,
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
    >
      {/* Screen reader announcement region */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Chat context for screen readers */}
      <div id="chat-context" className="sr-only">
        {messages.length === 0
          ? "Start a conversation with Gyaan AI"
          : `Conversation with Gyaan AI: ${messages.length} message${messages.length !== 1 ? "s" : ""}`}
      </div>

      {isOpen && (
        <div
          ref={chatContainerRef}
          onTouchStart={handleChatTouchStart}
          onTouchEnd={handleChatTouchEnd}
          className={`${getPositionClasses()} bg-card border ${prefersHighContrast ? "border-2 border-black dark:border-white" : "border-border"} rounded-2xl shadow-2xl overflow-hidden ${prefersReducedMotion ? "" : "animate-scale-in"} flex flex-col ${isMobile ? 'max-h-[70vh]' : ''}`}
          style={{ width: chatSize.width, height: isMobile && keyboardHeight > 0 ? Math.min(chatSize.height, window.innerHeight - keyboardHeight - 100) : chatSize.height }}
          role="dialog"
          aria-modal="true"
          aria-label="Chat with Gyaan AI"
        >
          {/* Resize handle */}
          <div
            onMouseDown={handleResizeStart}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-10 group"
            aria-label="Resize chat"
            title="Drag to resize"
          >
            <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-muted-foreground/40 rounded-br-sm group-hover:border-primary transition-colors" />
          </div>
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xl">
                {GYAAN_AVATAR}
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-foreground">Gyaan AI</p>
                <p className="text-[10px] text-primary-foreground/70">{isTyping ? "Thinking..." : streamingId ? "Typing..." : "Online • Ready to help"}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={startNewChat}
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors p-1 rounded"
                aria-label="New chat"
                title="New chat"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                ref={closeButtonRef}
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground/70 hover:text-primary-foreground transition-colors p-1 rounded"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={messagesContainerRef}
            className="overflow-y-auto p-3 space-y-3 bg-muted/30 flex-1 scrollbar-hide relative"
            style={{ height: chatSize.height - 120 }} // Account for header and input
          >
            {messages.length === 0 && (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-3xl">
                  {GYAAN_AVATAR}
                </div>
                <p className="text-sm text-muted-foreground">Hi! I'm <strong>Gyaan</strong> 🦉 How can I help you today? 👋</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {QUICK_REPLIES.map((q) => (
                    <button key={q} onClick={() => sendMessage(q)} className="text-[11px] px-2.5 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors" aria-label={`Quick reply: ${q}`}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Quick Replies Toggle for ongoing conversations */}
            {messages.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center py-2">
                {(showQuickReplies ? QUICK_REPLIES : []).map((q) => (
                  <button key={q} onClick={() => sendMessage(q)} className="text-[11px] px-2.5 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors" aria-label={`Quick reply: ${q}`}>
                    {q}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "bot" && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1 text-sm">
                    {GYAAN_AVATAR}
                  </div>
                )}
                <div className="flex flex-col gap-1 max-w-[75%]">
                  <div className={`px-3 py-2 rounded-xl text-sm ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm"}`}>
                    <p className="whitespace-pre-wrap">
                    {m.content ? (
                      <>
                        {m.content}
                        {m.role === "bot" && streamingId === m.id && (
                          <span className="inline-block w-1.5 h-3.5 bg-primary animate-pulse ml-0.5 align-middle" />
                        )}
                      </>
                    ) : (
                      m.role === "bot" && streamingId === m.id && (
                        <div className="space-y-2 w-full">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-5/6" />
                          <Skeleton className="h-3 w-4/6" />
                        </div>
                      )
                    )}
                  </p>
                    <p className={`text-[9px] mt-1 ${m.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{getRelativeTime(m.time)}</p>
                  </div>
                  {/* Feedback buttons for bot messages */}
                  {m.role === "bot" && !streamingId && m.content && (
                    <div className="flex gap-1 ml-1">
                      <button
                        onClick={() => handleFeedback(m.id, "like")}
                        className={`p-1 rounded transition-all ${m.feedback === "like" ? "bg-green-100 text-green-600" : "hover:bg-muted text-muted-foreground"}`}
                        aria-label="Mark response as helpful"
                        aria-pressed={m.feedback === "like"}
                      >
                        <ThumbsUp className={`h-3 w-3 ${m.feedback === "like" ? "fill-current" : ""}`} />
                      </button>
                      <button
                        onClick={() => handleFeedback(m.id, "dislike")}
                        className={`p-1 rounded transition-all ${m.feedback === "dislike" ? "bg-red-100 text-red-600" : "hover:bg-muted text-muted-foreground"}`}
                        aria-label="Mark response as not helpful"
                        aria-pressed={m.feedback === "dislike"}
                      >
                        <ThumbsDown className={`h-3 w-3 ${m.feedback === "dislike" ? "fill-current" : ""}`} />
                      </button>
                    </div>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mt-1">
                    <User className="h-3 w-3 text-secondary" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1 text-sm">
                  {GYAAN_AVATAR}
                </div>
                <div className="bg-card border border-border rounded-xl rounded-bl-sm px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Gyaan is typing...</span>
                    <div className="flex gap-0.5" aria-hidden="true">
                      <span className={`w-1 h-1 rounded-full bg-primary ${prefersReducedMotion ? "" : "animate-bounce"}`} style={{ animationDelay: "0ms" }} />
                      <span className={`w-1 h-1 rounded-full bg-primary ${prefersReducedMotion ? "" : "animate-bounce"}`} style={{ animationDelay: "150ms" }} />
                      <span className={`w-1 h-1 rounded-full bg-primary ${prefersReducedMotion ? "" : "animate-bounce"}`} style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Retry button for failed messages */}
            {failedMessageId && (
              <div className="flex justify-center py-2">
                <button
                  onClick={handleRetry}
                  className="text-[11px] px-3 py-1.5 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive flex items-center gap-1.5 transition-colors font-medium"
                  aria-label="Retry failed message"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </button>
              </div>
            )}

            {/* Suggested follow-ups after bot responses */}
            {suggestedFollowUps.length > 0 && messages.length > 0 && messages[messages.length - 1]?.role === "bot" && !streamingId && !failedMessageId && (
              <div className="flex flex-col gap-2 py-2">
                <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wide font-medium">Suggested questions</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {suggestedFollowUps.map((q) => (
                    <button 
                      key={q} 
                      onClick={() => {
                        sendMessage(q);
                        setSuggestedFollowUps([]);
                      }} 
                      className="text-[11px] px-3 py-1.5 rounded-full border border-primary/40 bg-primary/5 text-primary hover:bg-primary/15 transition-colors"
                      aria-label={`Follow-up: ${q}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* More options button after bot responses */}
            {messages.length > 0 && messages[messages.length - 1]?.role === "bot" && !streamingId && (
              <div className="flex justify-center py-1">
                <button
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className="text-[11px] px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground flex items-center gap-1 transition-colors"
                  aria-label={showQuickReplies ? "Hide quick replies" : "Show quick replies"}
                >
                  <MoreHorizontal className="h-3 w-3" />
                  {showQuickReplies ? "Hide options" : "More options"}
                </button>
              </div>
            )}
            {/* Scroll to bottom button */}
            {isScrolledUp && messages.length > 0 && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-10"
                aria-label="Scroll to latest message"
                title="Scroll to bottom"
              >
                <ChevronDown className="h-4 w-4 animate-bounce" />
              </button>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Ask Gyaan anything..."
              className={`text-sm h-9 ${prefersHighContrast ? "border-2 border-black dark:border-white" : ""}`}
              aria-label="Type your message"
              aria-describedby="chat-context"
            />
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => sendMessage(input)} disabled={!input.trim()} aria-label="Send message">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        ref={fabRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={() => !isDragging && setIsOpen(!isOpen)}
        className={`relative w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 ${isDragging ? "cursor-grabbing scale-110" : "cursor-grab hover:scale-105"} ${isOpen || prefersReducedMotion ? "rotate-0" : isFabVisible ? "animate-bounce" : "translate-y-20 opacity-0 pointer-events-none"}`}
        style={prefersReducedMotion ? {} : { animationIterationCount: isFabVisible ? 3 : 0, animationDuration: "1.5s" }}
        aria-label={isOpen ? "Close chat" : `Open chat${unreadCount > 0 ? `, ${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : ""}`}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-6 w-6" /> : <span className="text-2xl" aria-hidden="true">{GYAAN_AVATAR}</span>}
        {/* Unread Badge */}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center border-2 border-background" aria-hidden="true">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default ChatbotWidget;
