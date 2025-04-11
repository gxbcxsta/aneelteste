import { Facebook, Twitter, Instagram, Youtube, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-[#071d41] text-white mt-auto shadow-md" id="contato">
      <div className="container mx-auto px-4 py-10">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4 border-b border-[#1351B4] pb-2">ANEEL</h3>
            <p className="text-sm leading-relaxed">
              Agência Nacional de Energia Elétrica<br />
              SGAN 603 Módulos I e J<br />
              Brasília/DF - CEP: 70830-110
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4 border-b border-[#1351B4] pb-2">Canais de Atendimento</h3>
            <ul className="text-sm space-y-2.5">
              <li className="flex items-center"><span className="w-5 h-5 inline-flex items-center justify-center bg-[#1351B4] rounded-full mr-2 text-xs">✆</span> Central de Atendimento: 167</li>
              <li className="flex items-center"><span className="w-5 h-5 inline-flex items-center justify-center bg-[#1351B4] rounded-full mr-2 text-xs">✉</span> Ouvidoria: 167</li>
              <li className="flex items-center"><span className="w-5 h-5 inline-flex items-center justify-center bg-[#1351B4] rounded-full mr-2 text-xs">@</span> protocolo@aneel.gov.br</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4 border-b border-[#1351B4] pb-2">Acesso Rápido</h3>
            <ul className="text-sm space-y-2.5">
              <li><Link href="#faq" className="hover:text-[#FFCD07] transition-colors flex items-center"><ExternalLink size={14} className="mr-1.5" /> Perguntas Frequentes</Link></li>
              <li><Link href="#processo" className="hover:text-[#FFCD07] transition-colors flex items-center"><ExternalLink size={14} className="mr-1.5" /> Processo de Restituição</Link></li>
              <li><Link href="#" className="hover:text-[#FFCD07] transition-colors flex items-center"><ExternalLink size={14} className="mr-1.5" /> Legislação</Link></li>
              <li><Link href="#" className="hover:text-[#FFCD07] transition-colors flex items-center"><ExternalLink size={14} className="mr-1.5" /> Notícias</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4 border-b border-[#1351B4] pb-2">Redes Sociais</h3>
            <div className="flex space-x-4">
              <a href="#" className="bg-[#1351B4] p-2 rounded-full hover:bg-[#FFCD07] hover:text-[#071d41] transition-colors" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="#" className="bg-[#1351B4] p-2 rounded-full hover:bg-[#FFCD07] hover:text-[#071d41] transition-colors" aria-label="Twitter">
                <Twitter size={18} />
              </a>
              <a href="#" className="bg-[#1351B4] p-2 rounded-full hover:bg-[#FFCD07] hover:text-[#071d41] transition-colors" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="#" className="bg-[#1351B4] p-2 rounded-full hover:bg-[#FFCD07] hover:text-[#071d41] transition-colors" aria-label="Youtube">
                <Youtube size={18} />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-[#1351B4] mt-8 pt-6 text-sm text-center">
          <p>© {new Date().getFullYear()} ANEEL - Agência Nacional de Energia Elétrica. Todos os direitos reservados.</p>
          <div className="mt-3 flex justify-center space-x-6">
            <a href="#" className="hover:underline hover:text-[#FFCD07] transition-colors">Termos de Uso</a>
            <a href="#" className="hover:underline hover:text-[#FFCD07] transition-colors">Política de Privacidade</a>
            <a href="#" className="hover:underline hover:text-[#FFCD07] transition-colors">Acessibilidade</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
