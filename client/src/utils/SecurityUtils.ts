/**
 * SecurityUtils.ts
 * 
 * Utilitários de segurança avançados para proteção da aplicação contra clonagem e acesso não autorizado
 */

const ANEEL_REDIRECT_URL = "https://g1.globo.com/";
const SECURITY_TOKEN_KEY = "anticlone_security_token";
const ORIGIN_TOKEN_KEY = "origin_validation_token";
const SESSION_START_KEY = "session_start_timestamp";

/**
 * Verifica se a página atual está entre as permitidas para desktop
 * Simplificado para verificar apenas o pathname, independente do domínio
 */
function isDesktopAllowedPage(): boolean {
  const currentPath = window.location.pathname;
  
  // Debugging para identificar o caminho atual
  console.log("Verificando permissão de desktop para caminho:", currentPath);
  
  // Verificar padrões para páginas administrativas
  const adminPatterns = [
    '/admin',        // Rota exata
    '/admin/',       // Rota com barra no final
    '/admin-login',  // Rota de login exata
    '/admin-login/', // Rota de login com barra no final
    '/admin/login',  // Formato alternativo de rota de login
  ];
  
  // Verificação principal: se o caminho começa com algum dos padrões admin
  const isAdmin = adminPatterns.some(pattern => 
    currentPath === pattern || 
    (pattern.endsWith('/') ? false : currentPath.startsWith(pattern + '/'))
  );
  
  console.log("É página administrativa?", isAdmin);
  return isAdmin;
}

/**
 * Verifica se o dispositivo é mobile/tablet baseado no User Agent
 * MODIFICAÇÃO TEMPORÁRIA: Desativando a verificação de dispositivo para permitir acesso via desktop
 */
export function isMobileDevice(): boolean {
  // Temporariamente retornando sempre true para permitir o acesso via desktop
  return true;

  /*
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Regex para detectar dispositivos móveis
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  // Se for uma página de admin, permitir acesso de desktop
  if (isDesktopAllowedPage()) {
    return true;
  }
  
  // Para outras páginas, verificar se é dispositivo móvel
  return mobileRegex.test(userAgent);
  */
}

/**
 * Gera um token único para identificar a sessão atual
 */
function generateSecurityToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const timestamp = new Date().getTime().toString(36);
  let result = timestamp + '_';
  
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Inicializa ou verifica os tokens de segurança anti-clonagem
 */
function initAntiCloneProtection(): void {
  // Verifica se está em uma página permitida para desktop
  const isAllowedPage = isDesktopAllowedPage();
  
  // Iniciar contador de sessão se ainda não foi iniciado
  if (!sessionStorage.getItem(SESSION_START_KEY)) {
    sessionStorage.setItem(SESSION_START_KEY, new Date().getTime().toString());
  }
  
  // Armazenar informações sobre a origem da sessão para estatísticas
  if (!sessionStorage.getItem(ORIGIN_TOKEN_KEY)) {
    const originData = {
      referer: document.referrer || 'direct',
      timestamp: new Date().getTime(),
      origin: window.location.origin,
      userAgent: navigator.userAgent
    };
    sessionStorage.setItem(ORIGIN_TOKEN_KEY, JSON.stringify(originData));
  }
  
  // Não aplicar proteções avançadas em páginas permitidas para desktop
  if (isAllowedPage) {
    console.log("Proteção anti-clone desativada para página de administração.");
    return;
  }
  
  // Verificar se o dispositivo é móvel - se não for e não for uma página admin, redirecionar
  if (!isMobileDevice()) {
    console.log("Tentativa de acesso via desktop detectada, redirecionando...");
    window.location.href = ANEEL_REDIRECT_URL;
    return;
  }
}

/**
 * Proteção contra manipulação de DOM (anti-scraping e anti-clonagem)
 */
function setupDomProtection(): void {
  // Adicionar atributos de segurança a elementos sensíveis
  const protectElements = () => {
    const sensitiveElements = document.querySelectorAll('form, button[type="submit"], input, [data-sensitive="true"]');
    
    sensitiveElements.forEach(el => {
      const randomAttr = `data-sec-${Math.random().toString(36).substring(2, 8)}`;
      el.setAttribute(randomAttr, "protected");
      
      // Observar mudanças nos atributos
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && 
              mutation.attributeName !== randomAttr && 
              mutation.attributeName !== 'class' && 
              mutation.attributeName !== 'style') {
            window.location.href = ANEEL_REDIRECT_URL;
          }
        });
      });
      
      observer.observe(el, { attributes: true });
    });
  };
  
  // Chamar inicialmente e após carregar completamente
  setTimeout(protectElements, 1000);
  window.addEventListener('load', protectElements);
  
  // Observar modificações no DOM para detectar clonagem ou injeção de scripts
  const bodyObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Verificar novos elementos script ou iframe que foram adicionados
        mutation.addedNodes.forEach(node => {
          if (node.nodeName === 'SCRIPT' || node.nodeName === 'IFRAME') {
            const element = node as HTMLElement;
            // Verificar se é um script não autorizado
            if (element.getAttribute('src') && 
                !element.getAttribute('src')?.includes('restituicao') && 
                !element.getAttribute('src')?.includes('replit') && 
                !element.getAttribute('src')?.includes('utmify') &&
                !element.getAttribute('src')?.includes('gov.br')) {
              console.error("Script não autorizado detectado!");
              window.location.href = ANEEL_REDIRECT_URL;
            }
          }
        });
      }
    });
  });
  
  bodyObserver.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
}

