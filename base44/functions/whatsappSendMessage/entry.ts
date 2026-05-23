import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to, message, lead_id } = await req.json();
    if (!to || !message) return Response.json({ error: 'Missing to or message' }, { status: 400 });

    // Get user's WhatsApp config from Company entity
    const companies = await base44.entities.Company.filter({ user_id: user.id });
    const company = companies[0];
    if (!company?.whatsapp_access_token || !company?.whatsapp_phone_number_id) {
      return Response.json({ error: 'WhatsApp API non configurée. Allez dans Paramètres → Entreprise.' }, { status: 400 });
    }

    const phoneNumberId = company.whatsapp_phone_number_id;
    const accessToken = company.whatsapp_access_token;

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to.replace(/\D/g, ''),
          type: 'text',
          text: { preview_url: false, body: message },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data.error?.message || 'Erreur Meta API', details: data }, { status: 400 });
    }

    // Save outbound message to DB
    await base44.entities.Message.create({
      lead_id: lead_id || null,
      sender_name: company.name || 'Moi',
      content: message,
      phone: to,
      direction: 'outbound',
      status: 'read',
    });

    return Response.json({ success: true, message_id: data.messages?.[0]?.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});