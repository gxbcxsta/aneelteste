// Arquivo server para o Heroku (CommonJS)
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Iniciar o Express
const app = express();
const PORT = process.env.PORT || 5000;

// Converter URL do PostgreSQL do Heroku se necessário
let dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.startsWith('postgres://')) {
  const newDbUrl = dbUrl.replace(/^postgres:\/\//, 'postgresql://');
  process.env.DATABASE_URL = newDbUrl;
  console.log('URL do banco de dados atualizada para compatibilidade');
}

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'dist/public')));

// Configurar cabeçalhos de segurança
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Rota padrão para o SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public', 'index.html'));
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});