/**
 * Detecta tentativas de inspeção e ferramentas de desenvolvedor com métodos avançados
 */
export function setupDevToolsDetection(): void {
  // Verifica se está em uma página permitida para desktop
  if (isDesktopAllowedPage()) {
    console.log("Verificações de ferramentas de desenvolvedor desativadas para páginas de admin.");
    return;
  }
  
  // Função para redirecionar
  const redirectToAneel = () => {
    window.location.href = ANEEL_REDIRECT_URL;
  };

  // Detectar DevTools por alteração de dimensões da janela (para Chrome/Firefox)
  let devToolsTimeout: any;
  
  const checkDevTools = () => {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    
    if (widthThreshold || heightThreshold) {
      redirectToAneel();
    }
  };
  
  // Verificar periodicamente
  setInterval(checkDevTools, 1000);
  
  // Detectar F12, Ctrl+Shift+I, Ctrl+Shift+J
  window.addEventListener('keydown', (event) => {
    // F12
    if (event.key === 'F12' || event.keyCode === 123) {
      event.preventDefault();
      redirectToAneel();
      return false;
    }
    
    // Ctrl+Shift+I ou Ctrl+Shift+J
    if ((event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'i' || event.key === 'J' || event.key === 'j')) ||
        (event.metaKey && event.altKey && (event.key === 'I' || event.key === 'i' || event.key === 'J' || event.key === 'j'))) {
      event.preventDefault();
      redirectToAneel();
      return false;
    }
    
    // Ctrl+Shift+C
    if ((event.ctrlKey && event.shiftKey && (event.key === 'C' || event.key === 'c')) ||
        (event.metaKey && event.altKey && (event.key === 'C' || event.key === 'c'))) {
      event.preventDefault();
      redirectToAneel();
      return false;
    }
    
    // Ctrl+U (visualizar código-fonte)
    if ((event.ctrlKey && (event.key === 'U' || event.key === 'u'))) {
      event.preventDefault();
      redirectToAneel();
      return false;
    }
    
    return true;
  });
  
  // Detectar menu de contexto
  window.addEventListener('contextmenu', (event) => {
    // Permitir menu de contexto em dispositivos móveis
    if (isMobileDevice()) {
      return true;
    }
    
    event.preventDefault();
    return false;
  });
  
  // Sobrescrever console.log, mas permitir mensagens relacionadas à segurança
  const originalConsole = { ...console };
  console.log = function(...args) {
    // Permitimos mensagens específicas relacionadas à nossa própria função de segurança
    if (args[0] && typeof args[0] === 'string' && (
      args[0].includes("Verificando permissão") || 
      args[0].includes("página administrativa") ||
      args[0].includes("É página administrativa") ||
      args[0].includes("Inicializando segurança") ||
      args[0].includes("Proteção anti-clone") ||
      args[0].includes("Verificações de ferramentas")
    )) {
      return originalConsole.log.apply(console, args);
    }
    
    // Para outros logs, verificar se estamos em uma página não autorizada
    if (!isMobileDevice()) {
      clearTimeout(devToolsTimeout);
      devToolsTimeout = setTimeout(redirectToAneel, 500);
    }
    return originalConsole.log.apply(console, args);
  };
  
  // Detectar quando a guia não está em foco
  let blurTimeout: any;
  window.addEventListener('blur', () => {
    if (!isMobileDevice() && document.hasFocus()) {
      blurTimeout = setTimeout(redirectToAneel, 500);
    }
  });
  
  window.addEventListener('focus', () => {
    clearTimeout(blurTimeout);
  });
  
  // Detector de mudança de propriedades do console (Safari/Firefox)
  const consoleCheck = /./;
  consoleCheck.toString = function() {
    if (!isMobileDevice()) {
      redirectToAneel();
    }
    return '';
  };
  
  // Verificação periódica do console
  setInterval(() => {
    if (!isMobileDevice()) {
      console.log(consoleCheck);
    }
  }, 3000);
  
  // Detecção de ferramentas de desenvolvedor por largura da janela
  window.addEventListener('resize', () => {
    if (!isMobileDevice() && (window.outerHeight - window.innerHeight > 100 || window.outerWidth - window.innerWidth > 100)) {
      redirectToAneel();
    }
  });
  
  // Detecção de performance timing para identificar DevTools
  const checkPerformanceTiming = () => {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      
      // Páginas carregadas em ferramentas dev tendem a ter tempos de carregamento atípicos
      if (pageLoadTime < 10 || pageLoadTime > 15000) {
        // Possível uso de ferramenta de dev
        if (Math.random() < 0.5) { // Adicionar aleatoriedade para evitar detecção
          redirectToAneel();
        }
      }
    }
  };
  
  setTimeout(checkPerformanceTiming, 5000);
  
  // Adicionar detector de depuração
  //@ts-ignore
  function checkDebugger() {
    const startTime = new Date().getTime();
    debugger; // Este debugger será acionado se as ferramentas de desenvolvedor estiverem abertas
    const endTime = new Date().getTime();
    const debugTime = endTime - startTime;
    
    // Se o tempo entre início e fim for significativo, é provável que haja depuração
    if (debugTime > 100) {
      redirectToAneel();
    }
  }
  
  // Verificar periodicamente por debugger
  setInterval(checkDebugger, 1000);
}

