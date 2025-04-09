import { pgTable, text, serial, integer, boolean, numeric, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Tabela para armazenar valores de restituição por CPF
export const cpfRestituicoes = pgTable("cpf_restituicoes", {
  id: serial("id").primaryKey(),
  cpf: varchar("cpf", { length: 11 }).notNull().unique(),
  valor_restituicao: numeric("valor_restituicao", { precision: 10, scale: 2 }).notNull(),
  data_criacao: text("data_criacao").notNull(), // Armazenado como ISO string
});

export const insertCpfRestituicaoSchema = createInsertSchema(cpfRestituicoes).pick({
  cpf: true,
  valor_restituicao: true,
  data_criacao: true,
});

export type InsertCpfRestituicao = z.infer<typeof insertCpfRestituicaoSchema>;
export type CpfRestituicao = typeof cpfRestituicoes.$inferSelect;
