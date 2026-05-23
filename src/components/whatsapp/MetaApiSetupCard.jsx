import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ExternalLink, Loader2, MessageSquare, AlertCircle, Eye, EyeOff, Copy, Check } from "lucide-react";

export default function MetaApiSetupCard({ config, onSave, onTest, testResult }) {
  const [form, setForm] = useState({
    access_token: config?.access_token || "",
    phone_number_id: config?.phone_number_id || "",
    business_account_id: config?.business_account_id || "",
    webhook_verify_token: config?.webhook_verify_token || "",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);

  const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;

  const handleSave = async () => {
    if (!form.access_token || !form.phone_number_id) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const handleTest = async () => {
    setTesting(true);
    await onTest(form);
    setTesting(false);
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isConfigured = config?.access_token && config?.phone_number_id;

  return (
    <div className="card-surface p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-violet flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">WhatsApp Business API</h3>
            <p className="text-xs text-muted-foreground">Meta Cloud API (officielle)</p>
          </div>
        </div>
        {isConfigured && (
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-xs text-emerald-400 font-medium">Configuré</span>
          </div>
        )}
      </div>

      {/* Guide link */}
      <a
        href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Guide de démarrage Meta WhatsApp Cloud API
      </a>

      {/* Steps */}
      <div className="space-y-4">
        {/* Step 1 */}
        <div className="p-3.5 bg-white/3 border border-white/6 rounded-xl">
          <p className="text-xs font-semibold text-foreground mb-1">Étape 1 — Créer une app Meta</p>
          <p className="text-xs text-muted-foreground">Allez sur <span className="text-primary">developers.facebook.com</span> → Créer une app → Business → Ajouter WhatsApp.</p>
        </div>

        {/* Form fields */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Token d'accès permanent *
              <span className="text-muted-foreground/50 font-normal ml-1">(WhatsApp → API Setup → Access Token)</span>
            </label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={form.access_token}
                onChange={e => setForm({ ...form, access_token: e.target.value })}
                placeholder="EAAxxxxx..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-all font-mono"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Phone Number ID *
              </label>
              <input
                type="text"
                value={form.phone_number_id}
                onChange={e => setForm({ ...form, phone_number_id: e.target.value })}
                placeholder="123456789012345"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-all font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                WABA ID (Business Account)
              </label>
              <input
                type="text"
                value={form.business_account_id}
                onChange={e => setForm({ ...form, business_account_id: e.target.value })}
                placeholder="987654321098765"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-all font-mono"
              />
            </div>
          </div>
        </div>

        {/* Webhook section */}
        <div className="p-3.5 bg-primary/5 border border-primary/15 rounded-xl space-y-3">
          <p className="text-xs font-semibold text-foreground">Étape 2 — Configurer le Webhook</p>
          <p className="text-xs text-muted-foreground">Dans Meta → WhatsApp → Configuration → Webhook, entrez ces valeurs :</p>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">URL du Webhook</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-muted-foreground font-mono truncate">
                {webhookUrl}
              </div>
              <button
                onClick={copyWebhook}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Token de vérification webhook</label>
            <input
              type="text"
              value={form.webhook_verify_token}
              onChange={e => setForm({ ...form, webhook_verify_token: e.target.value })}
              placeholder="mon_token_secret_123"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-all"
            />
            <p className="text-xs text-muted-foreground mt-1">Ce token doit correspondre à celui entré dans Meta Developers.</p>
          </div>

          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Champs à s'abonner :</p>
            <div className="flex flex-wrap gap-1.5">
              {["messages", "message_deliveries", "message_reads"].map(f => (
                <span key={f} className="px-2 py-0.5 bg-white/8 rounded-full font-mono">{f}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Test result */}
        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 p-3 rounded-xl text-xs ${
              testResult.success
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : "bg-destructive/10 border border-destructive/20 text-destructive"
            }`}
          >
            {testResult.success ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {testResult.message}
          </motion.div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleTest}
          disabled={testing || !form.access_token || !form.phone_number_id}
          className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
          Tester la connexion
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !form.access_token || !form.phone_number_id}
          className="flex-1 gradient-violet text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}