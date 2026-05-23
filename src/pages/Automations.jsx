import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Plus, X, Loader2, Clock, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AutomationCard from "@/components/automations/AutomationCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const TRIGGER_OPTIONS = [
  { value: "nouveau", label: "Nouveau lead" },
  { value: "contacté", label: "Lead contacté" },
  { value: "converti", label: "Lead converti" },
  { value: "perdu", label: "Lead perdu" },
  { value: "message_received", label: "Message reçu" },
];

const DELAY_OPTIONS = [
  { value: 5, label: "5 minutes" },
  { value: 60, label: "1 heure" },
  { value: 360, label: "6 heures" },
  { value: 1440, label: "24 heures" },
  { value: 4320, label: "3 jours" },
  { value: 10080, label: "1 semaine" },
];

const DEFAULT_TEMPLATES = [
  { name: "Bienvenue", trigger: "nouveau", content: "Bonjour {{name}} ! Merci de nous avoir contacté. Je suis là pour vous aider. Comment puis-je vous accompagner aujourd'hui ?" },
  { name: "Relance prospect", trigger: "contacté", content: "Bonjour {{name}}, je souhaitais prendre de vos nouvelles. Avez-vous eu le temps de réfléchir à notre proposition ? Je reste disponible pour répondre à vos questions." },
  { name: "Suivi client", trigger: "converti", content: "Bonjour {{name}}, merci pour votre confiance ! Comment se passe votre expérience avec nos services ? N'hésitez pas à me contacter si vous avez besoin d'aide." },
  { name: "Réengagement", trigger: "perdu", content: "Bonjour {{name}}, cela fait un moment. Nous avons de nouvelles offres qui pourraient vous intéresser. Puis-je vous présenter nos dernières actualités ?" },
];

function AutomationModal({ automation, onClose, onSave }) {
  const [form, setForm] = useState({
    name: automation?.name || "",
    trigger_type: automation?.trigger_type || "nouveau",
    delay_minutes: automation?.delay_minutes || 60,
    message_template: automation?.message_template || "",
    active: automation?.active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.message_template) return;
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
        className="card-surface w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-foreground">{automation ? "Modifier l'automation" : "Nouvelle automation"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-muted-foreground transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nom de l'automation *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Message de bienvenue"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Déclencheur</label>
            <select
              value={form.trigger_type}
              onChange={e => setForm({ ...form, trigger_type: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-all"
            >
              {TRIGGER_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Délai avant envoi</label>
            <select
              value={form.delay_minutes}
              onChange={e => setForm({ ...form, delay_minutes: Number(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-all"
            >
              {DELAY_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          {/* Templates suggestion */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Templates rapides</label>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_TEMPLATES.map(t => (
                <button
                  key={t.name}
                  onClick={() => setForm({ ...form, name: form.name || t.name, message_template: t.content, trigger_type: t.trigger })}
                  className="text-xs px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Message template *{" "}
              <span className="text-primary/60">Variables : {"{{name}}"}, {"{{phone}}"}</span>
            </label>
            <textarea
              value={form.message_template}
              onChange={e => setForm({ ...form, message_template: e.target.value })}
              rows={4}
              placeholder="Bonjour {{name}}, ..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-white/4 rounded-xl">
            <div>
              <p className="text-sm font-medium text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">Activer ou désactiver cette automation</p>
            </div>
            <button
              onClick={() => setForm({ ...form, active: !form.active })}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.active ? "bg-primary" : "bg-white/15"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.active ? "translate-x-5.5" : "translate-x-0.5"}`} style={{ transform: form.active ? "translateX(22px)" : "translateX(2px)" }} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-muted-foreground text-sm hover:bg-white/5 transition-colors">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving || !form.name || !form.message_template}
            className="flex-1 gradient-violet text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Automations() {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const { user } = useCurrentUser();

  const fetchAutomations = async () => {
    if (!user) return;
    const data = await base44.entities.Automation.filter({ created_by: user.email }, "-created_date", 50);
    setAutomations(data);
    setLoading(false);
  };

  useEffect(() => { if (user) fetchAutomations(); }, [user]);

  const handleSave = async (form) => {
    if (modal === "new") {
      await base44.entities.Automation.create(form);
    } else {
      await base44.entities.Automation.update(modal.id, form);
    }
    setModal(null);
    fetchAutomations();
  };

  const handleToggle = async (automation) => {
    await base44.entities.Automation.update(automation.id, { active: !automation.active });
    setAutomations(prev => prev.map(a => a.id === automation.id ? { ...a, active: !a.active } : a));
  };

  const handleDelete = async (automation) => {
    await base44.entities.Automation.delete(automation.id);
    fetchAutomations();
  };

  const activeCount = automations.filter(a => a.active).length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automations</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{activeCount} active{activeCount > 1 ? "s" : ""} sur {automations.length}</p>
        </div>
        <button
          onClick={() => setModal("new")}
          className="gradient-violet glow-violet-sm text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Nouvelle automation
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-primary/8 border border-primary/15 rounded-xl">
        <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="text-foreground font-medium">Système d'automatisation WhatsApp</p>
          <p className="text-muted-foreground text-xs mt-0.5">Les automations se déclenchent automatiquement selon les événements de vos leads. Utilisez les variables {"{{name}}"} et {"{{phone}}"} dans vos templates.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-48 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      ) : automations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-muted-foreground opacity-30" />
          </div>
          <p className="text-foreground font-medium mb-1">Aucune automation</p>
          <p className="text-sm text-muted-foreground mb-6">Créez votre première automation pour automatiser vos relances WhatsApp</p>
          <button onClick={() => setModal("new")} className="gradient-violet text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> Créer une automation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {automations.map(a => (
              <AutomationCard
                key={a.id}
                automation={a}
                onToggle={handleToggle}
                onEdit={setModal}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <AutomationModal
            automation={modal === "new" ? null : modal}
            onClose={() => setModal(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}