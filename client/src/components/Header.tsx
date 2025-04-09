import { useState } from "react";
import { Menu } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-[var(--gov-blue-dark)]">
      {/* Main header with ANEEL logo and navigation */}
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <div className="bg-white p-1 rounded flex items-center justify-center h-10">
              <div className="text-[var(--gov-blue-dark)] font-bold text-xl">ANEEL</div>
            </div>
            <div className="text-white text-sm md:text-base ml-2 font-semibold">
              ANEEL Consumidor - Restituição ICMS<br />
              <span className="text-xs font-normal">Agência Nacional de Energia Elétrica</span>
            </div>
          </Link>
        </div>
        
        {/* Navigation for desktop */}
        <nav className="hidden md:flex items-center space-x-6 text-white">
          <div>
            <Link href="/verificar">
              <Button className="bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] font-bold">
                Consultar Restituição
              </Button>
            </Link>
          </div>
        </nav>
        
        {/* Hamburger menu for mobile */}
        <button 
          className="md:hidden flex flex-col justify-center items-center w-8 h-8 relative focus:outline-none text-white"
          onClick={toggleMobileMenu}
          aria-label="Menu de navegação"
        >
          <Menu size={24} />
        </button>
      </div>
      
      {/* Mobile menu panel - hidden by default */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'} bg-[var(--gov-blue-dark)] border-t border-[var(--gov-blue)] px-4 pb-4`}>
        <nav className="flex flex-col text-white space-y-3 pt-2">
          <div className="pt-2">
            <Link href="/verificar">
              <Button className="w-full bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] font-bold">
                Consultar Restituição
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
