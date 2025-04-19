/**
 * SecurityUtils.ts
 * 
 * Utilitários de segurança simplificados - VERSÃO DESKTOP PERMITIDO
 */

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
 * Sempre retorna true para permitir desktop
 */
export function isMobileDevice(): boolean {
  console.log("Verificação de dispositivo temporariamente desativada para testes.");
  return true; // Sempre retorna true para permitir desktop
}

/**
 * Função vazia de proteção DOM
 */
function setupDomProtection(): void {
  console.log("Proteção do DOM DESATIVADA para permitir acesso via desktop e ferramentas de desenvolvimento.");
}

/**
 * Função vazia de detecção de ferramentas dev
 */
export function setupDevToolsDetection(): void {
  console.log("Verificações de ferramentas de desenvolvedor DESATIVADAS para todos os dispositivos.");
}

/**
 * Função vazia de proteção contra automação
 */
function setupAntiAutomationProtection(): void {
  console.log("Verificações anti-automação DESATIVADAS para permitir acesso via desktop.");
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
 * Função simplificada de inicialização da segurança
 */
export function initializeSecurity(): void {
  console.log("Inicializando segurança...");
  
  // Todas as verificações de segurança estão desativadas
  // para permitir acesso via desktop e depuração
  setupDomProtection();
  setupDevToolsDetection();
  setupAntiAutomationProtection();
}