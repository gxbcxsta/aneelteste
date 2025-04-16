import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { cpfRestituicoes, CpfRestituicao, InsertCpfRestituicao } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Criar o cliente PostgreSQL padrão
const client = postgres(process.env.DATABASE_URL!, { max: 1 });

// Criar a instância Drizzle
export const db = drizzle(client);

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
    
    // Se já existe um valor para este CPF, não alteramos o banco e retornamos sucesso
    if (valorExistente !== null) {
      console.log(`Valor já existe para CPF ${cpfLimpo}, mantendo valor existente: ${valorExistente}`);
      return true;
    }
    
    // Se não existir um valor anterior, geramos um valor aleatório entre 1800 e 3600
    if (valorExistente === null) {
      // Valor mínimo: 1800,00 (180000 centavos)
      // Valor máximo: 3600,00 (360000 centavos)
      const valorMinimo = 1800;
      const valorMaximo = 3600;
      
      // Gerar valor aleatório entre valorMinimo e valorMaximo (com 2 casas decimais)
      const valorAleatorio = valorMinimo + Math.random() * (valorMaximo - valorMinimo);
      const valorArredondado = Math.round(valorAleatorio * 100) / 100;
      
      valor = valorArredondado;
      console.log(`Valor aleatório gerado para CPF ${cpfLimpo}: ${valor}`);
    }
    
    const novaRestituicao: InsertCpfRestituicao = {
      cpf: cpfLimpo,
      valor_restituicao: valor.toString(),
      data_criacao: new Date().toISOString()
    };
    
    // Inserir o novo valor para o CPF
    await db.insert(cpfRestituicoes)
      .values(novaRestituicao)
      .onConflictDoUpdate({
        target: cpfRestituicoes.cpf,
        set: { 
          // Nunca atualizamos o valor, apenas a data_criacao
          data_criacao: novaRestituicao.data_criacao 
        }
      });
    
    console.log(`Valor ${valor} salvo para CPF ${cpfLimpo}`);
    return true;
  } catch (error) {
    console.error('Erro ao salvar o valor de restituição no banco de dados:', error);
    return false;
  }
}