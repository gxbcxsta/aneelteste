import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { cpfRestituicoes, CpfRestituicao, InsertCpfRestituicao } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Inicializar o cliente PostgreSQL com o Driver padrão do Neon
const sql = neon(process.env.DATABASE_URL!);
// Tratar o SQL como cliente para o Drizzle
// @ts-ignore - Resolvendo problema de tipagem do Drizzle com Neon
export const db = drizzle(sql);

// Função para consultar o valor de restituição de um CPF específico
export async function getValorRestituicaoByCpf(cpf: string): Promise<number | null> {
  try {
    const resultado = await db.select({
      valor_restituicao: cpfRestituicoes.valor_restituicao
    })
    .from(cpfRestituicoes)
    .where(eq(cpfRestituicoes.cpf, cpf))
    .limit(1);
    
    if (resultado.length === 0) {
      return null;
    }
    
    return Number(resultado[0].valor_restituicao);
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
    
    const novaRestituicao: InsertCpfRestituicao = {
      cpf: cpfLimpo,
      valor_restituicao: valor.toString(),
      data_criacao: new Date().toISOString()
    };
    
    await db.insert(cpfRestituicoes)
      .values(novaRestituicao)
      .onConflictDoUpdate({
        target: cpfRestituicoes.cpf,
        set: { 
          // Se houver conflito, não atualizamos o valor
          // Apenas atualizamos a data de criação
          data_criacao: novaRestituicao.data_criacao 
        }
      });
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar o valor de restituição no banco de dados:', error);
    return false;
  }
}