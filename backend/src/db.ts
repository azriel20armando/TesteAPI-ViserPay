import { drizzle } from 'drizzle-orm/postgres-js'; // Importa função para criar instância Drizzle
import { migrate } from 'drizzle-orm/postgres-js/migrator'; // Importa migrador para aplicar schemas
import postgres from 'postgres'; // Driver PostgreSQL puro
import * as schema from './schema'; // Importa schemas definidos
import 'dotenv/config'; // Carrega variáveis de .env

const connectionString = process.env.DATABASE_URL!; // Obtém URL do banco de .env (não nulo)
const sql = postgres(connectionString, { max: 1 }); // Cria conexão PostgreSQL com max 1 conexão
export const db = drizzle(sql, { schema }); // Cria instância Drizzle com schema

// Função para rodar migrações
async function runMigrations() {
  await migrate(db, { migrationsFolder: './drizzle' }); // Aplica migrações do diretório './drizzle'
}
runMigrations().catch(console.error); // Executa migrações e loga erros