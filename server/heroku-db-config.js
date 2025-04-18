/**
 * Este módulo configura a conexão com o banco de dados no ambiente Heroku.
 * Ele gerencia a transformação da URL do banco conforme necessário.
 */

// Função para garantir que a URL do banco de dados esteja no formato correto para o Neon
function prepareDatabaseUrl() {
  let dbUrl = process.env.DATABASE_URL;
  
  // Se não tiver DATABASE_URL, não faz nada
  if (!dbUrl) {
    console.warn('Aviso: DATABASE_URL não está definido no ambiente');
    return;
  }
  
  // Detecta se estamos no Heroku (DATABASE_URL começa com postgres://)
  if (dbUrl.startsWith('postgres://')) {
    // Heroku usa postgres://, mas o Neon precisa de postgresql://
    console.log('Heroku PostgreSQL URL detectada, convertendo para formato Neon...');
    
    // Substituir o prefixo
    const newDbUrl = dbUrl.replace(/^postgres:\/\//, 'postgresql://');
    
    // Atualizar a variável de ambiente
    process.env.DATABASE_URL = newDbUrl;
    
    console.log('URL do banco de dados atualizada para compatibilidade com Neon');
  }
}

// Exportar a função para ser usada no arquivo principal (formato ESM)
export default {
  prepareDatabaseUrl
};