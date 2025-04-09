// Este componente cria um som de notificação usando a Web Audio API
export const playNotificationSound = () => {
  try {
    // Criar um novo contexto de áudio
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Criar um oscilador para o som
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Configurar o oscilador com tom mais suave
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime); // Frequência mais baixa (600Hz)
    
    // Configurar o ganho (volume) - mais baixo
    gainNode.gain.setValueAtTime(0.03, audioContext.currentTime); // Volume reduzido para 0.03
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3); // Duração mais curta
    
    // Conectar o oscilador ao ganho e o ganho à saída
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Iniciar e parar o oscilador
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3); // Som mais curto
    
    return true;
  } catch (error) {
    console.error("Erro ao reproduzir som de notificação:", error);
    return false;
  }
};