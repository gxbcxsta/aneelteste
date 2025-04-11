// Função para tocar um som de notificação de sininho mais agradável
export const playNotificationSound = () => {
  try {
    // Criar um novo AudioContext
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Criar osciladores para simular um som de sininho
    const bell = audioContext.createOscillator();
    const bellGain = audioContext.createGain();
    
    // Configurar o oscilador para som de sino
    bell.type = 'sine';
    bell.frequency.setValueAtTime(1046.5, audioContext.currentTime); // Dó (C6)
    bell.frequency.setValueAtTime(1567.98, audioContext.currentTime + 0.08); // Sol (G6)
    
    // Configurar o envelope do som para simular um sino
    bellGain.gain.setValueAtTime(0, audioContext.currentTime);
    bellGain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
    bellGain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
    bellGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
    
    // Conectar e tocar
    bell.connect(bellGain);
    bellGain.connect(audioContext.destination);
    
    bell.start(audioContext.currentTime);
    bell.stop(audioContext.currentTime + 0.5);
    
    // Alternativa: carregar e tocar um arquivo de áudio de sininho
    // Esta abordagem é um fallback que será implementado no futuro se necessário
    /*
    const audio = new Audio();
    audio.src = "https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3";
    audio.volume = 0.5;
    audio.play();
    */
    
    return true;
  } catch (error) {
    console.error("Erro ao tocar notificação sonora:", error);
    return false;
  }
};