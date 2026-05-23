import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  TrendingUp, Search, Plus, X, Phone, Mail, Clock, MoreHorizontal,
  MessageSquare, Bell, ChevronRight, User, Zap, Target, ArrowRight
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import LeadConversationPanel from "@/components/leads/LeadConversationPanel";
import { AnimatePresence as AP } from "framer-motion";

const COLUMNS = [
  {
    key: "nouveau",
    label: "Nouveau",
    emoji: "🆕",
    color: "text-blue-400",
    bg: "bg-blue-500/8",
    border: "border-blue-500/20",
    dot: "bg-blue-400",
    headerBg: "bg-blue-500/10",
    glow: "shadow-blue-500/10",
    description: "Leads entrants non traités",
  },
  {
    key: "contacté",
    label: "Contacté",
    emoji: "📞",
    color: "text-amber-400",
    bg: "bg-amber-500/8",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
    headerBg: "bg-amber-500/10",
    glow: "shadow-amber-500/10",
    description: "Premier contact établi",
  },
  {
    key: "converti",
    label: "Converti",
    emoji: "✅",
    color: "text-emerald-400",
    bg: "bg-emerald-500/8",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
    headerBg: "bg-emerald-500/10",
    glow: "shadow-emerald-500/10",
    description: "Opportunité conclue",
  },
  {
    key: "perdu",
    label: "Perdu",
    emoji: "❌",
    color: "text-red-400",
    bg: "bg-red-500/8",
    border: "border-red-500/20",
    dot: "bg-red-400",
    headerBg: "bg-red-500/10",
    glow: "shadow-red-500/10",
    description: "Opportunité non conclue",
  },
];

const IMPORTANT_TRANSITIONS = {
  "nouveau→converti": "🎉 Lead converti directement !",
  "contacté→converti": "✅ Lead converti avec succès !",
  "converti→perdu": "⚠️ Lead converti marqué perdu",
  "nouveau→perdu": "⚠️ Lead perdu sans contact",
};

// ─── Quick Detail Panel ───────────────────────────────────────────────────────
function LeadDetailPanel({ lead, onClose, onEdit, onOpenConversation, col }) {
  if (!lead) return null;
  const age = lead.created_date
    ? formatDistanceToNow(new Date(lead.created_date), { addSuffix: true, locale: fr })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-72 flex-shrink-0 card-surface border border-white/8 rounded-2xl p-4 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Détail lead</span>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/8 text-muted-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-2xl ${col?.headerBg} ${col?.color} flex items-center justify-center text-base font-bold`}>
          {lead.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">{lead.name}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${col?.bg} ${col?.color} border ${col?.border}`}>
            {col?.emoji} {col?.label}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{lead.phone}</span>
        </div>
        {lead.email && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{age}</span>
        </div>
        {lead.source && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="capitalize">{lead.source}</span>
          </div>
        )}
      </div>

      {lead.notes && (
        <div className="bg-white/4 rounded-xl p-3">
          <p className="text-xs text-muted-foreground/80 italic leading-relaxed">{lead.notes}</p>
        </div>
      )}

      <div className="flex flex-col gap-2 mt-auto">
        <button
          onClick={() => onOpenConversation(lead)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl gradient-violet text-white text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <MessageSquare className="w-3.5 h-3.5" /> Ouvrir la conversation
        </button>
        <button
          onClick={() => onEdit(lead)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
        >
          <MoreHorizontal className="w-3.5 h-3.5" /> Modifier le lead
        </button>
      </div>
    </motion.div>
  );
}

// ─── Kanban Card ─────────────────────────────────────────────────────────────
function PipelineCard({ lead, index, col, onSelect, isSelected }) {
  const initials = lead.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  const age = lead.created_date
    ? formatDistanceToNow(new Date(lead.created_date), { addSuffix: true, locale: fr })
    : "";

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onSelect(lead)}
          className={`
            group rounded-xl border p-3 mb-2 cursor-grab active:cursor-grabbing select-none
            transition-all duration-150
            ${snapshot.isDragging
              ? "shadow-2xl shadow-primary/20 scale-[1.03] rotate-1 border-primary/40 bg-card z-50"
              : isSelected
                ? `${col.bg} border-${col.border} shadow-md`
                : "bg-card/80 border-white/8 hover:border-white/16 hover:bg-card"
            }
          `}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg ${col.headerBg} ${col.color} flex items-center justify-center text-[11px] font-bold flex-shrink-0`}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight truncate">{lead.name}</p>
                {lead.source && (
                  <span className="text-[10px] text-muted-foreground/60 capitalize">{lead.source}</span>
                )}
              </div>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 transition-all ${isSelected ? col.color : "text-muted-foreground/30 group-hover:text-muted-foreground"}`} />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
            <Phone className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </div>

          {lead.notes && (
            <p className="text-[10px] text-muted-foreground/60 line-clamp-1 italic mt-1.5 border-t border-white/5 pt-1.5">
              {lead.notes}
            </p>
          )}

          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/5">
            <Clock className="w-2.5 h-2.5 text-muted-foreground/40" />
            <span className="text-[10px] text-muted-foreground/40">{age}</span>
          </div>
        </div>
      )}
    </Draggable>
  );
}

// ─── Notification Toast ───────────────────────────────────────────────────────
function NotifToast({ notif, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      className="fixed top-6 right-6 z-[100] flex items-start gap-3 card-surface border border-primary/20 p-4 rounded-xl shadow-2xl max-w-xs"
    >
      <Bell className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs font-semibold text-foreground">{notif.message}</p>
        <p className="text-[11px] text-primary mt-0.5">{notif.leadName}</p>
      </div>
      <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
    </motion.div>
  );
}

