import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Search, X, Loader2, LayoutGrid, Kanban, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";
import LeadCard from "@/components/leads/LeadCard";
import KanbanBoard from "@/components/leads/KanbanBoard";
import LeadConversationPanel from "@/components/leads/LeadConversationPanel";
import { getLeadTemperature } from "@/utils/leadTemperature";

const STATUSES = ["tous", "nouveau", "contacté", "converti", "perdu"];
const STATUS_OPTIONS = ["nouveau", "contacté", "converti", "perdu"];

function LeadModal({ lead, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    name: lead?.name || "",
    phone: lead?.phone || "",
    email: lead?.email || "",
    status: lead?.status || "nouveau",
    notes: lead?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.phone) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="card-surface w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-foreground">{lead ? "Modifier le lead" : "Nouveau lead"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          {["name", "phone", "email"].map((field) => (
            <div key={field}>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {field === "name" ? "Nom *" : field === "phone" ? "Téléphone *" : "Email"}
              </label>
              <input
                type={field === "email" ? "email" : "text"}
                value={form[field]}
                onChange={e => setForm({ ...form, [field]: e.target.value })}
                placeholder={field === "phone" ? "+221 77 000 0000" : ""}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-all"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Statut</label>
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-all"
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-background">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Notes sur ce lead..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-all resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          {lead && (
            <button onClick={() => onDelete(lead)} className="flex-1 py-2.5 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors">
              Supprimer
            </button>
          )}
          <button onClick={handleSave} disabled={saving || !form.name || !form.phone}
            className="flex-1 gradient-violet text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("tous");
  const [tempFilter, setTempFilter] = useState("tous");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [view, setView] = useState("kanban");
  const [activeConversation, setActiveConversation] = useState(null); // lead object

  const fetchLeads = async () => {
    const [leadsData, messagesData] = await Promise.all([
      base44.entities.Lead.list("-created_date", 100),
      base44.entities.Message.list("-created_date", 200),
    ]);
    setLeads(leadsData);
    setMessages(messagesData);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  // Keep activeConversation in sync with leads state
  useEffect(() => {
    if (activeConversation) {
      const updated = leads.find(l => l.id === activeConversation.id);
      if (updated) setActiveConversation(updated);
    }
  }, [leads]);

  const filtered = leads.filter(l => {
    const matchStatus = filter === "tous" || l.status === filter;
    const matchSearch = !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search);
    const matchTemp = tempFilter === "tous" || getLeadTemperature(l, messages) === tempFilter;
    return matchStatus && matchSearch && matchTemp;
  });

  const handleSave = async (form) => {
    if (modal === "new") {
      await base44.entities.Lead.create({ ...form, source: "manual" });
    } else {
      await base44.entities.Lead.update(modal.id, form);
    }
    setModal(null);
    fetchLeads();
  };

  const handleDelete = async (lead) => {
    await base44.entities.Lead.delete(lead.id);
    setModal(null);
    if (activeConversation?.id === lead.id) setActiveConversation(null);
    fetchLeads();
  };

  const handleLeadUpdate = async (leadId, newStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    await base44.entities.Lead.update(leadId, { status: newStatus });
  };

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = s === "tous" ? leads.length : leads.filter(l => l.status === s).length;
    return acc;
  }, {});

  return (
    <div className="flex h-full min-h-screen overflow-hidden">
      {/* Main panel */}
      <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${activeConversation ? "hidden lg:flex" : "flex"}`}>
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Leads</h1>
              <p className="text-muted-foreground text-sm mt-0.5">{leads.length} leads au total</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-white/5 border border-white/8 rounded-xl p-1">
                <button
                  onClick={() => setView("kanban")}
                  className={`p-1.5 rounded-lg transition-all ${view === "kanban" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  title="Vue Kanban"
                >
                  <Kanban className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView("grid")}
                  className={`p-1.5 rounded-lg transition-all ${view === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  title="Vue Grille"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setModal("new")}
                className="gradient-violet glow-violet-sm text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" /> Nouveau lead
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-xl px-3 py-2 flex-1 min-w-48 max-w-64">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Nom, téléphone..."
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
              />
            </div>
            {/* Temperature filter */}
            <div className="flex gap-1 sm:gap-1.5">
              {[
                { key: "tous", label: "Tous" },
                { key: "chaud", label: "🔥 Chauds" },
                { key: "tiède", label: "🌡️ Tièdes" },
                { key: "froid", label: "❄️ Froids" },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTempFilter(t.key)}
                  className={`px-2 py-1 sm:px-3 sm:py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    tempFilter === t.key
                      ? "gradient-violet text-white"
                      : "bg-white/5 border border-white/8 text-muted-foreground hover:text-foreground hover:bg-white/10"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {view === "grid" && (
              <div className="flex gap-1.5 flex-wrap">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      filter === s
                        ? "gradient-violet text-white"
                        : "bg-white/5 border border-white/8 text-muted-foreground hover:text-foreground hover:bg-white/10"
                    }`}
                  >
                    {s === "tous" ? "Tous" : s.charAt(0).toUpperCase() + s.slice(1)}
                    <span className="ml-1 opacity-60">({counts[s]})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array(8).fill(0).map((_, i) => <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : view === "kanban" ? (
            <KanbanBoard
              leads={filtered}
              messages={messages}
              onLeadUpdate={handleLeadUpdate}
              onEdit={(lead) => setModal(lead)}
              onOpenConversation={(lead) => setActiveConversation(lead)}
            />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="w-12 h-12 text-muted-foreground mb-3 opacity-30" />
              <p className="text-foreground font-medium">Aucun lead trouvé</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? "Essayez d'autres termes de recherche" : "Ajoutez votre premier lead"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <AnimatePresence>
                {filtered.map(lead => (
                  <div key={lead.id} className="relative group">
                    <LeadCard lead={lead} onClick={() => setModal(lead)} />
                    <button
                      onClick={() => setActiveConversation(lead)}
                      className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-all"
                      title="Ouvrir la conversation"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

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
              onLeadUpdate={(leadId, newStatus) => {
                setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lead form modal */}
      <AnimatePresence>
        {modal && (
          <LeadModal
            lead={modal === "new" ? null : modal}
            onClose={() => setModal(null)}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}