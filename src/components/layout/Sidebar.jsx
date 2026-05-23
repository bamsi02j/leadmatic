import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, MessageSquare, Users, Zap, Settings,
  Smartphone, ChevronLeft, ChevronRight, LogOut, Sparkles, GitBranch
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: MessageSquare, label: "Inbox", path: "/inbox", badge: null },
  { icon: Users, label: "Leads", path: "/leads" },
  { icon: Zap, label: "Automations", path: "/automations" },
  { icon: Smartphone, label: "WhatsApp", path: "/whatsapp" },
  { icon: Settings, label: "Paramètres", path: "/settings" },
];

export default function Sidebar({ unreadCount = 0, collapsed, onToggle }) {
  const location = useLocation();

  const handleLogout = () => {
    base44.auth.logout("/login");
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="sidebar-surface h-screen flex flex-col fixed left-0 top-0 z-40 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        {/* Icon mark */}
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #25D366 0%, #128C4A 100%)", boxShadow: "0 4px 14px rgba(37, 211, 102, 0.35), inset 0 1px 0 rgba(255,255,255,0.18)" }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Chat bubble */}
            <path d="M11 2C6.03 2 2 5.8 2 10.5c0 1.9.65 3.65 1.75 5.07L2.5 19.5l4.2-1.2A9.3 9.3 0 0 0 11 19c4.97 0 9-3.8 9-8.5S15.97 2 11 2Z" fill="white" fillOpacity="0.95"/>
            {/* Lightning bolt inside */}
            <path d="M12.4 7l-3 4h2.5l-1 4 3.5-4.5H12l1-3.5H12.4Z" fill="#25D366" stroke="#25D366" strokeWidth="0.3" strokeLinejoin="round"/>
          </svg>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-baseline gap-0.5">
                <span className="text-base font-extrabold tracking-tight text-foreground">Lead</span>
                <span className="text-base font-extrabold tracking-tight" style={{ color: "#25D366" }}>matic</span>
              </div>
              <p className="text-[10px] text-muted-foreground/70 tracking-wide uppercase">CRM WhatsApp</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 4 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-primary" : ""}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.label === "Inbox" && unreadCount > 0 && (
                  <span className={`ml-auto bg-primary text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 ${
                    collapsed ? "w-4 h-4 absolute -top-1 -right-1" : "w-5 h-5"
                  }`}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-4 border-t border-white/5 space-y-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                Déconnexion
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-150"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
}