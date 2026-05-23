import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Sparkles, Phone, User, RefreshCw, Loader2, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MessageCard from "@/components/inbox/MessageCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const AI_SUGGESTIONS = [
  "Bonjour ! Merci de nous avoir contacté. Comment puis-je vous aider aujourd'hui ?",
  "Bien reçu votre message. Je reviens vers vous dans les plus brefs délais.",
  "Merci pour votre intérêt. Pourriez-vous me donner plus de détails sur votre besoin ?",
  "Parfait ! Je vous envoie les informations demandées tout de suite.",
  "Nous avons bien noté votre demande. Un de nos conseillers vous contactera sous 24h.",
];

export default function Inbox() {
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    const data = await base44.entities.Message.list("-created_date", 50);
    setMessages(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    // Real-time subscription
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type === "create") setMessages(prev => [event.data, ...prev]);
      if (event.type === "update") setMessages(prev => prev.map(m => m.id === event.id ? event.data : m));
      if (event.type === "delete") setMessages(prev => prev.filter(m => m.id !== event.id));
    });
    return unsub;
  }, []);

  const selectMessage = async (msg) => {
    setSelected(msg);
    setAiSuggestion("");
    setReplyText("");
    setShowDetail(true);
    if (msg.status === "unread") {
      await base44.entities.Message.update(msg.id, { status: "read" });
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: "read" } : m));
    }
    // Auto-generate AI suggestion
    setTimeout(() => generateAiSuggestion(msg), 500);
  };

  const generateAiSuggestion = async (msg) => {
    setAiLoading(true);
    setAiSuggestion("");
    await new Promise(r => setTimeout(r, 1200));
    const suggestion = AI_SUGGESTIONS[Math.floor(Math.random() * AI_SUGGESTIONS.length)];
    setAiSuggestion(suggestion);
    setAiLoading(false);
  };

  const handleSend = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    await base44.entities.Message.create({
      company_id: selected.company_id,
      lead_id: selected.lead_id,
      sender_name: "Moi",
      content: replyText,
      phone: selected.phone,
      direction: "outbound",
      status: "read",
    });
    await base44.entities.Message.update(selected.id, { status: "replied" });
    setMessages(prev => prev.map(m => m.id === selected.id ? { ...m, status: "replied" } : m));
    setReplyText("");
    setSending(false);
    fetchMessages();
  };

  // Get conversation thread
  const conversation = selected
    ? messages.filter(m => m.phone === selected.phone).sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    : [];

  const unreadCount = messages.filter(m => m.status === "unread").length;

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Message list */}
      <div className={`${showDetail ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 lg:w-96 border-r border-white/6 bg-background`}>
        <div className="p-4 border-b border-white/6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Inbox</h1>
            {unreadCount > 0 && <p className="text-xs text-muted-foreground">{unreadCount} non lu{unreadCount > 1 ? "s" : ""}</p>}
          </div>
          <button onClick={fetchMessages} className="p-2 rounded-xl hover:bg-white/8 text-muted-foreground transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
            ))
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <MessageSquare className="w-10 h-10 text-muted-foreground mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">Aucun message</p>
              <p className="text-xs text-muted-foreground mt-1">Les messages WhatsApp apparaîtront ici</p>
            </div>
          ) : (
            messages.map(msg => (
              <MessageCard
                key={msg.id}
                message={msg}
                active={selected?.id === msg.id}
                onClick={() => selectMessage(msg)}
              />
            ))
          )}
        </div>
      </div>

      {/* Conversation detail */}
      <AnimatePresence>
        {(showDetail || window.innerWidth >= 768) && selected ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`${showDetail ? "flex" : "hidden md:flex"} flex-col flex-1 bg-background`}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/6 flex items-center gap-3">
              <button onClick={() => setShowDetail(false)} className="md:hidden p-1.5 rounded-lg hover:bg-white/8 text-muted-foreground">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-9 h-9 rounded-xl gradient-violet flex items-center justify-center text-sm font-bold text-white">
                {selected.sender_name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{selected.sender_name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  {selected.phone}
                </div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {conversation.map((msg) => (
                <div key={msg.id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                    msg.direction === "outbound"
                      ? "gradient-violet text-white rounded-br-sm"
                      : "bg-white/8 text-foreground rounded-bl-sm"
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.direction === "outbound" ? "text-white/60" : "text-muted-foreground"}`}>
                      {msg.created_date ? format(new Date(msg.created_date), "HH:mm", { locale: fr }) : ""}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Suggestion */}
            <AnimatePresence>
              {(aiLoading || aiSuggestion) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mx-4 mb-3 p-3 bg-primary/8 border border-primary/20 rounded-xl"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">Suggestion IA</span>
                  </div>
                  {aiLoading ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Génération en cours...
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-foreground mb-2">{aiSuggestion}</p>
                      <button
                        onClick={() => setReplyText(aiSuggestion)}
                        className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        Utiliser cette réponse →
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reply input */}
            <div className="p-4 border-t border-white/6">
              <div className="flex items-end gap-2">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Écrire une réponse..."
                    rows={2}
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none"
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!replyText.trim() || sending}
                  className="w-10 h-10 gradient-violet rounded-xl flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                </button>
              </div>
            </div>
          </motion.div>
        ) : !selected ? (
          <div className="hidden md:flex flex-1 items-center justify-center flex-col gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground opacity-40" />
            </div>
            <p className="text-muted-foreground text-sm">Sélectionnez un message</p>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}