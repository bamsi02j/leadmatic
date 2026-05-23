import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import StatusBadge from "@/components/ui/StatusBadge";
import { Phone } from "lucide-react";

export default function MessageCard({ message, active, onClick }) {
  const time = message.created_date
    ? formatDistanceToNow(new Date(message.created_date), { addSuffix: true, locale: fr })
    : "";

  const initials = message.sender_name
    ? message.sender_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <motion.button
      whileHover={{ x: 2 }}
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl transition-all duration-150 border ${
        active
          ? "bg-primary/10 border-primary/30"
          : message.status === "unread"
          ? "bg-white/4 border-white/8 hover:bg-white/6"
          : "bg-transparent border-transparent hover:bg-white/4"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
          message.status === "unread" ? "gradient-violet text-white" : "bg-white/10 text-muted-foreground"
        }`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className={`text-sm font-semibold truncate ${message.status === "unread" ? "text-foreground" : "text-muted-foreground"}`}>
              {message.sender_name}
            </p>
            <span className="text-[11px] text-muted-foreground flex-shrink-0">{time}</span>
          </div>
          <div className="flex items-center gap-1 mb-1.5">
            <Phone className="w-2.5 h-2.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{message.phone}</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{message.content}</p>
          <div className="mt-2">
            <StatusBadge status={message.status} />
          </div>
        </div>
      </div>
    </motion.button>
  );
}