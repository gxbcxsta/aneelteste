import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FaqSection() {
  return (
    <section className="py-12 md:py-16 bg-gray-50" id="faq">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--gov-blue-dark)] mb-8 text-center">
            Perguntas Frequentes
          </h2>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border border-gray-200 rounded-md mb-4 bg-white">
              <AccordionTrigger className="px-4 py-3 text-[var(--gov-blue-dark)] font-medium hover:no-underline">
                O que é crédito energético?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-[var(--gov-gray-dark)]">
                O crédito energético corresponde ao valor que você pagou a mais na sua conta de luz nos últimos anos, 
                decorrente de cobranças indevidas. Esse valor está sendo restituído pelo Governo Federal, após análise 
                e verificação dos dados de consumo.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border border-gray-200 rounded-md mb-4 bg-white">
              <AccordionTrigger className="px-4 py-3 text-[var(--gov-blue-dark)] font-medium hover:no-underline">
                Como foi calculado o valor do meu crédito?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-[var(--gov-gray-dark)]">
                O valor é definido com base no consumo excedente identificado no seu histórico de energia, 
                considerando os excessos de kWh e as diferenças tarifárias constatadas em auditoria pelos 
                órgãos responsáveis.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border border-gray-200 rounded-md mb-4 bg-white">
              <AccordionTrigger className="px-4 py-3 text-[var(--gov-blue-dark)] font-medium hover:no-underline">
                Por que preciso pagar a TRE?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-[var(--gov-gray-dark)]">
                A Taxa de Regularização Energética (TRE) é uma exigência legal imposta pelos órgãos governamentais, 
                como a ANEEL e a Receita Federal. Essa taxa cobre os custos operacionais, administrativos e de 
                auditorias necessários para a liberação segura e oficial do seu crédito.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4" className="border border-gray-200 rounded-md mb-4 bg-white">
              <AccordionTrigger className="px-4 py-3 text-[var(--gov-blue-dark)] font-medium hover:no-underline">
                Qual é o valor da TRE e como devo pagá-la?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-[var(--gov-gray-dark)]">
                O valor da TRE é de R$74,90. O pagamento pode ser efetuado através de PIX, conforme os meios 
                autorizados pelo sistema oficial.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5" className="border border-gray-200 rounded-md mb-4 bg-white">
              <AccordionTrigger className="px-4 py-3 text-[var(--gov-blue-dark)] font-medium hover:no-underline">
                Esse processo é seguro?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-[var(--gov-gray-dark)]">
                Sim. Todo o procedimento é regulamentado e fiscalizado pela ANEEL e pela Receita Federal, 
                garantindo a segurança e a transparência na liberação dos valores.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6" className="border border-gray-200 rounded-md mb-4 bg-white">
              <AccordionTrigger className="px-4 py-3 text-[var(--gov-blue-dark)] font-medium hover:no-underline">
                Após o pagamento, quanto tempo leva para receber minha restituição?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-[var(--gov-gray-dark)]">
                Após a confirmação do pagamento, seu crédito será liberado e depositado em sua conta 
                bancária em até 72h úteis.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
}