import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const THRESHOLD_HOURS = 48;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both authenticated calls and scheduled automation (service role)
    const now = new Date();
    const cutoff = new Date(now.getTime() - THRESHOLD_HOURS * 60 * 60 * 1000);

    // Get all "contacté" leads
    const leads = await base44.asServiceRole.entities.Lead.filter(
      { status: "contacté" },
      "-updated_date",
      500
    );

    // Get recent messages to check last activity
    const messages = await base44.asServiceRole.entities.Message.list("-created_date", 1000);

    const staleLeads = [];

    for (const lead of leads) {
      const leadMsgs = messages
        .filter(m => m.lead_id === lead.id || m.phone === lead.phone)
        .sort((a, b) => new Date(b.timestamp || b.created_date) - new Date(a.timestamp || a.created_date));

      const lastOutbound = leadMsgs.find(m => m.direction === "outbound");
      const lastInbound = leadMsgs.find(m => m.direction === "inbound");

      // Check: has outbound but no inbound reply after it
      const hasUnreplied = lastOutbound && (
        !lastInbound ||
        new Date(lastInbound.timestamp || lastInbound.created_date) <
        new Date(lastOutbound.timestamp || lastOutbound.created_date)
      );

      // No messages at all — never contacted despite status
      const noMessages = leadMsgs.length === 0;

      if (!hasUnreplied && !noMessages) continue;

      const lastActivity = lastOutbound
        ? new Date(lastOutbound.timestamp || lastOutbound.created_date)
        : new Date(lead.updated_date || lead.created_date);

      if (lastActivity <= cutoff) {
        const hoursLate = Math.floor((now - lastActivity) / (1000 * 60 * 60));
        staleLeads.push({
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          hoursLate,
          lastActivity: lastActivity.toISOString(),
          reason: noMessages ? "no_contact" : "no_reply",
        });
      }
    }

    staleLeads.sort((a, b) => b.hoursLate - a.hoursLate);

    return Response.json({
      scanned: leads.length,
      stale: staleLeads.length,
      leads: staleLeads,
      scannedAt: now.toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});