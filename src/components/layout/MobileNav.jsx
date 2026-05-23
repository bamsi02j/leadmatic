import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, MessageSquare, Users, Zap, Smartphone } from "lucide-react";

const items = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: MessageSquare, label: "Inbox", path: "/inbox" },
  { icon: Users, label: "Leads", path: "/leads" },
  { icon: Zap, label: "Auto", path: "/automations" },
  { icon: Smartphone, label: "WhatsApp", path: "/whatsapp" },
];

export default function MobileNav({ unreadCount = 0 }) {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/5 flex items-center justify-around px-2 py-2">
      {items.map((item) => {
        const active = location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
            {item.label === "Inbox" && unreadCount > 0 && (
              <span className="absolute -top-0.5 right-1 w-4 h-4 bg-primary text-white text-[9px] rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}