// ─── Main Pipeline Page ───────────────────────────────────────────────────────
export default function Pipeline() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const fetchLeads = async () => {
    const data = await base44.entities.Lead.list("-created_date", 200);
    setLeads(data);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  useEffect(() => {
    if (selectedLead) {
      const updated = leads.find(l => l.id === selectedLead.id);
      if (updated) setSelectedLead(updated);
    }
  }, [leads]);

  const filtered = leads.filter(l =>
    !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search)
  );

  const fireNotification = (leadName, fromStatus, toStatus) => {
    const key = `${fromStatus}→${toStatus}`;
    const message = IMPORTANT_TRANSITIONS[key];
    if (!message) return;
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, leadName }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const onDragEnd = async (result) => {
    const { draggableId, destination, source } = result;
    if (!destination) return;
    const fromStatus = source.droppableId;
    const toStatus = destination.droppableId;
    if (fromStatus === toStatus) return;
    const lead = leads.find(l => l.id === draggableId);
    if (!lead) return;
    setLeads(prev => prev.map(l => l.id === draggableId ? { ...l, status: toStatus } : l));
    await base44.entities.Lead.update(draggableId, { status: toStatus });
    fireNotification(lead.name, fromStatus, toStatus);
  };

  const handleLeadUpdate = (leadId, newStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  };

  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.status === "converti").length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const selectedCol = selectedLead ? COLUMNS.find(c => c.key === selectedLead.status) : null;

  return (
    <div className="flex h-full min-h-screen overflow-hidden">
      {/* Main area */}
      <div className={`flex flex-col flex-1 min-w-0 overflow-hidden transition-all duration-300 ${activeConversation ? "hidden lg:flex" : "flex"}`}>
        {/* Header */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-violet flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">Pipeline</h1>
                <p className="text-xs text-muted-foreground">Glissez les leads entre les étapes</p>
              </div>
            </div>

            {/* Stats strip */}
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              {COLUMNS.map(col => {
                const count = leads.filter(l => l.status === col.key).length;
                return (
                  <div key={col.key} className="flex items-center gap-1.5 text-xs">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className="text-muted-foreground">{col.label}</span>
                    <span className={`font-bold ${col.color}`}>{count}</span>
                  </div>
                );
              })}
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-1.5 text-xs">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-muted-foreground">Taux</span>
                <span className="font-bold text-emerald-400">{conversionRate}%</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex h-2 rounded-full overflow-hidden bg-white/5">
              {COLUMNS.map(col => {
                const count = leads.filter(l => l.status === col.key).length;
                const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
                return (
                  <motion.div
                    key={col.key}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className={`h-full ${col.dot.replace("bg-", "bg-")}`}
                    title={`${col.label}: ${count}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2 max-w-xs">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un lead..."
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Kanban */}
        <div className="flex-1 overflow-x-auto px-4 sm:px-6 pb-6">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-start min-w-[600px]">
                {COLUMNS.map(col => {
                  const colLeads = filtered.filter(l => l.status === col.key);
                  return (
                    <div key={col.key} className="flex flex-col">
                      {/* Column Header */}
                      <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl mb-2 ${col.bg} border ${col.border}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-base">{col.emoji}</span>
                          <div>
                            <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
                            <p className="text-[10px] text-muted-foreground/60 hidden sm:block">{col.description}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.color} border ${col.border}`}>
                          {colLeads.length}
                        </span>
                      </div>

                      {/* Droppable */}
                      <Droppable droppableId={col.key}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`
                              flex-1 min-h-[200px] rounded-xl p-2 transition-all duration-150
                              ${snapshot.isDraggingOver
                                ? `${col.bg} border-2 ${col.border} shadow-inner`
                                : "bg-white/2 border border-dashed border-white/8"
                              }
                            `}
                          >
                            <AnimatePresence>
                              {colLeads.map((lead, index) => (
                                <motion.div
                                  key={lead.id}
                                  layout
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                >
                                  <PipelineCard
                                    lead={lead}
                                    index={index}
                                    col={col}
                                    onSelect={(l) => setSelectedLead(prev => prev?.id === l.id ? null : l)}
                                    isSelected={selectedLead?.id === lead.id}
                                  />
                                </motion.div>
                              ))}
                            </AnimatePresence>
                            {provided.placeholder}
                            {colLeads.length === 0 && !snapshot.isDraggingOver && (
                              <div className="flex flex-col items-center justify-center h-24 text-center">
                                <span className="text-2xl opacity-20">○</span>
                                <p className="text-[11px] text-muted-foreground/40 mt-1">Glisser ici</p>
                              </div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          )}
        </div>
      </div>

      {/* Lead Detail Panel */}
      <AnimatePresence>
        {selectedLead && !activeConversation && (
          <div className="hidden lg:flex flex-shrink-0 p-4 pl-0">
            <LeadDetailPanel
              lead={selectedLead}
              col={selectedCol}
              onClose={() => setSelectedLead(null)}
              onEdit={() => {}} // handled via Leads page
              onOpenConversation={(lead) => {
                setActiveConversation(lead);
                setSelectedLead(null);
              }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Conversation Panel */}
      <AnimatePresence>
        {activeConversation && (
          <motion.div
            key="conv-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "100%", opacity: 1, maxWidth: 420 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="flex-shrink-0 h-screen sticky top-0 overflow-hidden lg:max-w-[420px] w-full"
          >
            <LeadConversationPanel
              lead={activeConversation}
              onClose={() => setActiveConversation(null)}
              onLeadUpdate={handleLeadUpdate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Toasts */}
      <AnimatePresence>
        {notifications.map(notif => (
          <NotifToast
            key={notif.id}
            notif={notif}
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}