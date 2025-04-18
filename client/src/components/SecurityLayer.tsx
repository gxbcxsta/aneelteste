import { useEffect } from "react";

/**
 * Componente de segurança simplificado para proteção contra clonagem
 * Esta é uma versão básica que faz verificações simples sem scripts ofuscados
 */
const SecurityLayer = () => {
  // Efeito para inicializar verificações básicas de segurança
  useEffect(() => {
    // No ambiente de desenvolvimento não aplicamos todas as proteções
    if (window.location.hostname.includes('replit') || 
        window.location.hostname.includes('localhost')) {
      console.log("Ambiente de desenvolvimento, desativando proteções avançadas");
      return;
    }
    
    // Verificação de dispositivo móvel
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) {
      console.log("Dispositivo desktop detectado, redirecionando...");
      window.location.href = "https://antigo.aneel.gov.br/";
      return;
    }
    
    // Bloquear clique direito
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
    
    // Bloquear atalhos de teclado comuns para dev tools
    document.addEventListener('keydown', (e) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.keyCode === 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) ||
        (e.ctrlKey && e.keyCode === 85)
      ) {
        e.preventDefault();
        return false;
      }
    });
  }, []);
  
  return null;
};

export default SecurityLayer;