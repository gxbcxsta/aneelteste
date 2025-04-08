import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-[var(--gov-blue-dark)] text-white mt-auto" id="contato">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">ANEEL</h3>
            <p className="text-sm">
              Agência Nacional de Energia Elétrica<br />
              SGAN 603 Módulos I e J<br />
              Brasília/DF - CEP: 70830-110
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Canais de Atendimento</h3>
            <ul className="text-sm space-y-2">
              <li>Central de Atendimento: 167</li>
              <li>Ouvidoria: 167</li>
              <li>Protocolo: protocolo@aneel.gov.br</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Acesso Rápido</h3>
            <ul className="text-sm space-y-2">
              <li><Link href="#faq" className="hover:underline">Perguntas Frequentes</Link></li>
              <li><Link href="#processo" className="hover:underline">Processo de Restituição</Link></li>
              <li><Link href="#" className="hover:underline">Legislação</Link></li>
              <li><Link href="#" className="hover:underline">Notícias</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Redes Sociais</h3>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-[var(--gov-yellow)]" aria-label="Facebook">
                <Facebook />
              </a>
              <a href="#" className="hover:text-[var(--gov-yellow)]" aria-label="Twitter">
                <Twitter />
              </a>
              <a href="#" className="hover:text-[var(--gov-yellow)]" aria-label="Instagram">
                <Instagram />
              </a>
              <a href="#" className="hover:text-[var(--gov-yellow)]" aria-label="Youtube">
                <Youtube />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-[var(--gov-blue-light)] mt-8 pt-6 text-sm text-center">
          <p>© {new Date().getFullYear()} ANEEL - Agência Nacional de Energia Elétrica. Todos os direitos reservados.</p>
          <div className="mt-2 flex justify-center space-x-4">
            <a href="#" className="hover:underline">Termos de Uso</a>
            <a href="#" className="hover:underline">Política de Privacidade</a>
            <a href="#" className="hover:underline">Acessibilidade</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
