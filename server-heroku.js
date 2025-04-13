// Arquivo server para o Heroku (CommonJS)
const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const axios = require('axios');

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

// Parser para JSON e URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota para consulta de CPF
app.get("/api/consulta-cpf", async (req, res) => {
  try {
    const cpf = req.query.cpf;
    if (!cpf) {
      return res.status(400).json({ error: "CPF não fornecido" });
    }

    // Usar o token diretamente em vez da variável de ambiente
    const token = "268753a9b3a24819ae0f02159dee6724";
    const url = `https://api.exato.digital/receita-federal/cpf?token=${token}&cpf=${cpf}&format=json`;
    
    const response = await axios.get(url);
    const data = response.data;
    
    return res.json(data);
  } catch (error) {
    console.error("Erro ao consultar CPF:", error);
    return res.status(500).json({ error: "Erro ao consultar CPF" });
  }
});

// Rota padrão para o SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public', 'index.html'));
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});