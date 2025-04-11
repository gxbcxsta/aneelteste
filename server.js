import { exec } from 'child_process';
import fs from 'fs';

// Verificar se o build já foi feito
if (!fs.existsSync('./dist/index.js')) {
  console.log('Executando build...');
  exec('npm run build', (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro no build: ${error}`);
      return;
    }
    startServer();
  });
} else {
  startServer();
}

function startServer() {
  // Importar e iniciar o servidor
  import('./dist/index.js').catch(err => {
    console.error('Erro ao iniciar o servidor:', err);
  });
}