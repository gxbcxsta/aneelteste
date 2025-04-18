// Script para compilar a aplicação para o Heroku
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar __dirname para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Iniciando build para Heroku...');

// Executar build do frontend
try {
  console.log('Compilando frontend...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Frontend compilado com sucesso!');
} catch (error) {
  console.error('Erro ao compilar frontend:', error);
  process.exit(1);
}

// Compilar server/routes.ts para server/routes.js
try {
  console.log('Compilando servidor...');
  execSync('esbuild server/routes.ts --platform=node --packages=external --bundle --format=esm --outfile=server/routes.js', { 
    stdio: 'inherit' 
  });
  console.log('Servidor compilado com sucesso!');
} catch (error) {
  console.error('Erro ao compilar servidor:', error);
  process.exit(1);
}

console.log('Build para Heroku concluído com sucesso!');