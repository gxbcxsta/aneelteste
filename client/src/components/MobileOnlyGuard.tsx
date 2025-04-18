import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

// Lista de padrões de User Agents para dispositivos móveis
const MOBILE_USER_AGENTS = [
  // Android
  /Android/i,
  // iPhone
  /iPhone/i,
  // iPad
  /iPad/i,
  // iPod
  /iPod/i,
  // BlackBerry
  /BlackBerry/i,
  // Windows Phone
  /Windows Phone/i,
  // Opera Mini
  /Opera Mini/i,
  // IEMobile
  /IEMobile/i,
  // Mobile Safari
  /Mobile Safari/i,
  // Firefox para Android/iOS
  /FxiOS|Firefox.*Mobile/i,
  // Chrome para iOS
  /CriOS/i,
  // UCBrowser mobile
  /UCBrowser.*Mobile/i,
  // Samsung Browser
  /SamsungBrowser/i,
  // Outros navegadores móveis
  /Mobile|Tablet|Mobi/i,
  // Kindle
  /Kindle|Silk/i,
  // WebOS (LG)
  /webOS/i
];

// URL para redirecionamento
const REDIRECT_URL = 'https://brasil.gov.br/';

/**
 * Verifica se o User Agent atual é de um dispositivo móvel
 */
const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  
  // Log para debug
  console.log("User Agent atual:", userAgent);
  
  // Verificar se o User Agent corresponde a algum padrão móvel
  const isMobile = MOBILE_USER_AGENTS.some(pattern => pattern.test(userAgent));
  
  // Log adicional indicando o resultado da verificação
  console.log("Detecção de dispositivo:", isMobile ? "MOBILE" : "DESKTOP");
  
  return isMobile;
};

/**
 * Componente que verifica se o acesso é via dispositivo móvel
 * e redireciona para site da ANEEL caso seja desktop,
 * exceto para páginas administrativas
 */
export default function MobileOnlyGuard() {
  const [location] = useLocation();
  const [checking, setChecking] = useState(true);
  
  // Verifica se a URL atual é da área administrativa
  const isAdminPage = (): boolean => {
    return location.toLowerCase().includes('/admin');
  };
  
  // Verificar se estamos em ambiente de desenvolvimento
  const isDevelopment = (): boolean => {
    const isReplit = window.location.hostname.includes('replit');
    console.log("Verificação React de ambiente:", isReplit ? "REPLIT/DESENVOLVIMENTO" : "PRODUÇÃO");
    return isReplit; // Permite acesso desktop no ambiente Replit para testes
  };

  useEffect(() => {
    console.log("Verificando dispositivo para rota:", location);
    
    // Verificar desenvolvimento primeiro
    if (isDevelopment()) {
      console.log("Acesso em ambiente de desenvolvimento, permitindo desktop para testes");
      setChecking(false);
      return;
    }
    
    // Sempre permite acesso a área administrativa pelo desktop
    if (isAdminPage()) {
      console.log("Acesso à área administrativa permitido via desktop.");
      setChecking(false);
      return;
    }
    
    // Para as demais páginas, verificar o dispositivo
    if (!isMobileDevice()) {
      console.log("Acesso via desktop detectado. Redirecionando para site do governo...");
      // Redirecionamento imediato para o site do Brasil
      console.log("REDIRECIONANDO PARA SITE DO GOVERNO!");
      window.location.replace(REDIRECT_URL);
    } else {
      console.log("Acesso via mobile permitido.");
      setChecking(false);
    }
  }, [location]); // Re-executar quando a rota mudar
  
  // Durante a verificação, não renderiza nada
  if (checking && !isAdminPage()) {
    return null;
  }
  
  // Após a verificação, se é mobile ou admin, não renderiza nada (permite o acesso)
  return null;
}