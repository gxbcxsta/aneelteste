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
      
      <div className="container mx-auto px-2 py-10 md:py-16 relative z-10">
        <div className="grid md:grid-cols-5 gap-4 md:gap-6 items-center">
          <div className="md:col-span-3">
            <div className="bg-[#FFCD07] rounded-md py-1 px-2 inline-block text-[#071D41] text-xs font-medium mb-4">
              Restituição ICMS • STF ADIN 10.864
            </div>
            
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-4">
              Receba de volta <span className="text-[#FFCD07]">o que pagou a mais</span> na conta de luz
            </h1>
            
            <div className="bg-[#1F61C8]/60 backdrop-blur-sm p-3 rounded-lg mb-4 border-l-4 border-[#FFCD07]">
              <p className="text-base leading-snug">
                O STF confirmou: milhões de brasileiros pagaram ICMS indevido na fatura de energia.
                Você pode recuperar até <span className="font-semibold text-white">5 anos de valores pagos a mais</span>.
              </p>
            </div>
            
            <p className="text-lg md:text-xl font-medium mb-4 flex items-center">
              <span className="bg-[#FFCD07] text-[#071D41] rounded-full w-6 h-6 flex items-center justify-center mr-2 text-base">✓</span>
              Descubra se tem dinheiro a receber!</p>
            
            <div className="flex justify-center sm:justify-start">
              <Link href="/verificar">
                <button className="flex items-center justify-center gap-2 bg-[#FFCD07] hover:bg-[#F2C200] text-[#071D41] px-6 py-3 rounded-md text-base font-bold shadow-md transition-all duration-300 ease-in-out transform hover:translate-y-[-2px]">
                  <Search size={18} />
                  Verificar meu direito à restituição
                </button>
              </Link>
            </div>
            
            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="bg-white/10 px-2 py-2 rounded-md backdrop-blur-sm text-center">
                <p className="text-xs">Processo Digital</p>
              </div>
              <div className="bg-white/10 px-2 py-2 rounded-md backdrop-blur-sm text-center">
                <p className="text-xs">Garantido</p>
              </div>
              <div className="bg-white/10 px-2 py-2 rounded-md backdrop-blur-sm text-center">
                <p className="text-xs">Consulta Grátis</p>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2 bg-[#1F61C8]/40 p-4 rounded-xl backdrop-blur-sm border border-white/10 hidden md:block">
            <div className="bg-[#071D41] p-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <span className="bg-[#FFCD07] text-[#071D41] rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs">1</span>
                Como funciona a restituição
              </h3>
              <p className="text-xs mb-3 text-gray-200">
                A <strong>Lei Complementar 87/96 (Lei Kandir)</strong> excluiu da base de cálculo do ICMS valores referentes a:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-gray-200">
                <li>Transmissão e distribuição de energia</li>
                <li>Encargos setoriais vinculados às faturas de energia</li>
              </ul>
              
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-xs mb-1 text-[#FFCD07] font-medium">ADIN 10.864 - STF</p>
                <p className="text-xs text-gray-300">
                  O Supremo Tribunal Federal decidiu que é ilegal a cobrança de ICMS sobre as tarifas de uso do sistema de transmissão e distribuição de energia elétrica.
                </p>
              </div>
              
              <Link href="/verificar">
                <button className="w-full mt-4 flex items-center justify-center gap-2 bg-white text-[#071D41] px-4 py-2 rounded-md text-sm font-medium hover:bg-[#FFCD07] transition-all">
                  <Search size={14} />
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
