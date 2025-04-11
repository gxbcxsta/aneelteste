import { Search, ChevronsRight } from "lucide-react";
import { Link } from "wouter";

export default function HeroSection() {
  return (
    <section 
      className="text-white bg-gradient-to-r from-[#071D41] to-[#1351B4] relative overflow-hidden" 
      id="simular"
    >
      {/* Elementos decorativos */}
      <div className="absolute right-0 top-0 w-64 h-64 bg-[#2670E8] opacity-10 rounded-full -mt-20 -mr-20"></div>
      <div className="absolute left-0 bottom-0 w-96 h-96 bg-[#2670E8] opacity-10 rounded-full -mb-48 -ml-48"></div>
      
      <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="grid md:grid-cols-5 gap-8 items-center">
          <div className="md:col-span-3">
            <div className="bg-[#FFCD07] rounded-md py-1 px-3 inline-block text-[#071D41] text-sm font-medium mb-6">
              Restituição ICMS • STF ADIN 10.864
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6">
              Já pensou em <span className="text-[#FFCD07]">receber de volta</span> tudo que pagou a mais na conta de luz?
            </h1>
            
            <div className="bg-[#1F61C8]/60 backdrop-blur-sm p-4 rounded-lg mb-6 border-l-4 border-[#FFCD07]">
              <p className="text-lg leading-relaxed">
                O STF confirmou: milhões de brasileiros pagaram ICMS indevido na fatura de energia.
                Você pode recuperar até <span className="font-semibold text-white">5 anos de valores pagos a mais</span>.
              </p>
            </div>
            
            <p className="text-xl md:text-2xl font-medium mb-8 flex items-center">
              <span className="bg-[#FFCD07] text-[#071D41] rounded-full w-7 h-7 flex items-center justify-center mr-2 text-lg">✓</span>
              Descubra em segundos se tem dinheiro a receber!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/verificar">
                <button className="flex items-center justify-center gap-2 bg-[#FFCD07] hover:bg-[#F2C200] text-[#071D41] px-8 py-4 rounded-md text-lg font-bold shadow-md transition-all duration-300 ease-in-out transform hover:translate-y-[-2px]">
                  <Search size={20} />
                  Verificar meu direito à restituição
                </button>
              </Link>
              
              <Link href="#processo">
                <button className="flex items-center justify-center gap-2 bg-transparent border-2 border-white/60 hover:border-white text-white px-6 py-4 rounded-md text-base font-medium transition-all">
                  Como funciona
                  <ChevronsRight size={18} />
                </button>
              </Link>
            </div>
            
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="bg-white/10 p-3 rounded-md backdrop-blur-sm text-center">
                <p className="text-sm">Processo 100% Digital</p>
              </div>
              <div className="bg-white/10 p-3 rounded-md backdrop-blur-sm text-center">
                <p className="text-sm">Restituição Garantida</p>
              </div>
              <div className="bg-white/10 p-3 rounded-md backdrop-blur-sm text-center">
                <p className="text-sm">Consulta Gratuita</p>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2 bg-[#1F61C8]/40 p-6 rounded-xl backdrop-blur-sm border border-white/10 hidden md:block">
            <div className="bg-[#071D41] p-5 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <span className="bg-[#FFCD07] text-[#071D41] rounded-full w-7 h-7 flex items-center justify-center mr-3 text-sm">1</span>
                Como funciona a restituição
              </h3>
              <p className="text-sm mb-4 text-gray-200">
                A <strong>Lei Complementar 87/96 (Lei Kandir)</strong> excluiu da base de cálculo do ICMS valores referentes a:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-gray-200">
                <li>Transmissão e distribuição de energia</li>
                <li>Encargos setoriais vinculados às faturas de energia</li>
              </ul>
              
              <div className="mt-5 pt-5 border-t border-white/20">
                <p className="text-sm mb-1 text-[#FFCD07] font-medium">ADIN 10.864 - STF</p>
                <p className="text-xs text-gray-300">
                  O Supremo Tribunal Federal decidiu que é ilegal a cobrança de ICMS sobre as tarifas de uso do sistema de transmissão e distribuição de energia elétrica.
                </p>
              </div>
              
              <Link href="/verificar">
                <button className="w-full mt-5 flex items-center justify-center gap-2 bg-white text-[#071D41] px-6 py-3 rounded-md text-sm font-medium hover:bg-[#FFCD07] transition-all">
                  <Search size={16} />
                  Verificar meu direito agora
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
