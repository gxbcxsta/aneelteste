import { db } from './db';
import { otp_codigos, InsertOtpCodigo } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

// Configuração da API de SMS
const SMS_API_TOKEN = '01eb31cf-8692-4869-9843-860260706c27'; // Token da API Integraflux
const SMS_API_URL = `https://sms.aresfun.com/v1/integration/${SMS_API_TOKEN}/send-sms`;
const SMS_SENDER = 'ANEEL'; // Remetente configurado como ANEEL

/**
 * Serviço de SMS para envio de códigos de verificação OTP
 */
export class SmsService {
  /**
   * Gera um código OTP aleatório de 6 dígitos
   * @returns Código OTP de 6 dígitos
   */
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Formata número de telefone para o padrão da API (55 + DDD + número)
   * @param phone Número de telefone (com ou sem formatação)
   * @returns Número formatado para a API
   */
  private formatPhoneNumber(phone: string): string {
    // Remove todos os caracteres não numéricos
    const cleanNumber = phone.replace(/\D/g, '');
    
    // Verifica se o número já começa com 55 (código do Brasil)
    if (cleanNumber.startsWith('55')) {
      return cleanNumber;
    }
    
    // Adiciona o código do Brasil (55)
    return `55${cleanNumber}`;
  }

  /**
   * Envia um código OTP por SMS
   * @param phoneNumber Número de telefone do destinatário
   * @param cpf CPF do usuário
   * @returns O código OTP gerado e enviado
   */
  async sendOtpCode(phoneNumber: string, cpf: string): Promise<{ success: boolean; code?: string; message?: string }> {
    try {
      // Gerar o código OTP
      const otpCode = this.generateOtpCode();
      console.log(`Gerando código OTP: ${otpCode} para o telefone ${phoneNumber}`);
      
      // Formatar o número de telefone
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Calcular a data de expiração (15 minutos)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);
      
      // Salvar o código no banco de dados
      const newOtpData: InsertOtpCodigo = {
        telefone: formattedPhone,
        codigo: otpCode,
        expira_em: expiresAt,
        cpf: cpf.replace(/\D/g, '')
      };
      
      // Primeiro, verificar se já existe um código para esse telefone e CPF
      // Se existir, desativar todos os códigos anteriores
      await db.update(otp_codigos)
        .set({ usado: true })
        .where(
          and(
            eq(otp_codigos.telefone, formattedPhone),
            eq(otp_codigos.cpf, cpf.replace(/\D/g, ''))
          )
        );
      
      // Inserir o novo código
      const [savedOtp] = await db.insert(otp_codigos).values(newOtpData).returning();
      
      // Preparar a mensagem SMS
      const smsMessage = `Use o codigo ${otpCode} para prosseguir com sua consulta no site da ANEEL. Ele expira em 15 minutos.`;
      
      // Preparar payload para a API
      const payload = {
        to: [formattedPhone],
        message: smsMessage,
        from: SMS_SENDER
      };
      
      // Log detalhado do payload
      console.log(`Enviando requisição para API SMS: ${SMS_API_URL}`);
      console.log(`Payload da requisição:`, JSON.stringify(payload, null, 2));
      
      // Enviar o SMS
      const response = await fetch(SMS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      // Log detalhado da resposta
      const responseText = await response.text();
      console.log(`Resposta da API SMS (status ${response.status}):`, responseText);
      
      // Tentar converter para JSON para facilitar a análise
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log(`Resposta da API em formato JSON:`, responseData);
      } catch (e) {
        console.log(`A resposta não é um JSON válido`);
      }
      
      if (!response.ok) {
        console.error(`Erro ao enviar SMS: ${response.status} ${response.statusText}`);
        // Se houver erro no envio, retornar o erro mas também o código
        // para permitir testes de desenvolvimento
        return { 
          success: false, 
          code: otpCode, // Em produção, remover esse retorno
          message: `Erro ao enviar SMS: ${response.status}. Detalhes: ${responseText}` 
        };
      }
      
      // Se chegarmos até aqui, a resposta foi bem-sucedida, mas o SMS pode não ter sido enviado
      // Vamos verificar a resposta para ter certeza
      if (responseData && responseData.error) {
        console.error(`Erro reportado pela API: ${JSON.stringify(responseData.error)}`);
        return {
          success: false,
          code: otpCode,
          message: `Erro reportado pela API: ${JSON.stringify(responseData.error)}`
        };
      }
      
      console.log(`SMS enviado com sucesso para ${formattedPhone}`);
      
      // Em ambiente de produção, não retornar o código
      // Apenas para facilitar o desenvolvimento
      return { 
        success: true, 
        code: otpCode  // Em produção, remover esse retorno
      };
      
    } catch (error) {
      console.error('Erro ao processar envio de OTP:', error);
      return { 
        success: false, 
        message: 'Erro ao processar envio de SMS' 
      };
    }
  }

  /**
   * Envia uma mensagem SMS personalizada para uma notificação do sistema
   * @param phoneNumber Número de telefone do destinatário
   * @param message Mensagem personalizada a ser enviada
   * @returns Resultado do envio
   */
  async sendNotification(phoneNumber: string, message: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Formatar o número de telefone
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Preparar payload para a API
      const payload = {
        to: [formattedPhone],
        message: message,
        from: SMS_SENDER
      };
      
      // Log detalhado do payload
      console.log(`Enviando notificação SMS para ${formattedPhone}`);
      console.log(`Payload da requisição:`, JSON.stringify(payload, null, 2));
      
      // Enviar o SMS
      const response = await fetch(SMS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      // Log detalhado da resposta
      const responseText = await response.text();
      console.log(`Resposta da API SMS (status ${response.status}):`, responseText);
      
      // Tentar converter para JSON para facilitar a análise
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log(`Resposta da API em formato JSON:`, responseData);
      } catch (e) {
        console.log(`A resposta não é um JSON válido`);
      }
      
      if (!response.ok) {
        console.error(`Erro ao enviar notificação SMS: ${response.status} ${response.statusText}`);
        return { 
          success: false, 
          message: `Erro ao enviar SMS: ${response.status}. Detalhes: ${responseText}` 
        };
      }
      
      // Verificar se há erro na resposta
      if (responseData && responseData.error) {
        console.error(`Erro reportado pela API: ${JSON.stringify(responseData.error)}`);
        return {
          success: false,
          message: `Erro reportado pela API: ${JSON.stringify(responseData.error)}`
        };
      }
      
      console.log(`Notificação SMS enviada com sucesso para ${formattedPhone}`);
      return { success: true };
      
    } catch (error) {
      console.error('Erro ao processar envio de notificação SMS:', error);
      return { 
        success: false, 
        message: 'Erro ao processar envio de SMS' 
      };
    }
  }

  /**
   * Verifica se um código OTP é válido
   * @param phoneNumber Número de telefone
   * @param otpCode Código OTP a ser verificado
   * @param cpf CPF do usuário
   * @returns true se o código for válido, false caso contrário
   */
  async verifyOtpCode(phoneNumber: string, otpCode: string, cpf: string): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const cleanCpf = cpf.replace(/\D/g, '');
      const now = new Date();
      
      // Buscar o código mais recente para esse telefone e CPF
      const [otp] = await db.select()
        .from(otp_codigos)
        .where(
          and(
            eq(otp_codigos.telefone, formattedPhone),
            eq(otp_codigos.cpf, cleanCpf),
            eq(otp_codigos.codigo, otpCode),
            eq(otp_codigos.usado, false)
          )
        )
        .orderBy(desc(otp_codigos.criado_em))
        .limit(1);
      
      if (!otp) {
        console.log(`Código OTP não encontrado ou já utilizado: ${otpCode} para ${formattedPhone}`);
        return false;
      }
      
      // Verificar se o código está expirado
      if (new Date(otp.expira_em) < now) {
        console.log(`Código OTP expirado: ${otpCode}`);
        return false;
      }
      
      // Marcar o código como usado
      await db.update(otp_codigos)
        .set({ usado: true })
        .where(eq(otp_codigos.id, otp.id));
      
      console.log(`Código OTP verificado com sucesso: ${otpCode}`);
      return true;
      
    } catch (error) {
      console.error('Erro ao verificar código OTP:', error);
      return false;
    }
  }
}

// Instância para uso em outras partes da aplicação
export const smsService = new SmsService();