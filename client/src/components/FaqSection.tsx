import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Search } from "lucide-react";
import { Link } from "wouter";

export default function FaqSection() {
  return (
    <section className="py-16 md:py-24 bg-[#F0F5FF]" id="faq">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center gap-2 bg-[#1351B4] text-white px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <HelpCircle size={16} />
              <span>DÚVIDAS FREQUENTES</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#071D41] mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Encontre respostas para as dúvidas mais comuns sobre o processo de restituição do ICMS
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-b border-gray-100 py-2">
                <AccordionTrigger className="py-4 text-[#071D41] font-medium hover:no-underline text-left">
                  <div className="flex items-center">
                    <div className="bg-[#E5F0FF] rounded-full p-2 mr-3">
                      <HelpCircle className="text-[#1351B4] w-5 h-5" />
                    </div>
                    <span>O que é crédito energético?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-14 pr-4 pb-4 text-gray-600">
                  <p className="leading-relaxed">
                    O crédito energético corresponde ao valor que você pagou a mais na sua conta de luz nos últimos anos, 
                    decorrente de cobranças indevidas de ICMS sobre tarifas de transmissão e distribuição de energia. Esse valor 
                    está sendo restituído após decisão do STF, que considerou inconstitucional esse tipo de cobrança.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2" className="border-b border-gray-100 py-2">
                <AccordionTrigger className="py-4 text-[#071D41] font-medium hover:no-underline text-left">
                  <div className="flex items-center">
                    <div className="bg-[#E5F0FF] rounded-full p-2 mr-3">
                      <HelpCircle className="text-[#1351B4] w-5 h-5" />
                    </div>
                    <span>Como foi calculado o valor do meu crédito?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-14 pr-4 pb-4 text-gray-600">
                  <p className="leading-relaxed">
                    O valor é definido com base nas faturas de energia elétrica pagas nos últimos 5 anos, extraindo o 
                    percentual de ICMS indevidamente aplicado sobre as tarifas de transmissão e distribuição (TUSD/TUST).
                    Esse cálculo considera suas faturas específicas e as alíquotas de ICMS do seu estado.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3" className="border-b border-gray-100 py-2">
                <AccordionTrigger className="py-4 text-[#071D41] font-medium hover:no-underline text-left">
                  <div className="flex items-center">
                    <div className="bg-[#E5F0FF] rounded-full p-2 mr-3">
                      <HelpCircle className="text-[#1351B4] w-5 h-5" />
                    </div>
                    <span>Por que preciso pagar a TRE?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-14 pr-4 pb-4 text-gray-600">
                  <p className="leading-relaxed">
                    A Taxa de Regularização Energética (TRE) é necessária para cobrir os custos operacionais, administrativos 
                    e de auditoria envolvidos no processo de verificação e restituição. Ela garante a segurança jurídica e a 
                    conformidade do processo com as regulamentações da ANEEL e da Receita Federal.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4" className="border-b border-gray-100 py-2">
                <AccordionTrigger className="py-4 text-[#071D41] font-medium hover:no-underline text-left">
                  <div className="flex items-center">
                    <div className="bg-[#E5F0FF] rounded-full p-2 mr-3">
                      <HelpCircle className="text-[#1351B4] w-5 h-5" />
                    </div>
                    <span>Qual é o valor da TRE e como devo pagá-la?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-14 pr-4 pb-4 text-gray-600">
                  <p className="leading-relaxed">
                    O valor da TRE é de R$ 74,90. O pagamento é realizado via PIX, utilizando o QR Code gerado no sistema. 
                    Após a confirmação do pagamento, seu processo de restituição será automaticamente processado para o 
                    depósito em sua conta bancária.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5" className="border-b border-gray-100 py-2">
                <AccordionTrigger className="py-4 text-[#071D41] font-medium hover:no-underline text-left">
                  <div className="flex items-center">
                    <div className="bg-[#E5F0FF] rounded-full p-2 mr-3">
                      <HelpCircle className="text-[#1351B4] w-5 h-5" />
                    </div>
                    <span>Esse processo é seguro?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-14 pr-4 pb-4 text-gray-600">
                  <p className="leading-relaxed">
                    Sim. Todo o procedimento segue as normas estabelecidas pela ANEEL e está em conformidade com a 
                    decisão do STF. Seus dados são protegidos seguindo a LGPD, e todas as transações financeiras são 
                    criptografadas e processadas por sistemas certificados pelo Banco Central.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-6" className="border-b-0 py-2">
                <AccordionTrigger className="py-4 text-[#071D41] font-medium hover:no-underline text-left">
                  <div className="flex items-center">
                    <div className="bg-[#E5F0FF] rounded-full p-2 mr-3">
                      <HelpCircle className="text-[#1351B4] w-5 h-5" />
                    </div>
                    <span>Após o pagamento, quanto tempo leva para receber minha restituição?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-14 pr-4 pb-4 text-gray-600">
                  <p className="leading-relaxed">
                    Após a confirmação do pagamento da TRE, seu crédito será processado e o depósito será realizado em sua 
                    conta bancária em até 72 horas úteis. Você receberá atualizações sobre o status do seu processo por e-mail.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-6">
              Ainda tem dúvidas sobre seu direito à restituição? Faça a verificação em poucos minutos.
            </p>
            
            <Link href="/verificar">
              <button className="inline-flex items-center justify-center gap-2 bg-[#1351B4] hover:bg-[#0D47A1] text-white px-6 py-3 rounded-md text-base font-medium shadow-sm transition-all">
                Consultar restituição
                <Search size={18} />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}