export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('OK');
  }

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  const SUPABASE_URL = 'https://euetntwsvqsvrlmfmtqz.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_Tq-8AewCx0Ny886MgtnRbQ_sHIEWbbW';

  const body = req.body || {};
  const paymentId = body.data?.id || req.query['data.id'] || req.query.id;
  const type = body.type || req.query.topic;

  if (type === 'payment' && paymentId) {
    try {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
      });
      const payment = await mpRes.json();

      if (payment.status === 'approved' && payment.external_reference) {
        const conviteId = payment.external_reference;

        await fetch(`${SUPABASE_URL}/rest/v1/Convites?id=eq.${conviteId}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ Pago: true, status: 'pago' })
        });
      }
    } catch (err) {
      console.error('Erro no webhook:', err);
    }
  }

  return res.status(200).json({ received: true });
}
