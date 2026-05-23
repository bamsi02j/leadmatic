import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { differenceInHours } from "date-fns";

const THRESHOLD_HOURS = 48;
const STORAGE_KEY = "leadmatic_dismissed_alerts";

function getDismissed() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveDismissed(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function useFollowUpAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const scan = useCallback(async () => {
    const [leads, messages] = await Promise.all([
      base44.entities.Lead.filter({ status: "contacté" }, "-updated_date", 200),
      base44.entities.Message.list("-created_date", 500),
    ]);

    const dismissed = getDismissed();
    const now = new Date();

    const newAlerts = leads
      .filter(lead => !dismissed.includes(lead.id))
      .map(lead => {
        // Find the latest message (inbound or outbound) for this lead
        const leadMsgs = messages
          .filter(m => m.lead_id === lead.id || m.phone === lead.phone)
          .sort((a, b) => new Date(b.timestamp || b.created_date) - new Date(a.timestamp || a.created_date));

        const lastMsg = leadMsgs[0];
        const lastActivity = lastMsg
          ? new Date(lastMsg.timestamp || lastMsg.created_date)
          : new Date(lead.updated_date || lead.created_date);

        const hoursSince = differenceInHours(now, lastActivity);

        // Only alert if no inbound reply since last outbound
        const lastOutbound = leadMsgs.find(m => m.direction === "outbound");
        const lastInbound = leadMsgs.find(m => m.direction === "inbound");
        const hasUnreplied = lastOutbound && (!lastInbound || new Date(lastInbound.timestamp || lastInbound.created_date) < new Date(lastOutbound.timestamp || lastOutbound.created_date));

        if (hoursSince >= THRESHOLD_HOURS && (hasUnreplied || leadMsgs.length === 0)) {
          return {
            id: lead.id,
            lead,
            hoursSince,
            lastActivity,
            type: leadMsgs.length === 0 ? "no_contact" : "no_reply",
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => b.hoursSince - a.hoursSince);

    setAlerts(newAlerts);
    setLoading(false);
  }, []);

  useEffect(() => {
    scan();
    // Re-scan every 5 minutes
    const interval = setInterval(scan, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [scan]);

  const dismiss = useCallback((leadId) => {
    const dismissed = getDismissed();
    if (!dismissed.includes(leadId)) {
      saveDismissed([...dismissed, leadId]);
    }
    setAlerts(prev => prev.filter(a => a.id !== leadId));
  }, []);

  const dismissAll = useCallback(() => {
    const ids = alerts.map(a => a.id);
    saveDismissed([...getDismissed(), ...ids]);
    setAlerts([]);
  }, [alerts]);

  return { alerts, loading, scan, dismiss, dismissAll };
}