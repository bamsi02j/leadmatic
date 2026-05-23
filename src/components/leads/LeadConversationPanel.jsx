import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Send, Phone, Mail, MessageSquare, Clock, Zap,
  ChevronDown, Edit2, CheckCheck, Check, Loader2, Smile
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import StatusBadge from "@/components/ui/StatusBadge";

const STATUS_OPTIONS = ["nouveau", "contacté", "converti", "perdu"];

const QUICK_REPLIES = [
  "Bonjour ! Merci pour votre intérêt. Comment puis-je vous aider ?",
  "Avez-vous eu le temps de consulter notre offre ?",
  "Je suis disponible pour une démonstration à votre convenance.",
  "Pouvez-vous me confirmer votre disponibilité cette semaine ?",
];

function MessageBubble({ msg }) {
  const isOut = msg.direction === "outbound";
  const time = msg.timestamp
    ? format(new Date(msg.timestamp), "HH:mm")
    : msg.created_date
    ? format(new Date(msg.created_date), "HH:mm")
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOut ? "justify-end" : "justify-start"} mb-2`}
    >
      <div className={`max-w-[78%] ${isOut ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isOut
              ? "bg-primary/80 text-white rounded-br-sm"
              : "bg-white/8 text-foreground rounded-bl-sm border border-white/8"
          }`}
        >
          {msg.content}
        </div>
        <div className={`flex items-center gap-1 px-1 ${isOut ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] text-muted-foreground/60">{time}</span>
          {isOut && (
            msg.status === "replied" ? (
              <CheckCheck className="w-3 h-3 text-primary/70" />
            ) : (
              <Check className="w-3 h-3 text-muted-foreground/50" />
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DateSeparator({ label }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-white/5" />
      <span className="text-[11px] text-muted-foreground/50 px-2">{label}</span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

function groupByDate(messages) {
  const groups = [];
  let lastLabel = null;
  messages.forEach(msg => {
    const d = new Date(msg.timestamp || msg.created_date);
    let label;
    if (isToday(d)) label = "Aujourd'hui";
    else if (isYesterday(d)) label = "Hier";
    else label = format(d, "d MMMM yyyy", { locale: fr });

    if (label !== lastLabel) {
      groups.push({ type: "separator", label });
      lastLabel = label;
    }
    groups.push({ type: "message", data: msg });
  });
  return groups;
}

export default function LeadConversationPanel({ lead, onClose, onLeadUpdate }) {
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const initials = lead.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  useEffect(() => {
    loadMessages();
    // Real-time subscription
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.lead_id === lead.id || event.data?.phone === lead.phone) {
        if (event.type === "create") {
          setMessages(prev => [...prev, event.data]);
        } else if (event.type === "update") {
          setMessages(prev => prev.map(m => m.id === event.id ? event.data : m));
        }
      }
    });
    return unsub;
  }, [lead.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    setLoadingMsgs(true);
    const all = await base44.entities.Message.filter({ phone: lead.phone }, "timestamp", 100);
    setMessages(all);
    // Mark unread as read
    const unread = all.filter(m => m.status === "unread" && m.direction === "inbound");
    await Promise.all(unread.map(m => base44.entities.Message.update(m.id, { status: "read" })));
    setLoadingMsgs(false);
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    const content = text.trim();
    setText("");
    setSending(true);

    const newMsg = await base44.entities.Message.create({
      lead_id: lead.id,
      phone: lead.phone,
      sender_name: "Agent",
      content,
      direction: "outbound",
      status: "read",
      timestamp: new Date().toISOString(),
    });

    // Auto-upgrade status to "contacté" if still "nouveau"
    if (lead.status === "nouveau") {
      await base44.entities.Lead.update(lead.id, { status: "contacté" });
      onLeadUpdate?.(lead.id, "contacté");
    }

    setSending(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusChanging(true);
    await base44.entities.Lead.update(lead.id, { status: newStatus });
    onLeadUpdate?.(lead.id, newStatus);
    setStatusChanging(false);
  };

  const groups = groupByDate(messages);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="flex flex-col h-full bg-card border-l border-white/6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/6 bg-card/80 backdrop-blur-sm">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{lead.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Phone className="w-2.5 h-2.5" />{lead.phone}
            </div>
            {lead.email && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Mail className="w-2.5 h-2.5" />{lead.email}
              </div>
            )}
          </div>
        </div>

        {/* Status selector */}
        <div className="relative flex-shrink-0">
          <select
            value={lead.status}
            onChange={e => handleStatusChange(e.target.value)}
            disabled={statusChanging}
            className="appearance-none bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-foreground outline-none cursor-pointer pr-6 hover:bg-white/10 transition-colors"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s} className="bg-background">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/8 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Notes */}
      {lead.notes && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-amber-500/8 border border-amber-500/15 text-[11px] text-amber-300/80 flex items-start gap-2">
          <Edit2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{lead.notes}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0 min-h-0">
        {loadingMsgs ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Chargement…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">Aucun message</p>
            <p className="text-xs text-muted-foreground/60 text-center px-4">Commencez la conversation en envoyant le premier message WhatsApp</p>
          </div>
        ) : (
          <>
            {groups.map((item, i) =>
              item.type === "separator"
                ? <DateSeparator key={`sep-${i}`} label={item.label} />
                : <MessageBubble key={item.data.id} msg={item.data} />
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Quick replies */}
      <AnimatePresence>
        {showQuick && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/6 px-3 py-2 overflow-hidden"
          >
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {QUICK_REPLIES.map((r, i) => (
                <button
                  key={i}
                  onClick={() => { setText(r); setShowQuick(false); textareaRef.current?.focus(); }}
                  className="flex-shrink-0 text-[11px] text-primary bg-primary/10 border border-primary/20 px-2.5 py-1.5 rounded-lg hover:bg-primary/20 transition-colors text-left max-w-[200px] truncate"
                >
                  {r}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer */}
      <div className="border-t border-white/6 p-3 bg-card/60">
        <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-primary/40 transition-all">
          <button
            onClick={() => setShowQuick(v => !v)}
            className={`p-1 rounded-lg transition-colors flex-shrink-0 mb-0.5 ${showQuick ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
            title="Réponses rapides"
          >
            <Zap className="w-4 h-4" />
          </button>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Message WhatsApp…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none leading-relaxed py-0.5 max-h-32"
            style={{ minHeight: "24px" }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="p-1.5 rounded-lg gradient-violet text-white flex-shrink-0 mb-0.5 hover:opacity-90 disabled:opacity-30 transition-all"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/40 mt-1.5 text-center">Entrée pour envoyer · Shift+Entrée pour nouvelle ligne</p>
      </div>
    </motion.div>
  );
}