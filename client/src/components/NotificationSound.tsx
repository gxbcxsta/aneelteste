// Função para tocar um som de notificação curto
export const playNotificationSound = () => {
  try {
    // Criar um novo AudioContext
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Criar um oscillator para gerar um som curto
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Configurar os osciladores para sons semelhantes a notificações do iPhone
    oscillator1.type = 'sine';
    oscillator1.frequency.value = 1100;
    oscillator2.type = 'sine';
    oscillator2.frequency.value = 1300;

    // Configurar o gain para um fade de saída suave
    gainNode.gain.value = 0.1;
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    // Conectar tudo
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Definir quando parar os osciladores
    oscillator1.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.15);
    
    // Segundo tom levemente atrasado
    oscillator2.start(audioContext.currentTime + 0.15);
    oscillator2.stop(audioContext.currentTime + 0.3);

    return true;
  } catch (error) {
    console.error("Erro ao tocar notificação sonora:", error);
    return false;
  }
};