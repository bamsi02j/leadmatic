import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, MessageSquare, Users, Zap, Settings,
  Smartphone, ChevronLeft, ChevronRight, LogOut, Sparkles
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
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #25D366, #20BA60)", boxShadow: "0 0 10px rgba(37, 211, 102, 0.3)" }}>
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004c-1.605 0-3.122-.483-4.408-1.393l-.316-.203-3.286.861.876-3.197-.205-.325A7.466 7.466 0 0 0 3.909 2c3.859 0 6.998 3.137 6.998 6.995 0 1.867-.666 3.646-1.874 5.041l-.232.279 3.227.842-.860-3.104.273-.447c1.01-1.604 1.602-3.468 1.602-5.611 0-3.858-3.14-6.995-6.997-6.995" />
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
              <span className="text-lg font-bold gradient-text">Leadmatic</span>
              <p className="text-xs text-muted-foreground">CRM WhatsApp</p>
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