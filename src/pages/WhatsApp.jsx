import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, MessageSquare, Users, Send, Loader2, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MetaApiSetupCard from "@/components/whatsapp/MetaApiSetupCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function WhatsApp() {
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ messages: 0, leadsCreated: 0 });
  const [testResult, setTestResult] = useState(null);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Bonjour ! Ceci est un message test depuis Leadmatic.");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const { user } = useCurrentUser();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const companies = await base44.entities.Company.filter({ user_id: user.id });
      if (companies[0]) {
        setCompany(companies[0]);
        setCompanyId(companies[0].id);
      }
      const [messages, leads] = await Promise.all([
        base44.entities.Message.filter({ created_by: user.email }, "-created_date", 100),
        base44.entities.Lead.filter({ created_by: user.email, source: "whatsapp" }, "-created_date", 100),
      ]);
      setStats({ messages: messages.length, leadsCreated: leads.length });
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSave = async (form) => {
    if (companyId) {
      const updated = await base44.entities.Company.update(companyId, {
        whatsapp_access_token: form.access_token,
        whatsapp_phone_number_id: form.phone_number_id,
        whatsapp_business_account_id: form.business_account_id,
        whatsapp_webhook_verify_token: form.webhook_verify_token,
      });
      setCompany(updated);
    } else {
      const c = await base44.entities.Company.create({
        user_id: user.id,
        name: user.full_name || "Mon Entreprise",
        whatsapp_access_token: form.access_token,
        whatsapp_phone_number_id: form.phone_number_id,
        whatsapp_business_account_id: form.business_account_id,
        whatsapp_webhook_verify_token: form.webhook_verify_token,
      });
      setCompany(c);
      setCompanyId(c.id);
    }
    setTestResult(null);
  };

  const handleTest = async (form) => {
    setTestResult(null);
    const res = await base44.functions.invoke("whatsappTestConnection", {
      access_token: form.access_token,
      phone_number_id: form.phone_number_id,
    });
    setTestResult(res.data);
  };

  const handleSendTest = async () => {
    if (!testPhone || !testMessage) return;
    setSending(true);
    setSendResult(null);
    const res = await base44.functions.invoke("whatsappSendMessage", {
      to: testPhone,
      message: testMessage,
    });
    setSendResult(res.data);
    setSending(false);
  };

  const isConfigured = company?.whatsapp_access_token && company?.whatsapp_phone_number_id;

  const configForCard = {
    access_token: company?.whatsapp_access_token || "",
    phone_number_id: company?.whatsapp_phone_number_id || "",
    business_account_id: company?.whatsapp_business_account_id || "",
    webhook_verify_token: company?.whatsapp_webhook_verify_token || "",
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">WhatsApp Business API</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Connexion via Meta Cloud API (officielle)</p>
      </div>

      {loading ? (
        <div className="card-surface h-72 animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Setup Card */}
          <div className="lg:col-span-2 space-y-4">
            <MetaApiSetupCard
              config={configForCard}
              onSave={handleSave}
              onTest={handleTest}
              testResult={testResult}
            />

            {/* Send test message */}
            {isConfigured && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-surface p-5 space-y-4"
              >
                <h3 className="text-sm font-semibold text-foreground">Envoyer un message test</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Numéro destinataire</label>
                    <input
                      type="text"
                      value={testPhone}
                      onChange={e => setTestPhone(e.target.value)}
                      placeholder="+221771234567"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Message</label>
                    <textarea
                      value={testMessage}
                      onChange={e => setTestMessage(e.target.value)}
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-all resize-none"
                    />
                  </div>
                  {sendResult && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`flex items-center gap-2 p-3 rounded-xl text-xs ${
                        sendResult.success
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                          : "bg-destructive/10 border border-destructive/20 text-destructive"
                      }`}
                    >
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      {sendResult.success ? `Message envoyé ! ID : ${sendResult.message_id}` : sendResult.error}
                    </motion.div>
                  )}
                  <button
                    onClick={handleSendTest}
                    disabled={sending || !testPhone}
                    className="gradient-violet text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {sending ? "Envoi..." : "Envoyer le test"}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Stats sidebar */}
          <div className="space-y-4">
            <div className="card-surface p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Statistiques</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="w-4 h-4" />
                    Messages reçus
                  </div>
                  <span className="text-sm font-semibold text-foreground">{stats.messages}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    Leads créés via WA
                  </div>
                  <span className="text-sm font-semibold text-foreground">{stats.leadsCreated}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="w-4 h-4" />
                    Statut API
                  </div>
                  <StatusBadge status={isConfigured ? "connected" : "disconnected"} />
                </div>
              </div>
            </div>

            <div className="card-surface p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Comment ça fonctionne</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                {[
                  "Configurez vos credentials Meta API",
                  "Webhook reçoit les messages entrants",
                  "Les leads sont créés automatiquement",
                  "Répondez depuis l'Inbox Leadmatic",
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}