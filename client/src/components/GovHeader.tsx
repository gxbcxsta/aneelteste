import React from 'react';
import { Link } from 'wouter';

// Importar a imagem do logotipo do GOV.BR
import govBrLogo from '@assets/govbr.png';

export default function GovHeader() {
  return (
    <header className="bg-[#071d41] text-white py-2">
      <div className="container mx-auto flex justify-between items-center px-4">
        <Link href="/">
          <div className="font-bold text-sm flex items-center cursor-pointer">
            <img src={govBrLogo} alt="Logotipo do Brasil" className="h-6" />
          </div>
        </Link>
        <nav>
          <ul className="flex space-x-4 text-[10px]">
            <li>
              <Link href="/">
                <span className="hover:underline cursor-pointer">ACESSO À INFORMAÇÃO</span>
              </Link>
            </li>
            <li>
              <Link href="/">
                <span className="hover:underline cursor-pointer">PARTICIPE</span>
              </Link>
            </li>
            <li>
              <Link href="/">
                <span className="hover:underline cursor-pointer">SERVIÇOS</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}