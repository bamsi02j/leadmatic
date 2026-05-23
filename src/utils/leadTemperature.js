/**
 * Calcule la température d'un lead : "chaud", "tiède" ou "froid"
 * basé sur le statut, l'ancienneté et les messages.
 */
export function getLeadTemperature(lead, messages = []) {
  if (lead.status === "perdu") return "froid";
  if (lead.status === "converti") return "tiède"; // déjà conclu

  const createdAt = new Date(lead.created_date);
  const now = new Date();
  const ageHours = (now - createdAt) / (1000 * 60 * 60);

  const leadMessages = messages.filter(m => m.lead_id === lead.id);
  const hasUnread = leadMessages.some(m => m.status === "unread");
  const lastMessageAt = leadMessages.length > 0
    ? Math.max(...leadMessages.map(m => new Date(m.created_date || m.timestamp).getTime()))
    : null;
  const lastMessageHoursAgo = lastMessageAt ? (now - lastMessageAt) / (1000 * 60 * 60) : null;

  // 🔥 Chaud :
  // - Lead très récent (< 24h) en statut contacté
  // - OU message non lu existant
  // - OU dernier message il y a moins de 2h
  if (
    hasUnread ||
    (lastMessageHoursAgo !== null && lastMessageHoursAgo < 2) ||
    (lead.status === "contacté" && ageHours < 24)
  ) {
    return "chaud";
  }

  // 🌡️ Tiède :
  // - Lead < 7 jours
  // - OU statut contacté
  // - OU dernier message < 48h
  if (
    ageHours < 7 * 24 ||
    lead.status === "contacté" ||
    (lastMessageHoursAgo !== null && lastMessageHoursAgo < 48)
  ) {
    return "tiède";
  }

  // ❄️ Froid : tout le reste
  return "froid";
}

export const TEMP_CONFIG = {
  chaud: {
    label: "Chaud",
    emoji: "🔥",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/25",
    dot: "bg-red-400",
    pulse: true,
  },
  tiède: {
    label: "Tiède",
    emoji: "🌡️",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/25",
    dot: "bg-orange-400",
    pulse: false,
  },
  froid: {
    label: "Froid",
    emoji: "❄️",
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    dot: "bg-slate-500",
    pulse: false,
  },
};