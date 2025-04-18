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

// Executar comando para enviar o schema para o banco de dados
console.log('Aplicando migrações ao banco de dados...');

const migrateProcess = spawn('npm', ['run', 'db:push'], { 
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

migrateProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`Erro durante a migração do banco de dados (código: ${code})`);
    process.exit(code);
  }
  
  console.log('Banco de dados migrado com sucesso!');
  console.log('Configuração do banco de dados concluída.');
});