// Este componente cria um som de notificação usando a Web Audio API
export const playNotificationSound = () => {
  try {
    // Criar um novo contexto de áudio
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Criar um oscilador para o som
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Configurar o oscilador
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // Nota A5
    
    // Configurar o ganho (volume)
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    // Conectar o oscilador ao ganho e o ganho à saída
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Iniciar e parar o oscilador
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
    
    return true;
  } catch (error) {
    console.error("Erro ao reproduzir som de notificação:", error);
    return false;
  }
};