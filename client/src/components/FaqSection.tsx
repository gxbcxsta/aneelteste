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
                Como é calculado o valor do crédito energético?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-[var(--gov-gray-dark)]">
                O valor é calculado com base nas faturas de energia elétrica dos últimos 5 anos. 
                A restituição considera os valores de ICMS pagos indevidamente sobre as tarifas 
                de transmissão e distribuição (TUSD/TUST), que representam cerca de 30% a 40% 
                da sua conta de luz, dependendo da concessionária e do estado.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border border-gray-200 rounded-md mb-4 bg-white">
              <AccordionTrigger className="px-4 py-3 text-[var(--gov-blue-dark)] font-medium hover:no-underline">
                Quais documentos preciso apresentar para solicitar a restituição?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-[var(--gov-gray-dark)]">
                Para iniciar o processo, você precisará de: 
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Documento de identificação com foto (RG ou CNH)</li>
                  <li>CPF</li>
                  <li>Comprovante de residência atual</li>
                  <li>Faturas de energia elétrica dos últimos 5 anos (se disponíveis)</li>
                  <li>Dados bancários para recebimento do valor</li>
                </ul>
                Não se preocupe se não tiver todas as faturas - a concessionária possui esses registros.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border border-gray-200 rounded-md mb-4 bg-white">
              <AccordionTrigger className="px-4 py-3 text-[var(--gov-blue-dark)] font-medium hover:no-underline">
                Quanto tempo leva para receber o valor da restituição?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-[var(--gov-gray-dark)]">
                Após a aprovação do pedido de restituição, o prazo médio para recebimento é de 60 a 90 dias. 
                Este prazo pode variar de acordo com a concessionária de energia e o estado. O valor pode 
                ser creditado diretamente na conta bancária informada ou como abatimento nas próximas faturas 
                de energia, conforme sua preferência.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4" className="border border-gray-200 rounded-md mb-4 bg-white">
              <AccordionTrigger className="px-4 py-3 text-[var(--gov-blue-dark)] font-medium hover:no-underline">
                A Taxa Referencial (TR) é aplicada na correção dos valores?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-[var(--gov-gray-dark)]">
                Sim. Os valores a serem restituídos são corrigidos monetariamente pela Taxa Referencial (TR), 
                acrescidos de juros de 1% ao mês, calculados desde a data do pagamento indevido até a data 
                da efetiva restituição, conforme estabelecido pelo Superior Tribunal de Justiça (STJ) para 
                casos de repetição de indébito tributário.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5" className="border border-gray-200 rounded-md mb-4 bg-white">
              <AccordionTrigger className="px-4 py-3 text-[var(--gov-blue-dark)] font-medium hover:no-underline">
                O processo de restituição é seguro?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-[var(--gov-gray-dark)]">
                Sim, o processo é totalmente seguro e baseado na decisão do Supremo Tribunal Federal (STF) 
                que considerou inconstitucional a cobrança de ICMS sobre as tarifas de transmissão e distribuição. 
                O sistema utiliza verificação em duas etapas e toda a comunicação é criptografada. Seus dados pessoais 
                são protegidos conforme a Lei Geral de Proteção de Dados (LGPD).
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6" className="border border-gray-200 rounded-md mb-4 bg-white">
              <AccordionTrigger className="px-4 py-3 text-[var(--gov-blue-dark)] font-medium hover:no-underline">
                Quem não tem todas as faturas de energia dos últimos 5 anos pode solicitar?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-[var(--gov-gray-dark)]">
                Sim. Mesmo sem ter todas as faturas em mãos, você pode solicitar a restituição. 
                As concessionárias de energia mantêm registros detalhados de pagamentos por pelo menos 
                5 anos. Durante o processo, você autoriza a consulta desses registros para que o cálculo 
                seja feito com base nos dados oficiais da concessionária, garantindo precisão no valor a ser restituído.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
}