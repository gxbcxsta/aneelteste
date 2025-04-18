/**
 * Módulo de segurança para proteção contra clonagem e inspeção do site
 * 
 * Este código é deliberadamente ofuscado e complexo para dificultar análise
 * e modificação por terceiros.
 */

// Função ofuscada para verificar se é dispositivo móvel
export const _0xd45e8a = (): boolean => {
  try {
    // Verificação baseada em User-Agent
    const _0x5ce7b2 = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    // Verificação baseada em recurso de toque
    const _0x2a7d4f = 'ontouchstart' in window || 
                     navigator.maxTouchPoints > 0 || 
                     (navigator as any).msMaxTouchPoints > 0;
    
    // Verificação adicional para alguns tablets/híbridos específicos
    const _0x3e8d1c = /Tablet|iPad/i.test(navigator.userAgent);
    
    // Verificação de funcionalidades específicas de mobile
    const _0x1c3a7d = typeof window.orientation !== 'undefined' || 
                     navigator.userAgent.indexOf('IEMobile') !== -1;
    
    // Armazenar o resultado para consistência
    const _0x2f5a98 = (_0x5ce7b2 && _0x2a7d4f) || (_0x3e8d1c && _0x2a7d4f) || _0x1c3a7d;
    
    if (localStorage.getItem('_dvt') !== null) {
      return JSON.parse(localStorage.getItem('_dvt') || 'false');
    }
    
    localStorage.setItem('_dvt', JSON.stringify(_0x2f5a98));
    return _0x2f5a98;
  } catch (_0x25d9ae) {
    console.error("Erro na verificação de dispositivo:", _0x25d9ae);
    return false;
  }
};

// Função ofuscada para detectar ferramentas de desenvolvedor
export const _0x3c7d1e = (): boolean => {
  try {
    const _0x4a2e7a = function() {
      const _0x5d7f68 = new Error();
      if (_0x5d7f68.stack && _0x5d7f68.stack.toString().indexOf('getEntries') !== -1) {
        return true;
      }
      return false;
    };

    // Verificar tamanho da janela vs tamanho da tela (frequentemente modificado por DevTools)
    const _0x2d3e4f = window.outerHeight - window.innerHeight > 200 || 
                     window.outerWidth - window.innerWidth > 200;
    
    // Verificação baseada em propriedades do console
    const _0x4d42a1 = (function() {
      const _0x16d79a = /./;
      const _0xf92c2e = _0x16d79a.toString();
      _0x16d79a.toString = function() {
        return _0xf92c2e;
      };
      
      const _0x51cfba = console.profile !== undefined;
      try {
        console.profile();
        console.profileEnd();
      } catch (_0x4ce4a2) {
        return false;
      }
      
      return _0x51cfba && !!console.clear && _0x4a2e7a() === true;
    })();
    
    // Element.id hack usado para detectar ferramentas de desenvolvedor
    const _0x3a8e7c = document.getElementById('_0x3a8e7c');
    return _0x2d3e4f || _0x4d42a1 || (_0x3a8e7c !== null);
  } catch (_0x561eb1) {
    return false;
  }
};

// Função ofuscada para aplicar proteções contra inspeção e clonagem
export const _0x1f2a3b = (): void => {
  try {
    // Bloquear clique direito
    document.addEventListener('contextmenu', (_0x45f7e1) => {
      _0x45f7e1.preventDefault();
      return false;
    });
    
    // Bloquear teclas de atalho comuns de inspeção
    document.addEventListener('keydown', (_0x5371f2) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S
      if (
        _0x5371f2.keyCode === 123 || 
        (_0x5371f2.ctrlKey && _0x5371f2.shiftKey && (_0x5371f2.keyCode === 73 || _0x5371f2.keyCode === 74)) ||
        (_0x5371f2.ctrlKey && (_0x5371f2.keyCode === 85 || _0x5371f2.keyCode === 83))
      ) {
        _0x5371f2.preventDefault();
        return false;
      }
    });
    
    // Bloquear seleção de texto
    document.addEventListener('selectstart', (_0x4b9ea3) => {
      if (localStorage.getItem('_dsg') === 'true') {
        _0x4b9ea3.preventDefault();
      }
    });
    
    // CSS para desabilitar seleção de texto
    const _0x17d5c3 = document.createElement('style');
    _0x17d5c3.innerHTML = `
      ._ns_ {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
    `;
    document.head.appendChild(_0x17d5c3);
    
    // Adicionar classe de não-seleção a elementos importantes
    document.querySelectorAll('div, p, span, h1, h2, h3, h4, h5, h6').forEach((_0x3c87e5) => {
      _0x3c87e5.classList.add('_ns_');
    });
    
    // Verificar continuamente se as ferramentas de desenvolvedor estão abertas
    const _0x45d2c1 = setInterval(() => {
      if (_0x3c7d1e()) {
        if (localStorage.getItem('_ddb') !== 'true') {
          localStorage.setItem('_ddb', 'true');
          window.location.href = 'https://antigo.aneel.gov.br/';
        }
      }
    }, 1000);
    
    // Armazenar o interval ID para limpar se necessário
    (window as any)._security_interval = _0x45d2c1;
    
    console.log("Inicializando segurança...");
  } catch (_0x33b824) {
    console.error("Erro na inicialização de segurança:", _0x33b824);
  }
};

// Função para verificação e redirecionamento baseado no tipo de dispositivo
export const initSecurity = (): void => {
  try {
    // Verificar se é mobile
    const isMobile = _0xd45e8a();
    localStorage.setItem('_dsg', (!isMobile).toString());
    
    // Se não for mobile, redirecionar
    if (!isMobile) {
      console.log("Dispositivo desktop detectado, redirecionando...");
      window.location.href = 'https://antigo.aneel.gov.br/';
      return;
    }
    
    // Aplicar proteções apenas se o usuário pedir especificamente
    const needsProtection = localStorage.getItem('_scp') === 'true';
    if (needsProtection) {
      _0x1f2a3b();
    } else {
      console.log("Verificações de ferramentas de desenvolvedor desativadas para permitir acesso por desktop.");
    }
    
    // Para fins de depuração, apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      (window as any).toggleSecurityProtection = () => {
        const current = localStorage.getItem('_scp') === 'true';
        localStorage.setItem('_scp', (!current).toString());
        location.reload();
      };
    }
  } catch (error) {
    console.error("Erro crítico na segurança:", error);
  }
};

// Implementação simplificada para testes - permite bypass temporário da proteção (apenas para debug)
export const bypassSecurityForTesting = (bypass: boolean = true): void => {
  if (process.env.NODE_ENV !== 'development') return;
  
  localStorage.setItem('_dvt', JSON.stringify(true)); // Forçar que é mobile
  localStorage.setItem('_scp', (!bypass).toString()); // Desativar proteções
  localStorage.setItem('_ddb', 'false'); // Resetar flag de debug
  
  // Limpar o interval se existir
  if ((window as any)._security_interval) {
    clearInterval((window as any)._security_interval);
  }
  
  console.log(`Proteções de segurança ${bypass ? 'desativadas' : 'ativadas'} para teste.`);
};