// Este componente cria um som de notificação que imita o "som de dinheiro" (moedas caindo)
export const playNotificationSound = () => {
  try {
    // Criar um novo contexto de áudio
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Função para criar um único "ping" de moeda
    const createCoinSound = (time: number, frequency: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Usar tipo "triangle" para um som metálico como moeda
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + time);
      
      // Envelope sonoro para simular o som de moeda
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + time);
      gainNode.gain.linearRampToValueAtTime(0.02, audioContext.currentTime + time + 0.01); // Ataque rápido
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + time + duration); // Decaimento
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start(audioContext.currentTime + time);
      oscillator.stop(audioContext.currentTime + time + duration);
    };
    
    // Criar sons de várias "moedas" em sequência
    createCoinSound(0, 1800, 0.15);   // Som agudo simulando moedas pequenas
    createCoinSound(0.05, 1300, 0.2);  // Som médio
    createCoinSound(0.1, 1600, 0.15);  // Som ligeiramente mais agudo
    
    return true;
  } catch (error) {
    console.error("Erro ao reproduzir som de notificação:", error);
    return false;
  }
};