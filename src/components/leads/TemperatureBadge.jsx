import { TEMP_CONFIG } from "@/utils/leadTemperature";

export default function TemperatureBadge({ temperature, size = "sm" }) {
  const cfg = TEMP_CONFIG[temperature] || TEMP_CONFIG["froid"];
  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium
        ${cfg.bg} ${cfg.color} ${cfg.border}
        ${isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"}
      `}
    >
      {cfg.pulse ? (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg.dot}`} />
        </span>
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      )}
      {cfg.emoji} {cfg.label}
    </span>
  );
}