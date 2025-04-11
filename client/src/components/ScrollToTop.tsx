import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

/**
 * Componente que rola a página para o topo quando o usuário navega entre páginas
 */
export default function ScrollToTop() {
  const [location] = useLocation();
  const prevLocation = useRef(location);
  
  useEffect(() => {
    // Só rola para o topo se a localização mudou
    if (prevLocation.current !== location) {
      window.scrollTo(0, 0);
      prevLocation.current = location;
    }
  }, [location]);
  
  // Componente não renderiza nada, apenas executa o efeito
  return null;
}