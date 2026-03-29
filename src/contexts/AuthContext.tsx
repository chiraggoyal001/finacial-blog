import React, { createContext, useContext, useState, ReactNode } from "react";
import { User } from "@/lib/types";
import { ADMIN_EMAILS } from "@/lib/data";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => boolean;
  signup: (data: Partial<User> & { password: string }) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const isAdmin = user ? ADMIN_EMAILS.includes(user.email) : false;
  const isLoggedIn = !!user;

  const login = (email: string, _password: string) => {
    // Dummy auth - accept any email/password
    setUser({
      id: crypto.randomUUID(),
      firstName: "User",
      lastName: "",
      email,
      isSubscribed: false,
      mailPreference: "non-intrusive",
      notifyLaunches: false,
    });
    return true;
  };

  const signup = (data: Partial<User> & { password: string }) => {
    setUser({
      id: crypto.randomUUID(),
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      email: data.email || "",
      isSubscribed: data.isSubscribed || false,
      mailPreference: data.mailPreference || "non-intrusive",
      notifyLaunches: data.notifyLaunches || false,
    });
    return true;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoggedIn, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
