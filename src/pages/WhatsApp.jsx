import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Smartphone, CheckCircle, WifiOff, Clock, Activity, MessageSquare, Users, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import QRConnectCard from "@/components/whatsapp/QRConnectCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const MOCK_LOGS = [
  { time: new Date(Date.now() - 120000), event: "Session WhatsApp initialisée", type: "info" },
  { time: new Date(Date.now() - 90000), event: "QR Code généré — en attente de scan", type: "pending" },
  { time: new Date(Date.now() - 60000), event: "Connexion établie avec le numéro", type: "success" },
  { time: new Date(Date.now() - 30000), event: "3 messages reçus et synchronisés", type: "success" },
  { time: new Date(Date.now() - 10000), event: "Heartbeat — session active", type: "info" },
];

export default function WhatsApp() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ messages: 0, leadsCreated: 0 });
  const { user } = useCurrentUser();

  useEffect(() => {
    if (!user) return;

    const fetchSession = async () => {
      const sessions = await base44.entities.WhatsappSession.filter({ created_by: user.email }, "-created_date", 1);
      setSession(sessions[0] || null);
      setLoading(false);
    };

    const fetchStats = async () => {
      const [messages, leads] = await Promise.all([
        base44.entities.Message.filter({ created_by: user.email }, "-created_date", 100),
        base44.entities.Lead.filter({ created_by: user.email, source: "whatsapp" }, "-created_date", 100),
      ]);
      setStats({ messages: messages.length, leadsCreated: leads.length });
    };

    fetchSession();
    fetchStats();
  }, [user]);

  const handleConnect = async () => {
    // Create or update session in waiting_qr state
    if (session) {
      const updated = await base44.entities.WhatsappSession.update(session.id, { status: "waiting_qr" });
      setSession(updated);
    } else {
      const user = await base44.auth.me();
      const newSession = await base44.entities.WhatsappSession.create({
        user_id: user.id,
        status: "waiting_qr",
      });
      setSession(newSession);
    }
  };

  const handleRefresh = async () => {
    if (!session) return;
    // Simulate scan success after refresh
    const updated = await base44.entities.WhatsappSession.update(session.id, {
      status: session.status === "waiting_qr" ? "waiting_qr" : "disconnected",
    });
    setSession(updated);
  };

  const handleSimulateConnect = async () => {
    if (!session) return;
    const updated = await base44.entities.WhatsappSession.update(session.id, {
      status: "connected",
      phone_number: "+221 77 123 4567",
      last_connected_at: new Date().toISOString(),
    });
    setSession(updated);
  };

  const handleDisconnect = async () => {
    if (!session) return;
    const updated = await base44.entities.WhatsappSession.update(session.id, { status: "disconnected" });
    setSession(updated);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">WhatsApp</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Connexion et gestion de votre session WhatsApp</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Connect Card */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="card-surface h-72 animate-pulse" />
          ) : (
            <QRConnectCard session={session} onConnect={handleConnect} onRefresh={handleRefresh} />
          )}

          {/* Simulate buttons for demo */}
          {session?.status === "waiting_qr" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl"
            >
              <p className="text-xs text-amber-400 mb-3 font-medium">
                Mode démonstration — Simuler la connexion WhatsApp
              </p>
              <button
                onClick={handleSimulateConnect}
                className="text-xs bg-amber-500/15 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-xl hover:bg-amber-500/25 transition-colors"
              >
                Simuler scan QR Code ✓
              </button>
            </motion.div>
          )}

          {session?.status === "connected" && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleDisconnect}
                className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-4 py-2 rounded-xl hover:bg-destructive/20 transition-colors flex items-center gap-2"
              >
                <WifiOff className="w-4 h-4" />
                Déconnecter
              </button>
            </div>
          )}
        </div>

        {/* Stats + Logs */}
        <div className="space-y-4">
          {/* Quick stats */}
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
                  Leads créés
                </div>
                <span className="text-sm font-semibold text-foreground">{stats.leadsCreated}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="w-4 h-4" />
                  Statut session
                </div>
                <StatusBadge status={session?.status || "disconnected"} />
              </div>
            </div>
          </div>

          {/* Activity logs */}
          <div className="card-surface p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Journal d'activité</h3>
            <div className="space-y-2.5">
              {MOCK_LOGS.map((log, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    log.type === "success" ? "bg-emerald-400" :
                    log.type === "pending" ? "bg-amber-400" :
                    "bg-primary/60"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">{log.event}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(log.time, { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Architecture info */}
          <div className="card-surface p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Architecture</h3>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                Backend Node.js + Baileys
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                WebSocket temps réel
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                Session persistante Supabase
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                Reconnexion automatique
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}