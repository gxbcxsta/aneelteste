import { Search, CheckCircle, Clock, Users, HelpCircle, ShieldCheck, FileText } from "lucide-react";
import { Link } from "wouter";

export default function InfoSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50" id="processo">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <span className="bg-[#1351B4] text-white px-4 py-1 rounded-md text-sm font-medium">INFORMAÇÕES IMPORTANTES</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#071D41] mt-4 mb-3">
              O que você precisa saber sobre a restituição do ICMS
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Entenda como funciona o processo de restituição dos valores pagos indevidamente e como você pode receber o que é seu por direito.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-1">
              <div className="border-l-4 border-[#1351B4] rounded-l-md p-6">
                <div className="flex items-start">
                  <div className="bg-[#1351B4]/10 rounded-full p-3 mr-4">
                    <CheckCircle className="text-[#1351B4] w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#071D41] mb-2">Decisão do STF</h3>
                    <p className="text-gray-600">
                      O STF reconheceu que a cobrança de ICMS sobre tarifas de transmissão e distribuição de energia elétrica é inconstitucional, beneficiando milhões de consumidores brasileiros.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-1">
              <div className="border-l-4 border-[#1351B4] rounded-l-md p-6">
                <div className="flex items-start">
                  <div className="bg-[#1351B4]/10 rounded-full p-3 mr-4">
                    <Clock className="text-[#1351B4] w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#071D41] mb-2">Período de Restituição</h3>
                    <p className="text-gray-600">
                      É possível recuperar valores pagos indevidamente nos últimos 5 anos, conforme o prazo prescricional estabelecido na legislação tributária brasileira.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-1">
              <div className="border-l-4 border-[#FFCD07] rounded-l-md p-6">
                <div className="flex items-start">
                  <div className="bg-[#FFCD07]/10 rounded-full p-3 mr-4">
                    <Users className="text-[#1351B4] w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#071D41] mb-2">Quem tem direito?</h3>
                    <p className="text-gray-600">
                      Todos os consumidores residenciais e empresariais que pagaram contas de energia elétrica nos últimos 5 anos têm direito a verificar e solicitar sua restituição.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-1">
              <div className="border-l-4 border-[#FFCD07] rounded-l-md p-6">
                <div className="flex items-start">
                  <div className="bg-[#FFCD07]/10 rounded-full p-3 mr-4">
                    <HelpCircle className="text-[#1351B4] w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#071D41] mb-2">Como solicitar?</h3>
                    <p className="text-gray-600">
                      Utilize nossa ferramenta de simulação para calcular seu valor e receba orientações detalhadas sobre como iniciar o processo de restituição de forma segura.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-1">
              <div className="border-l-4 border-[#1351B4] rounded-l-md p-6">
                <div className="flex items-start">
                  <div className="bg-[#1351B4]/10 rounded-full p-3 mr-4">
                    <ShieldCheck className="text-[#1351B4] w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#071D41] mb-2">Segurança e Transparência</h3>
                    <p className="text-gray-600">
                      O processo é monitorado pela ANEEL e órgãos reguladores, garantindo total transparência e segurança. Seus dados são protegidos e criptografados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-1">
              <div className="border-l-4 border-[#1351B4] rounded-l-md p-6">
                <div className="flex items-start">
                  <div className="bg-[#1351B4]/10 rounded-full p-3 mr-4">
                    <FileText className="text-[#1351B4] w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#071D41] mb-2">Documentos Necessários</h3>
                    <p className="text-gray-600">
                      Para consultar seu direito, você precisará apenas do seu CPF e confirmar alguns dados básicos para validação da sua identidade.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 p-6 bg-[#071D41] rounded-xl text-center relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-[#1351B4] opacity-20 rounded-full -mt-8 -mr-8"></div>
            <div className="absolute left-0 bottom-0 w-40 h-40 bg-[#1351B4] opacity-20 rounded-full -mb-16 -ml-16"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white mb-3">Pronto para receber sua restituição?</h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Faça agora a consulta do seu CPF e descubra em poucos minutos quanto você tem a receber de volta.
              </p>
              
              <Link href="/verificar">
                <button className="inline-flex items-center justify-center gap-2 bg-[#FFCD07] hover:bg-[#F2C200] text-[#071D41] px-8 py-4 rounded-md text-lg font-bold shadow-md transition-all">
                  <Search size={20} />
                  Verificar meu direito à restituição
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
