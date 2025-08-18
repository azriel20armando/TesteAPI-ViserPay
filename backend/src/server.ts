import fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { createHmac } from 'crypto';
import { config } from 'dotenv';

config();

interface PaymentRequestBody {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  amount: number;
  details: string;
  currency: string;
  identifier: string;
  ipn_url: string;
  success_url: string;
  cancel_url: string;
  site_logo: string;
  checkout_theme: string;
}

interface IpnRequestBody {
  status: string;
  signature: string;
  identifier: string;
  data: { amount: number };
}

const app = fastify({ logger: true });
const prisma = new PrismaClient();

// Registrar o plugin CORS para permitir chamadas do frontend
app.register(cors, {
  origin: ['http://localhost:3000', 'http://frontend:3000'], // Frontend local e Docker
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

app.post<{ Body: PaymentRequestBody }>('/api/initiate-payment', async (request, reply) => {
  const {
    customer_name,
    customer_email,
    customer_phone,
    amount,
    details,
    currency,
    identifier,
    ipn_url,
    success_url,
    cancel_url,
    site_logo,
    checkout_theme,
  } = request.body;

  const publicKey = process.env.VISERPAY_PUBLIC_KEY;
  if (!publicKey) {
    return reply.code(500).send({ error: 'Chave pública não configurada' });
  }

  const env = process.env.VISERPAY_ENV === 'production' ? '' : '/sandbox';
  const url = `https://script.viserlab.com/viserpay${env}/payment/initiate`;

  const paymentData = {
    public_key: publicKey,
    identifier,
    currency,
    amount,
    details,
    ipn_url,
    success_url,
    cancel_url,
    site_logo,
    checkout_theme,
    customer_name,
    customer_email,
    customer_phone,
  };

  try {
    // Registrar pagamento pendente no banco
    await prisma.payment.create({
      data: {
        identifier,
        amount,
        currency,
        status: 'PENDING',
        customerEmail: customer_email,
      },
    });

    // Chamar API do ViserPay usando fetch
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.statusText}`);
    }

    const data = await response.json();
    return reply.send(data);
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: (err as Error).message });
  }
});

app.post<{ Body: IpnRequestBody }>('/api/ipn', async (request, reply) => {
  const { status, signature, identifier, data } = request.body;

  const secretKey = process.env.VISERPAY_SECRET_KEY;
  if (!secretKey) {
    return reply.code(500).send({ error: 'Chave secreta não configurada' });
  }

  const customKey = `${data.amount}${identifier}`;
  const mySignature = createHmac('sha256', secretKey)
    .update(customKey)
    .digest('hex')
    .toUpperCase();

  if (status === 'success' && signature === mySignature && identifier === request.body.identifier) {
    // Atualizar status no banco
    await prisma.payment.update({
      where: { identifier },
      data: { status: 'SUCCESS' },
    });

    request.log.info('Pagamento validado com sucesso');
    return reply.code(200).send('IPN recebido');
  } else {
    request.log.warn('Validação de pagamento falhou');
    return reply.code(400).send('IPN inválido');
  }
});

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 3001, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();