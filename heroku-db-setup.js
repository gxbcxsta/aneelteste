// Script para configuração do banco de dados no Heroku
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

// Importar configuração do banco de dados Heroku
let prepareDatabaseUrl;
try {
  const { default: dbConfig } = await import('./server/heroku-db-config.js');
  prepareDatabaseUrl = dbConfig.prepareDatabaseUrl;
} catch (err) {
  console.error('Erro ao importar configuração do banco de dados:', err);
  process.exit(1);
}

// Configurar __dirname para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Iniciando configuração do banco de dados para Heroku...');

// Ajustar URL do banco de dados para compatibilidade com Neon/Drizzle
prepareDatabaseUrl();

// Verificar se a variável de ambiente DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  console.error('Erro: DATABASE_URL não está definido no ambiente Heroku.');
  console.error('Certifique-se de adicionar o add-on PostgreSQL ao seu app Heroku.');
  process.exit(1);
}

console.log('URL do banco de dados configurada corretamente.');

// Vamos fazer a migração diretamente via código em vez de usar drizzle-kit push
console.log('Aplicando migrações ao banco de dados via script direto...');

import pg from 'pg';
const { Pool } = pg;

async function applyMigration() {
  try {
    // Conectar ao banco de dados com suporte a SSL
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Necessário para o SSL do Heroku
      }
    });

    // Criar as tabelas definidas no schema
    await pool.query(`
      -- Tabela de usuários
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );

      -- Tabela para armazenar valores de restituição por CPF
      CREATE TABLE IF NOT EXISTS cpf_restituicoes (
        id SERIAL PRIMARY KEY,
        cpf VARCHAR(11) NOT NULL UNIQUE,
        valor_restituicao NUMERIC(10, 2) NOT NULL,
        data_criacao TEXT NOT NULL
      );

      -- Tabela para rastreamento de usuários
      CREATE TABLE IF NOT EXISTS visitantes (
        id SERIAL PRIMARY KEY,
        cpf VARCHAR(11) NOT NULL UNIQUE,
        nome TEXT,
        telefone VARCHAR(15),
        primeiro_acesso TIMESTAMP DEFAULT NOW() NOT NULL,
        ultimo_acesso TIMESTAMP DEFAULT NOW() NOT NULL,
        ip TEXT,
        navegador TEXT,
        sistema_operacional TEXT
      );

      -- Tabela para rastreamento de páginas visitadas
      CREATE TABLE IF NOT EXISTS paginas_visitadas (
        id SERIAL PRIMARY KEY,
        visitante_id INTEGER NOT NULL,
        url TEXT NOT NULL,
        pagina TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
        tempo_permanencia INTEGER,
        referrer TEXT,
        dispositivo TEXT
      );

      -- Tabela para armazenar códigos OTP para verificação de telefone
      CREATE TABLE IF NOT EXISTS otp_codigos (
        id SERIAL PRIMARY KEY,
        telefone VARCHAR(15) NOT NULL,
        codigo VARCHAR(6) NOT NULL,
        criado_em TIMESTAMP DEFAULT NOW() NOT NULL,
        expira_em TIMESTAMP NOT NULL,
        usado BOOLEAN DEFAULT FALSE NOT NULL,
        cpf VARCHAR(11) NOT NULL
      );
    `);

    console.log('Tabelas criadas ou já existentes no banco de dados!');
    
    // Fechar a conexão com o pool
    await pool.end();
    
    console.log('Banco de dados migrado com sucesso!');
    console.log('Configuração do banco de dados concluída.');
  } catch (error) {
    console.error('Erro durante a migração do banco de dados:', error);
    process.exit(1);
  }
}

applyMigration();