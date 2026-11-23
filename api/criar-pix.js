export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { conviteId, valor } = req.body;
  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

  if (!MP_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Token do Mercado Pago não configurado' });
  }

  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': String(conviteId)
      },
      body: JSON.stringify({
        transaction_amount: Number(valor || 0.10),
        description: `Convite Digital #${conviteId}`,
        payment_method_id: 'pix',
        external_reference: String(conviteId),
        notification_url: `https://${req.headers.host}/api/webhook`,
        payer: {
          email: 'cliente@convitedigital.com.br'
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({ error: data.message || 'Erro ao gerar Pix', detalhes: data });
    }

    const pixInfo = data.point_of_interaction?.transaction_data;
    return res.status(200).json({
      payment_id: data.id,
      qr_code: pixInfo?.qr_code,
      qr_code_base64: pixInfo?.qr_code_base64
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
