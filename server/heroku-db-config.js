/**
 * Configuração de banco de dados específica para o Heroku
 * Este módulo ajusta a URL do banco de dados fornecida pelo Heroku
 * para ser compatível com os drivers PostgreSQL usados pela aplicação
 */

/**
 * Modifica a URL do banco de dados no formato Heroku para o formato compatível com o driver
 * Heroku fornece URLs no formato: 
 * postgres://username:password@host:port/database
 * 
 * Alguns drivers preferem o formato:
 * postgresql://username:password@host:port/database
 */
export function prepareDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.warn('DATABASE_URL não está definida. Verifique se o add-on PostgreSQL foi adicionado ao Heroku.');
    return false;
  }
  
  // Verifica se a URL já está no formato correto
  if (databaseUrl.startsWith('postgresql://')) {
    console.log('URL do banco de dados já está no formato correto.');
    return true;
  }
  
  // Converte postgres:// para postgresql://
  if (databaseUrl.startsWith('postgres://')) {
    const newDatabaseUrl = databaseUrl.replace(/^postgres:\/\//i, 'postgresql://');
    process.env.DATABASE_URL = newDatabaseUrl;
    
    console.log('URL do banco de dados convertida de postgres:// para postgresql://');
    return true;
  }
  
  console.warn('Formato de DATABASE_URL não reconhecido:', 
    databaseUrl.substring(0, 10) + '...');
  return false;
}

/**
 * Extrai informações da URL do banco de dados
 * @returns {Object} Informações do banco de dados (host, porta, nome do banco, usuário)
 */
export function getDatabaseInfo() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return {
      success: false,
      message: 'DATABASE_URL não definida'
    };
  }
  
  try {
    // Extrai informações da URL do banco
    const url = new URL(databaseUrl);
    
    return {
      success: true,
      host: url.hostname,
      port: url.port,
      database: url.pathname.substring(1), // Remove a / inicial
      user: url.username,
      ssl: databaseUrl.includes('sslmode=require') || databaseUrl.includes('ssl=true')
    };
  } catch (error) {
    return {
      success: false,
      message: `Erro ao analisar URL do banco: ${error.message}`
    };
  }
}

// Exportação padrão para uso em módulos ES
export default {
  prepareDatabaseUrl,
  getDatabaseInfo
};