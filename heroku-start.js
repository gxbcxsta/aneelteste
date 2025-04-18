// Script de inicialização específico para Heroku
import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import session from 'express-session';
import memoryStoreFactory from 'memorystore';

// Importar configuração do banco de dados Heroku
try {
  const { default: dbConfig } = await import('./server/heroku-db-config.js');
  if (dbConfig && typeof dbConfig.prepareDatabaseUrl === 'function') {
    console.log('Configurando URL do banco de dados para o Heroku...');
    dbConfig.prepareDatabaseUrl();
  }
} catch (err) {
  console.warn('Aviso: Não foi possível configurar o banco de dados Heroku:', err);
}

// Configurações
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

console.log('Iniciando servidor em modo:', isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');
console.log('Diretório base:', __dirname);

// Configurar middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar sessão
const MemoryStore = memoryStoreFactory(session);
app.use(session({
  secret: process.env.SESSION_SECRET || 'sessao-secreta-aneel-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: isProduction,
    maxAge: 86400000 // 24 horas
  },
  store: new MemoryStore({
    checkPeriod: 86400000 // Limpar sessões expiradas a cada 24 horas
  })
}));

// Servir arquivos estáticos compilados
app.use(express.static(path.join(__dirname, 'dist', 'public')));

// Importar e registrar rotas da API
try {
  const { registerRoutes } = await import('./dist/index.js');
  await registerRoutes(app);
  console.log('Rotas da API registradas com sucesso');
} catch (error) {
  console.error('Erro ao registrar rotas da API:', error);
  process.exit(1);
}

// Rota catchall para fornecer o app SPA (Single Page Application)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});