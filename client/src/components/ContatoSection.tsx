import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContatoSection() {
  return (
    <section className="py-12 md:py-16 bg-white" id="contato">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--gov-blue-dark)] mb-8 text-center">
            Entre em Contato
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-4">Canais de Atendimento</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Phone className="text-[var(--gov-blue)] mr-3 h-5 w-5 mt-1" />
                  <div>
                    <h4 className="font-medium">Telefone</h4>
                    <p className="text-[var(--gov-gray-dark)]">0800 000 0000</p>
                    <p className="text-xs text-[var(--gov-gray)]">Segunda a sexta, das 8h às 18h</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail className="text-[var(--gov-blue)] mr-3 h-5 w-5 mt-1" />
                  <div>
                    <h4 className="font-medium">Email</h4>
                    <p className="text-[var(--gov-gray-dark)]">atendimento@restituicao.gov.br</p>
                    <p className="text-xs text-[var(--gov-gray)]">Resposta em até 2 dias úteis</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="text-[var(--gov-blue)] mr-3 h-5 w-5 mt-1" />
                  <div>
                    <h4 className="font-medium">Endereço</h4>
                    <p className="text-[var(--gov-gray-dark)]">
                      SGAN Quadra 603, Módulos I e J<br />
                      Brasília/DF - CEP: 70830-110
                    </p>
                    <p className="text-xs text-[var(--gov-gray)]">Atendimento presencial com agendamento</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-4">Formulário de Contato</h3>
              
              <form className="space-y-4">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium mb-1">Nome completo</label>
                  <Input id="nome" placeholder="Digite seu nome completo" />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                  <Input id="email" type="email" placeholder="Digite seu email" />
                </div>
                
                <div>
                  <label htmlFor="assunto" className="block text-sm font-medium mb-1">Assunto</label>
                  <Input id="assunto" placeholder="Assunto da mensagem" />
                </div>
                
                <div>
                  <label htmlFor="mensagem" className="block text-sm font-medium mb-1">Mensagem</label>
                  <Textarea id="mensagem" placeholder="Digite sua mensagem" rows={4} />
                </div>
                
                <Button type="submit" className="bg-[var(--gov-blue)] hover:bg-[var(--gov-blue-light)] w-full">
                  Enviar mensagem
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}