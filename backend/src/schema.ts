import { pgTable, serial, text, decimal, timestamp, jsonb, varchar } from 'drizzle-orm/pg-core'; // Importa tipos do Drizzle para PostgreSQL

export const purchases = pgTable('purchases', { // Define tabela 'purchases'
  id: serial('id').primaryKey(), // ID auto-incremento como chave primária
  customerName: text('customer_name').notNull(), // Nome do cliente, texto não nulo
  customerEmail: text('customer_email').notNull(), // Email do cliente, texto não nulo
  customerPhone: text('customer_phone'), // Telefone do cliente, texto opcional
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(), // Valor decimal com precisão 10/2, não nulo
  currency: varchar('currency', { length: 3 }).notNull().default('AOA'), // Moeda como varchar de 3 chars, default 'AOA'
  products: jsonb('products').notNull(), // Produtos como JSONB (array de objetos), não nulo
  status: varchar('status', { length: 20 }).notNull().default('pending'), // Status como varchar, default 'pending'
  identifier: text('identifier').notNull().unique(), // Identificador único, texto não nulo0
  createdAt: timestamp('created_at').defaultNow().notNull(), // Data de criação, default now()
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // Data de atualização, default now()
});