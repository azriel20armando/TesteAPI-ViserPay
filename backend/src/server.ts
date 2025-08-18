import fastify from 'fastify'; // Importa Fastify framework
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'; // Provider para tipagem com TypeBox
import cors from '@fastify/cors'; // Plugin CORS
import formbody from '@fastify/formbody'; // Plugin para parsear form bodies
import { z } from 'zod'; // Biblioteca para schemas de validação
import fetch from 'node-fetch'; // Polyfill para fetch em Node
import { db } from './db'; // Importa instância DB
import { purchases } from './schema'; // Importa tabela purchases
import { eq } from 'drizzle-orm'; // Função para queries de igualdade
import 'dotenv/config'; // Carrega .env

const app = fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>(); // Cria app Fastify com logger e tipagem

app.register(cors, { origin: '*' }); // Registra CORS permitindo qualquer origem
app.register(formbody); // Registra parser de form bodies

const ViserPaySchema = z.object({ // Schema Zod para validar body de pagamento
  customer_name: z.string(), // Nome string
  customer_email: z.string().email(), // Email válido
  customer_phone: z.string().optional(), // Telefone opcional
  amount: z.number().positive(), // Valor positivo
  details: z.string(), // Detalhes string
  currency: z.string().default('AOA'), // Moeda default 'AOA'
  identifier: z.string(), // Identificador
  ipn_url: z.string(), // URL IPN
  success_url: z.string(), // URL sucesso
  cancel_url: z.string(), // URL cancel
  site_logo: z.string().optional(), // Logo opcional
  checkout_theme: z.string().optional(), // Tema opcional
  products: z.array(z.object({ // Array de produtos
    name: z.string(), // Nome produto
    price: z.number(), // Preço
    quantity: z.number(), // Quantidade
  })),
});

// Endpoint POST para iniciar pagamento
app.post('/api/initiate-payment', async (request, reply) => {
  const body = ViserPaySchema.parse(request.body); // Valida e parseia body

  // Insere compra como 'pending' no DB e retorna o registro
  const [newPurchase] = await db.insert(purchases).values({
    customerName: body.customer_name,
    customerEmail: body.customer_email,
    customerPhone: body.customer_phone,
    amount: body.amount.toString(), // Converte amount para string (decimal no DB)
    currency: body.currency,
    products: body.products, // Armazena produtos como JSON
    identifier: body.identifier,
    status: 'pending',
  }).returning();

  // Chama API ViserPay para iniciar pagamento
  const viserPayResponse = await fetch('https://script.viserlab.com/viserpay/payment/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      public_key: process.env.VISERPAY_PUBLIC_KEY, // Usa chave pública de .env
      amount: body.amount,
      currency: body.currency,
      customer_email: body.customer_email,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      details: body.details,
      identifier: body.identifier,
      ipn_url: body.ipn_url,
      success_url: body.success_url,
      cancel_url: body.cancel_url,
      site_logo: body.site_logo,
      checkout_theme: body.checkout_theme,
    }),
  });

  const data = await viserPayResponse.json() as { success: string; url?: string; message?: string }; // Parseia resposta JSON

  if (data.success === 'ok') { // Se sucesso, retorna URL de redirecionamento
    return { success: 'ok', url: data.url };
  } else { // Se erro, atualiza status para 'failed' e retorna erro
    await db.update(purchases).set({ status: 'failed' }).where(eq(purchases.id, newPurchase.id));
    return reply.status(400).send({ message: data.message || 'Erro ao iniciar pagamento' });
  }
});

// Endpoint POST para IPN (notificação)
app.post('/api/ipn', async (request, reply) => {
  const body = request.body as any; // Body como any (valide se necessário)

  // TODO: Implemente verificação real de assinatura com SECRET_KEY conforme doc ViserPay
  const signature = body.signature; // Extrai assinatura do body
  const expectedSignature = 'lógica_para_gerar_signature_com_SECRET_KEY'; // Placeholder para lógica de hash
  if (signature !== expectedSignature) { // Verifica assinatura
    return reply.status(400).send('Assinatura inválida');
  }

  // Atualiza status da compra baseado na notificação
  await db.update(purchases)
    .set({ status: body.status === 'success' ? 'success' : 'failed', updatedAt: new Date() })
    .where(eq(purchases.identifier, body.identifier));

  return { status: 'ok' }; // Responde OK para IPN
});

// Inicia servidor na porta 3000
app.listen({ port: 3000 }, (err) => {
  if (err) throw err; // Lança erro se falhar
  console.log('Servidor rodando em http://localhost:3000'); // Loga sucesso
});