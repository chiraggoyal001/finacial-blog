import React, { useState, useRef, useCallback, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  time: string;
}

const QUICK_REPLIES = [
  "What modules are available?",
  "How do I subscribe?",
  "Tell me about the Junior section",
  "What events are upcoming?",
];

const BOT_RESPONSES: Record<string, string> = {
  modules: "We have three main learning modules: **Stock Market Fundamentals**, **Personal Finance Mastery**, and **Fintech Revolution**. Each is broken into chapters with quizzes! 📚",
  subscribe: "You can subscribe from the **Subscribe** page or the newsletter section on our homepage. We offer daily, weekly, and monthly digest options! 📬",
  junior: "The **Junior** section has fun, interactive lessons designed for young learners! It includes video and reading modules on topics like investing basics and the history of money. 🎮",
  events: "We host **community meetups**, **quiz nights**, and **bootcamps**! Check out the Events page for upcoming sessions. 🎉",
  default: "Thanks for reaching out! I can help you with information about our modules, newsletters, events, and more. Try asking about a specific topic! 🤝",
};

const getResponse = (msg: string): string => {
  const lower = msg.toLowerCase();
  if (lower.includes("module") || lower.includes("course") || lower.includes("learn")) return BOT_RESPONSES.modules;
  if (lower.includes("subscri") || lower.includes("newsletter") || lower.includes("sign up")) return BOT_RESPONSES.subscribe;
  if (lower.includes("junior") || lower.includes("kid") || lower.includes("young") || lower.includes("beginner")) return BOT_RESPONSES.junior;
  if (lower.includes("event") || lower.includes("meetup") || lower.includes("bootcamp") || lower.includes("quiz")) return BOT_RESPONSES.events;
  return BOT_RESPONSES.default;
};

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hasCustomPos, setHasCustomPos] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; elemX: number; elemY: number } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, time: now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTimeout(() => {
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: "bot", content: getResponse(text), time: now() };
      setMessages((prev) => [...prev, botMsg]);
    }, 600);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      elemX: hasCustomPos ? position.x : 0, elemY: hasCustomPos ? position.y : 0,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({ x: dragRef.current.elemX - dx, y: dragRef.current.elemY - dy });
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

  const style = hasCustomPos ? { right: position.x, bottom: position.y } : {};

  return (
    <div className="fixed bottom-6 right-6 z-[90]" style={style}>
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-foreground">Blog Assistant</p>
                <p className="text-[10px] text-primary-foreground/70">Online • Ready to help</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto p-3 space-y-3 bg-muted/30">
            {messages.length === 0 && (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Hi! How can I help you today? 👋</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {QUICK_REPLIES.map((q) => (
                    <button key={q} onClick={() => sendMessage(q)} className="text-[11px] px-2.5 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "bot" && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                )}
                <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm"}`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className={`text-[9px] mt-1 ${m.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{m.time}</p>
                </div>
                {m.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mt-1">
                    <User className="h-3 w-3 text-secondary" />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Type a message..."
              className="text-sm h-9"
            />
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => sendMessage(input)} disabled={!input.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onMouseDown={handleMouseDown}
        onClick={() => !isDragging && setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl transition-all ${isDragging ? "cursor-grabbing scale-110" : "cursor-grab hover:scale-105"} ${isOpen ? "rotate-0" : "animate-bounce"}`}
        style={{ animationIterationCount: 3, animationDuration: "1.5s" }}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
};

export default ChatbotWidget;
