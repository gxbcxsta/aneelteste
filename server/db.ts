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
    
    // Verificar se já existe um valor para este CPF
    const valorExistente = await getValorRestituicaoByCpf(cpfLimpo);
    
    // Se já existe um valor para este CPF e o valor a ser inserido é 0,
    // não alteramos o banco e retornamos sucesso
    if (valorExistente !== null && valor === 0) {
      console.log(`Valor já existe para CPF ${cpfLimpo}, mantendo valor existente: ${valorExistente}`);
      return true;
    }
    
    // Se o valor for 0 e não existir um valor anterior, calculamos um valor determinístico
    if (valor === 0) {
      console.log(`Calculando valor determinístico para CPF ${cpfLimpo}`);
      const valorBase = 1800 + (parseInt(cpfLimpo.substring(0, 3)) % 1200);
      const centavos = parseInt(cpfLimpo.substring(9, 11));
      valor = valorBase + (centavos / 100);
      console.log(`Valor determinístico calculado: ${valor}`);
    }
    
    const novaRestituicao: InsertCpfRestituicao = {
      cpf: cpfLimpo,
      valor_restituicao: valor.toString(),
      data_criacao: new Date().toISOString()
    };
    
    // Se não existir valor anterior ou o valor a ser inserido for diferente de 0,
    // inserimos um novo ou atualizamos o existente
    await db.insert(cpfRestituicoes)
      .values(novaRestituicao)
      .onConflictDoUpdate({
        target: cpfRestituicoes.cpf,
        set: { 
          // Atualizamos o valor e a data_criacao
          valor_restituicao: novaRestituicao.valor_restituicao,
          data_criacao: novaRestituicao.data_criacao 
        }
      });
    
    console.log(`Valor ${valor} salvo/atualizado para CPF ${cpfLimpo}`);
    return true;
  } catch (error) {
    console.error('Erro ao salvar o valor de restituição no banco de dados:', error);
    return false;
  }
}