// Usando CommonJS para compatibilidade com Heroku
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Importar configuração do banco de dados Heroku se estiver disponível
let dbConfig;
try {
  dbConfig = require('./server/heroku-db-config');
  if (dbConfig && typeof dbConfig.prepareDatabaseUrl === 'function') {
    dbConfig.prepareDatabaseUrl();
  }
} catch (err) {
  console.warn('Aviso: Não foi possível carregar a configuração do banco de dados Heroku:', err.message);
}

// Caminho para o binário do node
const NODE_BIN = process.execPath;

// Verifica se é ambiente de produção
const isProduction = process.env.NODE_ENV === 'production';

// Define a porta que será usada pelo servidor
const PORT = process.env.PORT || 5000;

console.log('Iniciando servidor em modo:', isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');

// Verifica se o build existe
if (!fs.existsSync(path.join(__dirname, 'dist', 'index.js'))) {
  console.log('Executando build da aplicação...');
  
  const buildProcess = spawn('npm', ['run', 'build'], { 
    stdio: 'inherit',
    shell: true
  });
  
  buildProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Build falhou com código: ${code}`);
      process.exit(1);
    }
    
    console.log('Build concluído com sucesso. Iniciando servidor...');
    startServer();
  });
} else {
  console.log('Build já existe. Iniciando servidor...');
  startServer();
}

function startServer() {
  // Define as variáveis de ambiente para o servidor
  process.env.PORT = PORT;
  
  // Inicia o servidor usando o arquivo compilado
  const server = spawn(NODE_BIN, ['./dist/index.js'], { 
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });
  
  server.on('close', (code) => {
    console.log(`Servidor encerrado com código: ${code}`);
    process.exit(code);
  });
  
  // Repassa sinais para o processo filho
  ['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, () => {
      if (!server.killed) {
        server.kill(signal);
      }
    });
  });
}