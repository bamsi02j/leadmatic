import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  // Webhook verification (GET)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const verifyToken = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN') || 'leadmatic_webhook_2024';

    if (mode === 'subscribe' && token === verifyToken) {
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // Incoming messages (POST)
  if (req.method === 'POST') {
    try {
      const base44 = createClientFromRequest(req);
      const body = await req.json();

      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value?.messages) return Response.json({ status: 'ok' });

      for (const msg of value.messages) {
        if (msg.type !== 'text') continue;

        const phone = msg.from;
        const text = msg.text?.body || '';
        const senderName = value.contacts?.[0]?.profile?.name || phone;

        // Find or create lead
        const existingLeads = await base44.asServiceRole.entities.Lead.filter({ phone });
        let lead = existingLeads[0];

        if (!lead) {
          lead = await base44.asServiceRole.entities.Lead.create({
            name: senderName,
            phone,
            status: 'nouveau',
            source: 'whatsapp',
          });
        }

        // Save inbound message
        await base44.asServiceRole.entities.Message.create({
          lead_id: lead.id,
          sender_name: senderName,
          content: text,
          phone,
          direction: 'inbound',
          status: 'unread',
          timestamp: new Date().toISOString(),
        });
      }

      return Response.json({ status: 'ok' });
    } catch (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
});