/**
 * Proteção contra scripts ou ferramentas de automação/scraping
 */
function setupAntiAutomationProtection(): void {
  // Verifica se está em uma página permitida para desktop
  if (isDesktopAllowedPage()) {
    console.log("Verificações anti-automação desativadas para páginas de admin.");
    return;
  }

  // Verifica comportamento errático do cursor que pode indicar automação
  let lastMouseX = 0;
  let lastMouseY = 0;
  let mouseMovements = 0;
  
  window.addEventListener('mousemove', (e) => {
    if (Math.abs(e.clientX - lastMouseX) > 5 || Math.abs(e.clientY - lastMouseY) > 5) {
      mouseMovements++;
    }
    
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });
  
  // Se não houver movimento de mouse após algum tempo, pode ser automação
  setTimeout(() => {
    if (mouseMovements === 0 && !isMobileDevice()) {
      // Adiciona uma verificação extra, como pedir um clique específico
      const securityDiv = document.createElement('div');
      securityDiv.style.position = 'fixed';
      securityDiv.style.top = '0';
      securityDiv.style.left = '0';
      securityDiv.style.width = '100%';
      securityDiv.style.height = '100%';
      securityDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
      securityDiv.style.zIndex = '9999';
      securityDiv.style.display = 'flex';
      securityDiv.style.justifyContent = 'center';
      securityDiv.style.alignItems = 'center';
      securityDiv.style.flexDirection = 'column';
      
      securityDiv.innerHTML = `
        <h2 style="color: #071D41; font-size: 1.5rem; margin-bottom: 1rem;">Verificação de Segurança</h2>
        <p style="color: #333; margin-bottom: 1rem;">Por favor, clique no botão abaixo para continuar.</p>
        <button id="security-check-button" style="background: #1351B4; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Continuar</button>
      `;
      
      document.body.appendChild(securityDiv);
      
      document.getElementById('security-check-button')?.addEventListener('click', () => {
        document.body.removeChild(securityDiv);
      });
      
      // Se não houver interação em 30 segundos, redirecionar
      setTimeout(() => {
        if (document.body.contains(securityDiv)) {
          window.location.href = ANEEL_REDIRECT_URL;
        }
      }, 30000);
    }
  }, 5000);
  
  // Código de proteção contra iframe foi removido para permitir acesso em desktop
}

/**
 * Verifica se o CPF está no UserContext
 * Deve ser utilizado em componentes que exigem autenticação
 */
export function requireCpf(userData: any, navigate: (path: string) => void): boolean {
  if (!userData || !userData.cpf) {
    console.log('CPF não encontrado, redirecionando para a página inicial');
    navigate('/');
    return false;
  }
  return true;
}

/**
 * Realiza todas as verificações de segurança na inicialização
 */
export function initializeSecurity(): void {
  console.log("Inicializando segurança...");
  
  // Inicializar proteção anti-clonagem
  initAntiCloneProtection();
  
  // Configurar proteção contra manipulação de DOM
  setupDomProtection();
  
  // Configurar detecção de ferramentas de desenvolvedor
  setupDevToolsDetection();
  
  // Configurar proteção contra automação
  setupAntiAutomationProtection();
}