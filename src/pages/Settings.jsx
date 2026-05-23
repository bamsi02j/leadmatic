import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Building2, Key, Bell, Shield, Save, Loader2, Check, Plus, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TABS = [
  { id: "profile", label: "Profil", icon: User },
  { id: "company", label: "Entreprise", icon: Building2 },
  { id: "ai", label: "Configuration IA", icon: Key },
  { id: "templates", label: "Templates", icon: Bell },
];

function ProfileTab({ user }) {
  const [form, setForm] = useState({ full_name: user?.full_name || "", email: user?.email || "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({ full_name: form.full_name });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-md">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nom complet</label>
        <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-all" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
        <input type="email" value={form.email} disabled
          className="w-full bg-white/4 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed" />
      </div>
      <button onClick={handleSave} disabled={saving}
        className="gradient-violet text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
        {saved ? "Enregistré !" : "Enregistrer"}
      </button>
    </div>
  );
}

function CompanyTab() {
  const [form, setForm] = useState({ name: "", industry: "", whatsapp_phone: "" });
  const [loaded, setLoaded] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const companies = await base44.entities.Company.filter({ user_id: user.id });
      if (companies[0]) {
        setForm({ name: companies[0].name || "", industry: companies[0].industry || "", whatsapp_phone: companies[0].whatsapp_phone || "" });
        setCompanyId(companies[0].id);
      }
      setLoaded(true);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const user = await base44.auth.me();
    if (companyId) {
      await base44.entities.Company.update(companyId, form);
    } else {
      const c = await base44.entities.Company.create({ ...form, user_id: user.id });
      setCompanyId(c.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!loaded) return <div className="h-32 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4 max-w-md">
      {[
        { field: "name", label: "Nom de l'entreprise", placeholder: "Mon Entreprise" },
        { field: "industry", label: "Secteur d'activité", placeholder: "Commerce, Services, Tech..." },
        { field: "whatsapp_phone", label: "Numéro WhatsApp Business", placeholder: "+221 77 000 0000" },
      ].map(({ field, label, placeholder }) => (
        <div key={field}>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
          <input type="text" value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
            placeholder={placeholder}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-all" />
        </div>
      ))}
      <button onClick={handleSave} disabled={saving}
        className="gradient-violet text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
        {saved ? "Enregistré !" : "Enregistrer"}
      </button>
    </div>
  );
}

function AITab() {
  const [form, setForm] = useState({ ai_api_key: "", ai_provider: "openai" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const user = await base44.auth.me();
    const companies = await base44.entities.Company.filter({ user_id: user.id });
    if (companies[0]) {
      await base44.entities.Company.update(companies[0].id, form);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5 max-w-md">
      <div className="p-4 bg-primary/8 border border-primary/15 rounded-xl">
        <p className="text-sm text-foreground font-medium mb-1">Configuration IA</p>
        <p className="text-xs text-muted-foreground">Ajoutez votre clé API pour activer les suggestions automatiques de réponses dans l'inbox.</p>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Fournisseur IA</label>
        <div className="flex gap-2">
          {["openai", "claude"].map(p => (
            <button key={p} onClick={() => setForm({ ...form, ai_provider: p })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                form.ai_provider === p ? "gradient-violet text-white border-transparent" : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"
              }`}>
              {p === "openai" ? "OpenAI GPT" : "Anthropic Claude"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Clé API</label>
        <input type="password" value={form.ai_api_key} onChange={e => setForm({ ...form, ai_api_key: e.target.value })}
          placeholder={form.ai_provider === "openai" ? "sk-..." : "sk-ant-..."}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-all font-mono" />
        <p className="text-xs text-muted-foreground mt-1.5">Votre clé API est chiffrée et stockée en sécurité.</p>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="gradient-violet text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
        {saved ? "Enregistré !" : "Enregistrer la clé"}
      </button>
    </div>
  );
}

function TemplatesTab() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTemplate, setNewTemplate] = useState({ name: "", content: "", category: "custom" });
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const CATEGORIES = ["bienvenue", "relance", "suivi", "confirmation", "faq", "custom"];

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const data = await base44.entities.MessageTemplate.filter({ created_by: user.email }, "-created_date", 50);
      setTemplates(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleAdd = async () => {
    if (!newTemplate.name || !newTemplate.content) return;
    setAdding(true);
    await base44.entities.MessageTemplate.create(newTemplate);
    const data = await base44.entities.MessageTemplate.list("-created_date", 50);
    setTemplates(data);
    setNewTemplate({ name: "", content: "", category: "custom" });
    setShowForm(false);
    setAdding(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.MessageTemplate.delete(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{templates.length} templates créés</p>
        <button onClick={() => setShowForm(!showForm)}
          className="text-sm gradient-violet text-white px-3 py-2 rounded-xl flex items-center gap-1.5 hover:opacity-90 transition-opacity">
          <Plus className="w-3.5 h-3.5" /> Nouveau template
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card-surface p-4 space-y-3 border border-primary/20">
          <input type="text" value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
            placeholder="Nom du template" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-all" />
          <select value={newTemplate.category} onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea value={newTemplate.content} onChange={e => setNewTemplate({ ...newTemplate, content: e.target.value })}
            placeholder="Contenu du template... Utilisez {{name}} et {{phone}}" rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-all resize-none" />
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-muted-foreground text-sm hover:bg-white/5 transition-colors">Annuler</button>
            <button onClick={handleAdd} disabled={adding || !newTemplate.name || !newTemplate.content}
              className="flex-1 gradient-violet text-white py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-40">
              {adding && <Loader2 className="w-3 h-3 animate-spin" />} Créer
            </button>
          </div>
        </motion.div>
      )}

      <div className="space-y-2">
        {loading ? Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />) :
          templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Aucun template. Créez votre premier template ci-dessus.</div>
          ) : (
            templates.map(t => (
              <div key={t.id} className="card-surface p-3.5 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">{t.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.content}</p>
                </div>
                <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )
        }
      </div>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Gérez votre compte et vos préférences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeTab === tab.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 card-surface p-6">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {activeTab === "profile" && <ProfileTab user={user} />}
            {activeTab === "company" && <CompanyTab />}
            {activeTab === "ai" && <AITab />}
            {activeTab === "templates" && <TemplatesTab />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}