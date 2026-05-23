import { motion } from "framer-motion";
import { Clock, Zap, ToggleLeft, ToggleRight, Edit2, Trash2 } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";

const triggerLabels = {
  nouveau: "Nouveau lead",
  "contacté": "Lead contacté",
  converti: "Lead converti",
  perdu: "Lead perdu",
  message_received: "Message reçu",
};

function formatDelay(minutes) {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}j`;
}

export default function AutomationCard({ automation, onToggle, onEdit, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-surface p-5 transition-all duration-150 hover:shadow-lg hover:shadow-black/20"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${automation.active ? "bg-primary/15" : "bg-white/8"}`}>
            <Zap className={`w-4 h-4 ${automation.active ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{automation.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Déclenché : {triggerLabels[automation.trigger_type] || automation.trigger_type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit?.(automation)}
            className="p-1.5 rounded-lg hover:bg-white/8 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete?.(automation)}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToggle?.(automation)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {automation.active
              ? <ToggleRight className="w-6 h-6 text-primary" />
              : <ToggleLeft className="w-6 h-6" />
            }
          </button>
        </div>
      </div>

      <div className="bg-white/4 rounded-xl p-3 mb-4">
        <p className="text-xs text-muted-foreground line-clamp-3">{automation.message_template}</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          Délai : {formatDelay(automation.delay_minutes || 60)}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{automation.total_triggered || 0} déclenchées</span>
          <span>{automation.total_sent || 0} envoyées</span>
        </div>
      </div>
    </motion.div>
  );
}