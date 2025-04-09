import pkg from 'pg';
const { Pool } = pkg;
import { cpfRestituicoes } from '@shared/schema';

// Inicializar o cliente PostgreSQL com o Driver padrão
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Função para consultar o valor de restituição de um CPF específico
export async function getValorRestituicaoByCpf(cpf: string): Promise<number | null> {
  try {
    const query = `
      SELECT valor_restituicao 
      FROM cpf_restituicoes 
      WHERE cpf = $1 
      LIMIT 1`;
    
    const result = await pool.query(query, [cpf]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return Number(result.rows[0].valor_restituicao);
  } catch (error) {
    console.error('Erro ao consultar o valor de restituição no banco de dados:', error);
    return null;
  }
}

// Função para salvar um novo valor de restituição
export async function salvarValorRestituicao(cpf: string, valor: number): Promise<boolean> {
  try {
    // Remover formatação e manter apenas números do CPF
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    const query = `
      INSERT INTO cpf_restituicoes (cpf, valor_restituicao, data_criacao)
      VALUES ($1, $2, $3)
      ON CONFLICT (cpf) 
      DO UPDATE SET data_criacao = $3
      RETURNING id`;
    
    const values = [
      cpfLimpo,
      valor.toString(),
      new Date().toISOString()
    ];
    
    const result = await pool.query(query, values);
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Erro ao salvar o valor de restituição no banco de dados:', error);
    return false;
  }
}