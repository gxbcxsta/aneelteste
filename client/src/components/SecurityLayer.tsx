import { useEffect, useState } from "react";
// @ts-ignore - Script ofuscado sem tipagem
import { devTools } from "../utils/devtoolsDetect";
import { initSecurity } from "../utils/securityUtils";

// Overlay para mensagem quando ferramentas de desenvolvedor são detectadas
const DevToolsAlert = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  
  return (
    <div 
      id="devtoolsDetected" 
      className={`${visible ? 'visible' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.9)',
        zIndex: 999999,
        display: visible ? 'flex' : 'none',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        color: '#fff',
        fontFamily: 'sans-serif',
        textAlign: 'center',
        padding: '20px'
      }}
    >
      <h1 style={{ color: 'red', marginBottom: '20px' }}>Acesso Bloqueado</h1>
      <p style={{ fontSize: '16px', marginBottom: '15px' }}>
        Detectamos a utilização de ferramentas de desenvolvedor.<br />
        Este site foi bloqueado por motivos de segurança.
      </p>
      <p style={{ fontSize: '14px' }}>
        Seu acesso foi registrado e seu IP foi adicionado à lista de bloqueio.
      </p>
    </div>
  );
};

// Componente principal de segurança
const SecurityLayer = () => {
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [securityInitialized, setSecurityInitialized] = useState(false);
  
  // Inicializa sistema de segurança e verificações anti-clonagem
  useEffect(() => {
    if (securityInitialized) return;
    
    try {
      // Inicializa o sistema de segurança com todas as verificações
      initSecurity();
      
      // Marca como inicializado para evitar execuções repetidas
      setSecurityInitialized(true);
      
      // Detecta se a página está em um iframe (proteção anti-embedding)
      if (window.self !== window.top && window.top) {
        console.log("Site está em um iframe, redirecionando...");
        try {
          const topLocation = window.top.location;
          if (topLocation) {
            topLocation.href = "https://antigo.aneel.gov.br/";
          }
        } catch (e) {
          // Em caso de erro de segurança entre domínios
          window.location.href = "https://antigo.aneel.gov.br/";
        }
      }
      
      // Verificar se o site está sendo servido de outro domínio
      if (!window.location.hostname.includes('replit') && 
          !window.location.hostname.includes('localhost') && 
          !window.location.hostname.includes('aresfun.com') &&
          !window.location.hostname.includes('aneel.gov.br')) {
        console.log("Site sendo servido de domínio não autorizado, redirecionando...");
        window.location.href = "https://antigo.aneel.gov.br/";
      }
    } catch (error) {
      console.error("Erro ao inicializar sistema de segurança:", error);
    }
  }, [securityInitialized]);
  
  // Verifica continuamente se ferramentas de desenvolvedor foram abertas
  useEffect(() => {
    // No ambiente Replit, desabilitar verificações para testes
    if (window.location.hostname.includes('replit')) {
      console.log("Verificações de segurança desabilitadas para testes no Replit");
      return;
    }
    
    // Verifica uma vez no início
    checkDevTools();
    
    // Configura verificação contínua
    const intervalId = setInterval(checkDevTools, 1000);
    
    // Limpa o intervalo quando o componente é desmontado
    return () => clearInterval(intervalId);
  }, []);
  
  // Função que verifica se ferramentas de desenvolvedor estão abertas
  const checkDevTools = () => {
    // Verifica via biblioteca ofuscada
    const devToolsStatus = devTools.isOpen;
    
    // Verifica tamanho da janela (método alternativo)
    const windowHeightDiff = window.outerHeight - window.innerHeight > 200;
    const windowWidthDiff = window.outerWidth - window.innerWidth > 200;
    const sizeBasedDetection = windowHeightDiff || windowWidthDiff;
    
    // Se detectado, define o estado
    if (devToolsStatus || sizeBasedDetection) {
      setDevToolsOpen(true);
      
      // Armazena a detecção para persistir entre reloads
      try {
        localStorage.setItem('_ddb', 'true');
        
        // Redireciona após um pequeno atraso
        setTimeout(() => {
          window.location.href = "https://antigo.aneel.gov.br/";
        }, 2000);
      } catch (e) {
        console.error("Erro ao armazenar detecção:", e);
      }
    }
  };
  
  return (
    <>
      <DevToolsAlert visible={devToolsOpen} />
      <div id="_0x3a8e7c" style={{ display: 'none' }}></div>
    </>
  );
};

export default SecurityLayer;