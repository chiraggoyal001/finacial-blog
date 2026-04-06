import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  time: string;
  emoji?: string;
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

const GYAAN_AVATAR = "🦉";

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hasCustomPos, setHasCustomPos] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; elemX: number; elemY: number } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, time: now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      const resp = getResponse(text);
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: "bot", content: resp.text, time: now(), emoji: resp.emoji };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 800);
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
              <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xl">
                {GYAAN_AVATAR}
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-foreground">Gyaan AI</p>
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
                <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-3xl">
                  {GYAAN_AVATAR}
                </div>
                <p className="text-sm text-muted-foreground">Hi! I'm <strong>Gyaan</strong> 🦉 How can I help you today? 👋</p>
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
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1 text-sm">
                    {m.emoji || GYAAN_AVATAR}
                  </div>
                )}
                <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm"}`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className={`text-[9px] mt-1 ${m.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{m.time}</p>
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
                  🤔
                </div>
                <div className="bg-card border border-border rounded-xl rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Ask Gyaan anything..."
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
        {isOpen ? <X className="h-6 w-6" /> : <span className="text-2xl">{GYAAN_AVATAR}</span>}
      </button>
    </div>
  );
};

export default ChatbotWidget;
