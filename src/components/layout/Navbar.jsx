import { useState, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import NotificationCenter from "@/components/layout/NotificationCenter";

export default function Navbar({ sidebarWidth = 260 }) {
  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <header
      className="fixed top-0 right-0 z-30 h-16 glass border-b border-white/5 flex items-center px-6 gap-4 transition-all duration-200"
      style={{ left: sidebarWidth }}
    >
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher leads, messages..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <NotificationCenter />

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2.5 bg-white/5 border border-white/8 rounded-xl px-3 py-1.5 hover:bg-white/10 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg gradient-violet flex items-center justify-center text-xs font-bold text-white">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-foreground leading-none">
                {user?.full_name || user?.email?.split("@")[0] || "Utilisateur"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{user?.role || "Admin"}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-48 card-surface py-1 shadow-xl z-50"
              >
                <div className="px-3 py-2 border-b border-white/5">
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <a href="/settings" className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-white/5 transition-colors">
                  Paramètres
                </a>
                <button
                  onClick={() => base44.auth.logout("/login")}
                  className="w-full text-left flex items-center px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  Déconnexion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}