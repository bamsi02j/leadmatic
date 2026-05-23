import { motion } from "framer-motion";
import { Phone, MessageSquare, Clock, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import StatusBadge from "@/components/ui/StatusBadge";

const statusColors = {
  nouveau: "border-l-blue-500",
  "contacté": "border-l-amber-500",
  converti: "border-l-emerald-500",
  perdu: "border-l-red-500",
};

export default function LeadCard({ lead, onStatusChange, onClick }) {
  const time = lead.created_date
    ? formatDistanceToNow(new Date(lead.created_date), { addSuffix: true, locale: fr })
    : "";

  const initials = lead.name
    ? lead.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`card-surface border-l-2 ${statusColors[lead.status] || "border-l-white/20"} p-4 cursor-pointer transition-all duration-150 hover:shadow-lg hover:shadow-black/20`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center text-sm font-bold text-foreground">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{lead.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{lead.phone}</span>
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground mt-1" />
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <StatusBadge status={lead.status} />
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {time}
        </div>
      </div>
    </motion.div>
  );
}