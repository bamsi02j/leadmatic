import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, MessageSquare, TrendingUp, Inbox, Activity, ArrowRight, PhoneCall, CheckCheck, UserPlus, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import StatsCard from "@/components/ui/StatsCard";
import StatusBadge from "@/components/ui/StatusBadge";
import FollowUpCalendar from "@/components/dashboard/FollowUpCalendar";
import HotLeadsAlert from "@/components/leads/HotLeadsAlert";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="card-surface px-3 py-2 text-xs">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [leadsData, messagesData] = await Promise.all([
        base44.entities.Lead.list("-created_date", 100),
        base44.entities.Message.list("-created_date", 50),
      ]);
      setLeads(leadsData);
      setMessages(messagesData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.status === "converti").length;
  const unreadMessages = messages.filter(m => m.status === "unread").length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  // Build chart data for last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = format(d, "EEE", { locale: fr });
    const dayLeads = leads.filter(l => {
      const ld = new Date(l.created_date);
      return ld.toDateString() === d.toDateString();
    }).length;
    const dayMsgs = messages.filter(m => {
      const md = new Date(m.created_date);
      return md.toDateString() === d.toDateString();
    }).length;
    return { day: dayStr, leads: dayLeads, messages: dayMsgs };
  });

  const statusData = [
    { name: "Nouveau", value: leads.filter(l => l.status === "nouveau").length, fill: "#3B82F6" },
    { name: "Contacté", value: leads.filter(l => l.status === "contacté").length, fill: "#F59E0B" },
    { name: "Converti", value: leads.filter(l => l.status === "converti").length, fill: "#10B981" },
    { name: "Perdu", value: leads.filter(l => l.status === "perdu").length, fill: "#EF4444" },
  ];

  const recentLeads = leads.slice(0, 5);

  // Weekly stats
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const leadsThisWeek = leads.filter(l => new Date(l.created_date) >= oneWeekAgo).length;
  const activeConversations = messages.reduce((acc, m) => {
    if (!acc.includes(m.lead_id)) acc.push(m.lead_id);
    return acc;
  }, []).length;
  const repliedMessages = messages.filter(m => m.status === "replied").length;
  const responseRate = messages.length > 0 ? Math.round((repliedMessages / messages.length) * 100) : 0;
  const avgResponseTime = "< 2h"; // indicatif

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">Vue d'ensemble de votre activité</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-xs sm:text-sm flex-shrink-0">
          <Activity className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-muted-foreground whitespace-nowrap">7 derniers jours</span>
        </div>
      </div>

      {/* Hot Leads Alert */}
      {!alertDismissed && !loading && (
        <HotLeadsAlert
          leads={leads}
          messages={messages}
          onDismiss={() => setAlertDismissed(true)}
        />
      )}

      {/* WhatsApp CRM Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            icon: PhoneCall,
            label: "Conversations actives",
            value: activeConversations,
            sub: "Leads avec messages",
            color: "#25D366",
            bg: "rgba(37,211,102,0.08)",
          },
          {
            icon: CheckCheck,
            label: "Taux de réponse",
            value: `${responseRate}%`,
            sub: `${repliedMessages} messages répondus`,
            color: "#20BA60",
            bg: "rgba(32,186,96,0.08)",
          },
          {
            icon: UserPlus,
            label: "Leads cette semaine",
            value: leadsThisWeek,
            sub: "Nouveaux cette semaine",
            color: "#34D399",
            bg: "rgba(52,211,153,0.08)",
          },
          {
            icon: Clock,
            label: "Temps de réponse",
            value: avgResponseTime,
            sub: "Délai moyen estimé",
            color: "#6EE7B7",
            bg: "rgba(110,231,183,0.08)",
          },
        ].map((w, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="card-surface p-3 sm:p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: w.bg }}>
                <w.icon className="w-4 h-4" style={{ color: w.color }} />
              </div>
              <span className="text-xs text-muted-foreground font-medium px-2 py-1 rounded-lg bg-white/5 whitespace-nowrap">WhatsApp</span>
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-foreground break-words">{w.value}</p>
              <p className="text-xs font-medium mt-0.5 break-words" style={{ color: w.color }}>{w.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 break-words line-clamp-2">{w.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard title="Total Leads" value={totalLeads} icon={Users} color="violet" subtitle="Tous statuts confondus" />
        <StatsCard title="Leads Convertis" value={convertedLeads} icon={TrendingUp} color="green" subtitle={`${conversionRate}% taux de conversion`} />
        <StatsCard title="Messages non lus" value={unreadMessages} icon={MessageSquare} color="amber" subtitle="À traiter" />
        <StatsCard title="Taux de conversion" value={`${conversionRate}%`} icon={TrendingUp} color="blue" subtitle={`${convertedLeads} sur ${totalLeads} leads`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Area chart */}
        <div className="lg:col-span-2 card-surface p-3 sm:p-5">
          <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-4">Activité — 7 derniers jours</h3>
          <ResponsiveContainer width="100%" height={160} className="sm:h-[200px]">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#25D366" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#25D366" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="leads" name="Leads" stroke="#25D366" fill="url(#colorLeads)" strokeWidth={2} />
              <Area type="monotone" dataKey="messages" name="Messages" stroke="#10B981" fill="url(#colorMsgs)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart statuses */}
        <div className="card-surface p-3 sm:p-5">
          <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-4">Leads par statut</h3>
          <ResponsiveContainer width="100%" height={160} className="sm:h-[200px]">
            <BarChart data={statusData} layout="vertical">
              <XAxis type="number" tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Leads" radius={[0, 4, 4, 0]}>
                {statusData.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Follow-up Calendar */}
      <FollowUpCalendar />

      {/* Recent leads */}
      <div className="card-surface p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
          <h3 className="text-xs sm:text-sm font-semibold text-foreground">Leads récents</h3>
          <Link to="/leads" className="text-xs text-primary flex items-center gap-1 hover:text-primary/80 transition-colors flex-shrink-0">
            Voir tout <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentLeads.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">Aucun lead pour l'instant</p>
            <Link to="/leads" className="text-xs text-primary mt-2 inline-block hover:underline">Ajouter un lead</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 py-2.5 px-3 rounded-xl hover:bg-white/4 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0">
                    {lead.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-foreground truncate">{lead.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{lead.phone}</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <StatusBadge status={lead.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}