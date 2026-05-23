import { motion, AnimatePresence } from "framer-motion";
import { Flame, X, ArrowRight } from "lucide-react";
import { getLeadTemperature } from "@/utils/leadTemperature";
import { Link } from "react-router-dom";

export default function HotLeadsAlert({ leads, messages, onDismiss }) {
  const hotLeads = leads.filter(l => getLeadTemperature(l, messages) === "chaud");

  if (hotLeads.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex items-center gap-3 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3"
    >
      <div className="relative flex-shrink-0">
        <span className="absolute inset-0 animate-ping rounded-full bg-red-500/30" />
        <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-xl bg-red-500/20 flex items-center justify-center">
          <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-semibold text-red-400">
          {hotLeads.length} lead{hotLeads.length > 1 ? "s" : ""} chaud{hotLeads.length > 1 ? "s" : ""} à traiter !
        </p>
        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
          {hotLeads.slice(0, 3).map(l => l.name).join(", ")}
          {hotLeads.length > 3 ? ` +${hotLeads.length - 3} autres` : ""}
        </p>
      </div>

      <Link
        to="/leads"
        className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-red-400 hover:text-red-300 font-medium flex-shrink-0 transition-colors whitespace-nowrap"
      >
        Voir <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
      </Link>

      {onDismiss && (
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground flex-shrink-0 transition-colors">
          <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      )}
    </motion.div>
  );
}