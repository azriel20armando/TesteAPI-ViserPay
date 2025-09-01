import { defineConfig } from 'drizzle-kit'; // Importa função para definir configuração do Drizzle Kit

export default defineConfig({
  schema: './src/schema.ts', // Caminho para o arquivo de schema (onde está a definição da tabela purchases)
  out: './drizzle', // Diretório onde as migrações SQL serão geradas
  driver: 'pg', // Driver do banco de dados (PostgreSQL)
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!, // URL de conexão com o banco, puxada do .env
  },
  verbose: true, // Ativa logs detalhados durante migrações
  strict: true, // Garante que migrações sejam aplicadas estritamente conforme schema
});