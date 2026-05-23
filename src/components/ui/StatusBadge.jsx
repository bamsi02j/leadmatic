const statusConfig = {
  // Lead statuses
  nouveau: { label: "Nouveau", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  "contacté": { label: "Contacté", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  converti: { label: "Converti", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  perdu: { label: "Perdu", color: "bg-red-500/15 text-red-400 border-red-500/20" },
  // Message statuses
  unread: { label: "Non lu", color: "bg-primary/15 text-primary border-primary/20" },
  read: { label: "Lu", color: "bg-white/10 text-muted-foreground border-white/10" },
  replied: { label: "Répondu", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  // Session statuses
  connected: { label: "Connecté", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  disconnected: { label: "Déconnecté", color: "bg-red-500/15 text-red-400 border-red-500/20" },
  waiting_qr: { label: "En attente QR", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  // Follow-up statuses
  pending: { label: "En attente", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  sent: { label: "Envoyé", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  cancelled: { label: "Annulé", color: "bg-white/10 text-muted-foreground border-white/10" },
  failed: { label: "Échoué", color: "bg-red-500/15 text-red-400 border-red-500/20" },
};

export default function StatusBadge({ status, className = "" }) {
  const config = statusConfig[status] || { label: status, color: "bg-white/10 text-muted-foreground border-white/10" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
      {config.label}
    </span>
  );
}