import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { access_token, phone_number_id } = await req.json();
    if (!access_token || !phone_number_id) {
      return Response.json({ success: false, message: 'Token et Phone Number ID requis.' }, { status: 400 });
    }

    // Test by fetching phone number info from Meta API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phone_number_id}?fields=display_phone_number,verified_name,quality_rating`,
      {
        headers: { 'Authorization': `Bearer ${access_token}` },
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      return Response.json({
        success: false,
        message: `Erreur API : ${data.error?.message || 'Token ou Phone Number ID invalide'}`,
      });
    }

    return Response.json({
      success: true,
      message: `Connexion réussie ! Numéro : ${data.display_phone_number} (${data.verified_name})`,
      phone_number: data.display_phone_number,
      verified_name: data.verified_name,
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
});