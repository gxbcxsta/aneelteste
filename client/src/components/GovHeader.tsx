import React from 'react';
import { Link } from 'wouter';

// Importar a imagem do logotipo do GOV.BR
import govBrLogo from '@assets/govbr.png';

export default function GovHeader() {
  return (
    <header className="bg-[#222222] text-white py-1.5">
      <div className="container mx-auto flex justify-between items-center px-4">
        <Link href="/">
          <div className="font-bold text-sm flex items-center cursor-pointer">
            <img src={govBrLogo} alt="Logotipo do Brasil" className="h-5" />
          </div>
        </Link>
        <nav>
          <ul className="flex space-x-6 text-[10px]">
            <li>
              <Link href="/">
                <span className="hover:underline cursor-pointer tracking-wide">ACESSO À INFORMAÇÃO</span>
              </Link>
            </li>
            <li>
              <Link href="/">
                <span className="hover:underline cursor-pointer tracking-wide">PARTICIPE</span>
              </Link>
            </li>
            <li>
              <Link href="/">
                <span className="hover:underline cursor-pointer tracking-wide">SERVIÇOS</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}