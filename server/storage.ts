import { 
  users, type User, type InsertUser,
  visitantes, type Visitante, type InsertVisitante,
  paginas_visitadas, type PaginaVisitada, type InsertPaginaVisitada
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "./db";

// Interface para as operações de rastreamento
export interface IStorage {
  // Usuários antigos
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Rastreamento de visitantes
  getVisitante(id: number): Promise<Visitante | undefined>;
  getVisitanteByCpf(cpf: string): Promise<Visitante | undefined>;
  createVisitante(visitante: InsertVisitante): Promise<Visitante>;
  updateVisitante(id: number, data: Partial<Visitante>): Promise<boolean>;
  getAllVisitantes(): Promise<Visitante[]>;
  
  // Páginas visitadas
  registrarPaginaVisitada(paginaVisitada: InsertPaginaVisitada): Promise<PaginaVisitada>;
  getPaginasVisitadasByVisitanteId(visitanteId: number): Promise<PaginaVisitada[]>;
  getTodasPaginasVisitadas(): Promise<PaginaVisitada[]>;
  getVisualizacoesPorPagina(): Promise<{ pagina: string; total: number }[]>;
}

export class DatabaseStorage implements IStorage {
  // Métodos para usuários
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }
  
  // Métodos para visitantes
  async getVisitante(id: number): Promise<Visitante | undefined> {
    const result = await db.select().from(visitantes).where(eq(visitantes.id, id));
    return result[0];
  }
  
  async getVisitanteByCpf(cpf: string): Promise<Visitante | undefined> {
    const cpfLimpo = cpf.replace(/\D/g, "");
    const result = await db.select().from(visitantes).where(eq(visitantes.cpf, cpfLimpo));
    return result[0];
  }
  
  async createVisitante(visitante: InsertVisitante): Promise<Visitante> {
    // Garantir que o CPF está sem formatação
    const visitanteLimpo = {
      ...visitante,
      cpf: visitante.cpf.replace(/\D/g, "")
    };
    
    const result = await db.insert(visitantes).values(visitanteLimpo).returning();
    return result[0];
  }
  
  async updateVisitante(id: number, data: Partial<Visitante>): Promise<boolean> {
    const result = await db.update(visitantes)
      .set({
        ...data,
        ultimo_acesso: new Date()
      })
      .where(eq(visitantes.id, id))
      .returning({ id: visitantes.id });
    
    return result.length > 0;
  }
  
  async getAllVisitantes(): Promise<Visitante[]> {
    return await db.select().from(visitantes).orderBy(desc(visitantes.ultimo_acesso));
  }
  
  // Métodos para páginas visitadas
  async registrarPaginaVisitada(paginaVisitada: InsertPaginaVisitada): Promise<PaginaVisitada> {
    const result = await db.insert(paginas_visitadas).values(paginaVisitada).returning();
    return result[0];
  }
  
  async getPaginasVisitadasByVisitanteId(visitanteId: number): Promise<PaginaVisitada[]> {
    return await db.select()
      .from(paginas_visitadas)
      .where(eq(paginas_visitadas.visitante_id, visitanteId))
      .orderBy(desc(paginas_visitadas.timestamp));
  }
  
  async getTodasPaginasVisitadas(): Promise<PaginaVisitada[]> {
    return await db.select().from(paginas_visitadas).orderBy(desc(paginas_visitadas.timestamp));
  }
  
  async getVisualizacoesPorPagina(): Promise<{ pagina: string; total: number }[]> {
    const result = await db.select({
      pagina: paginas_visitadas.pagina,
      total: sql<number>`count(*)`.as('total')
    })
    .from(paginas_visitadas)
    .groupBy(paginas_visitadas.pagina)
    .orderBy(desc(sql<number>`count(*)`));
    
    return result;
  }
}

// Usando o banco de dados para persistência ao invés da memória
export const storage = new DatabaseStorage();
