import { Search, CheckCircle, Clock, Users, HelpCircle, ShieldCheck, FileText } from "lucide-react";
import { Link } from "wouter";

export default function InfoSection() {
  return (
    <section className="py-10 md:py-16 bg-gradient-to-b from-white to-gray-50" id="processo">
      <div className="container mx-auto px-2">
        <div className="w-full mx-auto">
          <div className="mb-8 text-center">
            <span className="bg-[#1351B4] text-white px-3 py-1 rounded-md text-xs font-medium">INFORMAÇÕES IMPORTANTES</span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#071D41] mt-3 mb-2">
              Sobre a restituição do ICMS
            </h2>
            <p className="text-base text-gray-600 max-w-3xl mx-auto">
              Entenda como funciona o processo de restituição dos valores pagos indevidamente e como você pode receber o que é seu por direito.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-1">
              <div className="border-l-4 border-[#1351B4] rounded-l-md p-4 md:p-5">
                <div className="flex items-start">
                  <div className="bg-[#1351B4]/10 rounded-full p-2 mr-3">
                    <CheckCircle className="text-[#1351B4] w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#071D41] mb-1">Decisão do STF</h3>
                    <p className="text-sm text-gray-600">
                      O STF reconheceu que a cobrança de ICMS sobre tarifas de transmissão e distribuição de energia elétrica é inconstitucional, beneficiando milhões de consumidores brasileiros.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-1">
              <div className="border-l-4 border-[#1351B4] rounded-l-md p-4 md:p-5">
                <div className="flex items-start">
                  <div className="bg-[#1351B4]/10 rounded-full p-2 mr-3">
                    <Clock className="text-[#1351B4] w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#071D41] mb-1">Período de Restituição</h3>
                    <p className="text-sm text-gray-600">
                      É possível recuperar valores pagos indevidamente nos últimos 5 anos, conforme o prazo prescricional estabelecido na legislação tributária brasileira.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-1">
              <div className="border-l-4 border-[#FFCD07] rounded-l-md p-4 md:p-5">
                <div className="flex items-start">
                  <div className="bg-[#FFCD07]/10 rounded-full p-2 mr-3">
                    <Users className="text-[#1351B4] w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#071D41] mb-1">Quem tem direito?</h3>
                    <p className="text-sm text-gray-600">
                      Todos os consumidores residenciais e empresariais que pagaram contas de energia elétrica nos últimos 5 anos têm direito a verificar e solicitar sua restituição.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-1">
              <div className="border-l-4 border-[#FFCD07] rounded-l-md p-4 md:p-5">
                <div className="flex items-start">
                  <div className="bg-[#FFCD07]/10 rounded-full p-2 mr-3">
                    <HelpCircle className="text-[#1351B4] w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#071D41] mb-1">Como solicitar?</h3>
                    <p className="text-sm text-gray-600">
                      Utilize nossa ferramenta de simulação para calcular seu valor e receba orientações detalhadas sobre como iniciar o processo de restituição de forma segura.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-1">
              <div className="border-l-4 border-[#1351B4] rounded-l-md p-4 md:p-5">
                <div className="flex items-start">
                  <div className="bg-[#1351B4]/10 rounded-full p-2 mr-3">
                    <ShieldCheck className="text-[#1351B4] w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#071D41] mb-1">Segurança e Transparência</h3>
                    <p className="text-sm text-gray-600">
                      O processo é monitorado pela ANEEL e órgãos reguladores, garantindo total transparência e segurança. Seus dados são protegidos e criptografados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-1">
              <div className="border-l-4 border-[#1351B4] rounded-l-md p-4 md:p-5">
                <div className="flex items-start">
                  <div className="bg-[#1351B4]/10 rounded-full p-2 mr-3">
                    <FileText className="text-[#1351B4] w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#071D41] mb-1">Documentos Necessários</h3>
                    <p className="text-sm text-gray-600">
                      Para consultar seu direito, você precisará apenas do seu CPF e confirmar alguns dados básicos para validação da sua identidade.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 md:p-5 bg-[#071D41] rounded-xl text-center relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-[#1351B4] opacity-20 rounded-full -mt-8 -mr-8"></div>
            <div className="absolute left-0 bottom-0 w-32 h-32 bg-[#1351B4] opacity-20 rounded-full -mb-12 -ml-12"></div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-white mb-2">Pronto para receber sua restituição?</h3>
              <p className="text-blue-100 mb-4 max-w-2xl mx-auto text-sm">
                Faça agora a consulta do seu CPF e descubra em poucos minutos quanto você tem a receber de volta.
              </p>
              
              <Link href="/verificar">
                <button className="inline-flex items-center justify-center gap-2 bg-[#FFCD07] hover:bg-[#F2C200] text-[#071D41] px-6 py-3 rounded-md text-base font-bold shadow-md transition-all">
                  <Search size={18} />
                  Consultar restituição
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
