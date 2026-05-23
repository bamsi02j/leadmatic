import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Clock, MessageSquare, ArrowRight, X, CheckCheck, AlertTriangle, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useFollowUpAlerts } from "@/hooks/useFollowUpAlerts";
import { useNavigate } from "react-router-dom";

function AlertItem({ alert, onDismiss, onNavigate }) {
  const { lead, hoursSince, lastActivity, type } = alert;
  const isUrgent = hoursSince >= 72;

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0 }}
      className={`group relative flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer hover:bg-white/4 ${
        isUrgent
          ? "border-red-500/20 bg-red-500/5"
          : "border-amber-500/15 bg-amber-500/5"
      }`}
      onClick={() => onNavigate(lead)}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isUrgent ? "bg-red-500/15" : "bg-amber-500/15"
      }`}>
        {isUrgent
          ? <AlertTriangle className="w-4 h-4 text-red-400" />
          : <Clock className="w-4 h-4 text-amber-400" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className="text-sm font-semibold text-foreground truncate">{lead.name}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium ${
            isUrgent ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
          }`}>
            {hoursSince}h
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {type === "no_contact"
            ? "Aucun contact depuis le marquage"
            : "Pas de réponse depuis votre dernier message"
          }
        </p>
        <div className="flex items-center gap-1 mt-1.5">
          <span className="text-[11px] text-muted-foreground/60">
            {formatDistanceToNow(new Date(lastActivity), { addSuffix: true, locale: fr })}
          </span>
          <span className="text-[11px] text-primary/70 flex items-center gap-0.5 ml-auto">
            Ouvrir <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(alert.id); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground/50 hover:text-muted-foreground transition-all"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { alerts, loading, scan, dismiss, dismissAll } = useFollowUpAlerts();
  const ref = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const urgentCount = alerts.filter(a => a.hoursSince >= 72).length;
  const badgeCount = alerts.length;

  const handleNavigate = (lead) => {
    setOpen(false);
    navigate("/leads");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
          open
            ? "bg-primary/15 border-primary/30 text-primary"
            : "bg-white/5 border-white/8 text-muted-foreground hover:bg-white/10 hover:text-foreground"
        }`}
      >
        <Bell className="w-4 h-4" />
        {badgeCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center ${
              urgentCount > 0 ? "bg-red-500" : "bg-amber-500"
            }`}
          >
            {badgeCount > 9 ? "9+" : badgeCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="absolute right-0 top-full mt-2 w-[360px] card-surface shadow-2xl shadow-black/40 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-foreground">Relances en retard</span>
                {badgeCount > 0 && (
                  <span className="text-xs px-1.5 py-0.5 bg-amber-500/15 text-amber-400 rounded-full font-medium">
                    {badgeCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={scan}
                  className="p-1.5 rounded-lg hover:bg-white/8 text-muted-foreground transition-colors"
                  title="Actualiser"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                {badgeCount > 0 && (
                  <button
                    onClick={dismissAll}
                    className="p-1.5 rounded-lg hover:bg-white/8 text-muted-foreground transition-colors"
                    title="Tout ignorer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[420px] overflow-y-auto p-3 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8 gap-2">
                  <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
                  <span className="text-sm text-muted-foreground">Analyse en cours…</span>
                </div>
              ) : alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3">
                    <CheckCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Tout est à jour !</p>
                  <p className="text-xs text-muted-foreground mt-1">Aucun lead en retard de suivi</p>
                </div>
              ) : (
                <AnimatePresence>
                  {alerts.map(alert => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      onDismiss={dismiss}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {alerts.length > 0 && (
              <div className="px-4 py-2.5 border-t border-white/6 bg-white/2">
                <p className="text-[11px] text-muted-foreground/60 text-center">
                  Leads en statut <span className="text-amber-400 font-medium">contacté</span> sans réponse depuis +48h · scan auto toutes les 5 min
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}