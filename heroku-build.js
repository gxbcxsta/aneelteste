// Script para build do projeto para o Heroku
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar __dirname para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Iniciando build para Heroku...');

// Verificar se o diretório dist existe, se não, criar
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Build do frontend
try {
  console.log('Executando build do frontend...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build do frontend concluído com sucesso!');
} catch (error) {
  console.error('Erro ao fazer build do frontend:', error);
  process.exit(1);
}

// Criar um servidor Express simples para servir a aplicação em produção
const serverCode = `
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import fs from 'fs';
import { registerRoutes } from './server/routes.js';

// Configuração do __dirname no ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para ajustar URL do banco de dados no Heroku
function prepareDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    // Converter de postgres:// para postgresql:// se necessário
    if (process.env.DATABASE_URL.startsWith('postgres://')) {
      const newUrl = process.env.DATABASE_URL.replace(/^postgres:/, 'postgresql:');
      process.env.DATABASE_URL = newUrl;
      console.log('URL do banco de dados convertida de postgres:// para postgresql://');
    }
  }
}

// Configurar URL do banco de dados
prepareDatabaseUrl();

const app = express();

// Configuração do Express
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configurar logging simples
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api')) {
      const duration = Date.now() - start;
      console.log(\`\${req.method} \${req.path} \${res.statusCode} in \${duration}ms\`);
    }
  });
  next();
});

// Registrar rotas da API
async function startServer() {
  try {
    console.log('Registrando rotas da API...');
    const server = createServer(app);
    
    // Importar e registrar as rotas da API
    const routesModule = await import('./server/routes.js');
    await routesModule.registerRoutes(app);
    
    // Servir arquivos estáticos
    const staticDir = path.join(__dirname, 'dist/client');
    if (fs.existsSync(staticDir)) {
      app.use(express.static(staticDir));
      
      // Para qualquer outra rota, servir o index.html
      app.get('*', (req, res) => {
        res.sendFile(path.join(staticDir, 'index.html'));
      });
    } else {
      console.error(\`Diretório estático não encontrado: \${staticDir}\`);
    }
    
    // Iniciar o servidor
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(\`Servidor iniciado na porta \${PORT}\`);
    });
    
    return server;
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

// Iniciar o servidor
startServer();
`;

// Escrever o novo servidor para produção no arquivo dist/server.js
const serverFile = path.join(distDir, 'server.js');
fs.writeFileSync(serverFile, serverCode);

console.log('Servidor para produção criado com sucesso!');

// Modificar o Procfile para usar o novo servidor
const procfileContent = 'web: node dist/server.js';
const procfilePath = path.join(__dirname, 'Procfile');
fs.writeFileSync(procfilePath, procfileContent);

console.log('Procfile atualizado com sucesso!');
console.log('Build para Heroku concluído!');