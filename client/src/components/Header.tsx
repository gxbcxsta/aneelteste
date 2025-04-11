import { useState } from "react";
import { Menu, Home, Search, FileText, HelpCircle, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import GovHeader from "./GovHeader";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Função para verificar se o link está ativo
  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="bg-[#1351B4] shadow-md">
      {/* Main header with ANEEL logo and navigation */}
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <div className="bg-white p-1.5 rounded-md flex items-center justify-center h-11 shadow-sm">
              <div className="text-[#1351B4] font-bold text-xl tracking-tight">ANEEL</div>
            </div>
            <div className="text-white text-sm md:text-base ml-3 font-semibold">
              <span className="text-[#f8f8f8]">ANEEL Consumidor</span><br />
              <span className="text-xs font-normal text-[#E5E5E5]">Agência Nacional de Energia Elétrica</span>
            </div>
          </Link>
        </div>
        
        {/* Navigation for desktop */}
        <nav className="hidden md:flex items-center space-x-2 text-white">
          <Link href="/">
            <div className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors cursor-pointer ${
              isActive("/") 
                ? "bg-[#0C4DA2] text-white" 
                : "text-[#E5E5E5] hover:bg-[#0D47A1] hover:text-white"
            }`}>
              <Home size={16} className="mr-1.5" />
              Início
            </div>
          </Link>
          
          <Link href="/verificar">
            <div className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors cursor-pointer ${
              isActive("/verificar") 
                ? "bg-[#0C4DA2] text-white" 
                : "text-[#E5E5E5] hover:bg-[#0D47A1] hover:text-white"
            }`}>
              <Search size={16} className="mr-1.5" />
              Consultar
            </div>
          </Link>
          
          <Link href="/informacoes">
            <div className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors cursor-pointer ${
              isActive("/informacoes") 
                ? "bg-[#0C4DA2] text-white" 
                : "text-[#E5E5E5] hover:bg-[#0D47A1] hover:text-white"
            }`}>
              <FileText size={16} className="mr-1.5" />
              Informações
            </div>
          </Link>
          
          <div className="ml-3">
            <Link href="/verificar">
              <Button className="bg-[#FFCD07] hover:bg-[#F2C200] text-[#071D41] font-medium shadow-sm transition-all duration-200 flex items-center gap-1.5">
                <Search size={15} />
                Consultar Restituição
              </Button>
            </Link>
          </div>
        </nav>
        
        {/* Hamburger menu for mobile */}
        <button 
          className="md:hidden flex justify-center items-center w-10 h-10 relative focus:outline-none bg-[#0C4DA2] rounded-md text-white"
          onClick={toggleMobileMenu}
          aria-label="Menu de navegação"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      
      {/* Mobile menu panel - hidden by default */}
      <div 
        className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'} bg-[#0C4DA2] border-t border-[#2563EB]/30 px-4 py-3 shadow-lg transition-all duration-300`}
      >
        <nav className="flex flex-col text-white space-y-2">
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            <div className={`px-3 py-2.5 rounded-md text-sm font-medium flex items-center cursor-pointer ${
              isActive("/") ? "bg-[#071D41] text-white" : "text-[#E5E5E5]"
            }`}>
              <Home size={18} className="mr-2" />
              Início
            </div>
          </Link>
          
          <Link href="/verificar" onClick={() => setMobileMenuOpen(false)}>
            <div className={`px-3 py-2.5 rounded-md text-sm font-medium flex items-center cursor-pointer ${
              isActive("/verificar") ? "bg-[#071D41] text-white" : "text-[#E5E5E5]"
            }`}>
              <Search size={18} className="mr-2" />
              Consultar Restituição
            </div>
          </Link>
          
          <Link href="/informacoes" onClick={() => setMobileMenuOpen(false)}>
            <div className={`px-3 py-2.5 rounded-md text-sm font-medium flex items-center cursor-pointer ${
              isActive("/informacoes") ? "bg-[#071D41] text-white" : "text-[#E5E5E5]"
            }`}>
              <FileText size={18} className="mr-2" />
              Informações
            </div>
          </Link>
          
          <Link href="#faq" onClick={() => setMobileMenuOpen(false)}>
            <div className="px-3 py-2.5 rounded-md text-sm font-medium flex items-center text-[#E5E5E5] cursor-pointer">
              <HelpCircle size={18} className="mr-2" />
              Perguntas Frequentes
            </div>
          </Link>
        </nav>
      </div>
    </header>
  );
}