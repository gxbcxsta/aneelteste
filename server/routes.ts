import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from "node-fetch";

export async function registerRoutes(app: Express): Promise<Server> {
  // API route for potential simulation endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ANEEL ICMS Restituição API' });
  });

  // Rota para consulta de CPF via API Exato Digital
  app.get("/api/consulta-cpf", async (req: Request, res: Response) => {
    try {
      const { cpf } = req.query;
      
      if (!cpf || typeof cpf !== "string") {
        return res.status(400).json({ error: "CPF inválido ou não fornecido" });
      }
      
      // Remover caracteres não numéricos do CPF
      const cpfLimpo = cpf.replace(/\D/g, "");
      
      if (cpfLimpo.length !== 11) {
        return res.status(400).json({ error: "CPF deve conter 11 dígitos" });
      }
      
      // Token da API Exato Digital
      const apiToken = process.env.EXATO_API_TOKEN;
      
      if (!apiToken) {
        return res.status(500).json({ error: "Token de API não configurado" });
      }
      
      // Consultar a API Exato Digital
      const response = await fetch(`https://api.exato.digital/v1/pessoal/cpf/${cpfLimpo}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro na API Exato Digital:", errorData);
        return res.status(response.status).json({ 
          error: "Erro ao consultar CPF na base de dados", 
          details: errorData 
        });
      }
      
      const data = await response.json();
      res.json(data);
      
    } catch (error) {
      console.error("Erro ao processar consulta de CPF:", error);
      res.status(500).json({ error: "Erro interno no servidor" });
    }
  });
  
  const httpServer = createServer(app);

  return httpServer;
}
