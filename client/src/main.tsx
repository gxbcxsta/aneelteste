import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeSecurity } from "./utils/SecurityUtils";

// Add custom style variables for the GOV.BR look
const styleElement = document.createElement("style");
styleElement.textContent = `
  :root {
    --gov-blue-dark: #071D41;
    --gov-blue: #1351B4;
    --gov-blue-light: #2670E8;
    --gov-yellow: #FFCD07;
    --gov-gray-dark: #555555;
    --gov-gray: #DFDFDF;
    --gov-gray-light: #F8F8F8;
    
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 213 72% 44%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 213 72% 44%;
    --radius: 0.375rem;
  }

  body {
    font-family: 'Open Sans', Arial, sans-serif;
  }
`;
document.head.appendChild(styleElement);

// Adicionar script para gerenciar a indicação de carregamento de página
// e evitar que telas brancas apareçam entre transições
const handlePageTransitions = () => {
  // Indicar carregamento quando a página inicia
  document.body.classList.add('loading');
  
  // Quando a página estiver totalmente carregada, remover indicador
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.body.classList.remove('loading');
    }, 300);
  });
  
  // Interceptar cliques em links para mostrar animação durante navegação
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    
    if (link && link.href && !link.href.startsWith('javascript:') && !link.href.includes('#') && !e.ctrlKey && !e.metaKey) {
      document.body.classList.add('loading');
    }
  });
  
  // Interceptar envios de formulário para mostrar animação
  document.addEventListener('submit', () => {
    document.body.classList.add('loading');
  });
  
  // Adicionar indicador de carregamento durante navegação por JS
  const originalPushState = history.pushState;
  history.pushState = function() {
    document.body.classList.add('loading');
    originalPushState.apply(this, arguments as any);
    
    // Remover classe após a transição
    setTimeout(() => {
      document.body.classList.remove('loading');
    }, 800);
  };
};

// Executar script de transições
handlePageTransitions();

// Inicializar verificações de segurança imediatamente antes de qualquer outra coisa
(function() {
  try {
    // Verifica se estamos em um navegador (não em SSR)
    if (typeof window !== 'undefined') {
      // Executar com máxima prioridade
      setTimeout(() => {
        initializeSecurity();
      }, 0);
      
      // Verificar periodicamente para garantir proteção contínua
      setInterval(() => {
        if (typeof window !== 'undefined') {
          // Verificação de integridade da página
          const securityAttribute = document.documentElement.getAttribute('data-protected');
          if (!securityAttribute) {
            document.documentElement.setAttribute('data-protected', 'true');
          }
          
          // Re-verificar segurança periodicamente
          if (Math.random() < 0.2) { // 20% de chance para não ser previsível
            initializeSecurity();
          }
        }
      }, 30000); // A cada 30 segundos
    }
  } catch (error) {
    console.error("Erro ao inicializar segurança:", error);
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
