import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Impostometro() {
  const [counterValue, setCounterValue] = useState(68435258120.63);
  const [displayValue, setDisplayValue] = useState(68435258120.63);
  const [count, setCount] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  
  // Format the currency value with Brazilian formatting
  const formatCurrency = (value: number) => {
    // Formatação compacta para evitar quebras no mobile
    return `R$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  // Utilizando dois efeitos separados para melhor garantia de execução
  useEffect(() => {
    // Efeito para incrementar a contagem a cada segundo
    const timer = setInterval(() => {
      setCount(prevCount => prevCount + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Função para animar o contador gradualmente
  const animateCounter = (startValue: number, endValue: number) => {
    setAnimating(true);
    
    // 50 passos pequenos para mostrar uma animação suave
    const step = (endValue - startValue) / 50;
    let current = startValue;
    
    const animateStep = () => {
      current += step;
      if (current < endValue) {
        setDisplayValue(current);
        requestAnimationFrame(animateStep);
      } else {
        setDisplayValue(endValue);
        setAnimating(false);
      }
    };
    
    requestAnimationFrame(animateStep);
  };
  
  // Efeito que atualiza o valor baseado na contagem
  useEffect(() => {
    // A cada 10 contagens (10 segundos), incrementamos o valor
    if (count > 0 && count % 10 === 0 && !animating) {
      const newValue = counterValue + 13623928.30;
      setCounterValue(newValue);
      setIsPulsing(true);
      animateCounter(counterValue, newValue);
      
      // Remover a classe de animação após 1.5 segundos (duração da animação)
      setTimeout(() => {
        setIsPulsing(false);
      }, 1500);
    }
  }, [count, counterValue, animating]);
  
  return (
    <section className="py-12 bg-[var(--gov-gray-light)]">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto overflow-hidden shadow-md">
          <CardHeader className="bg-[var(--gov-blue)] p-3">
            <h2 className="text-xl md:text-2xl font-bold text-center text-white">Impostômetro - ICMS na Energia</h2>
          </CardHeader>
          
          <CardContent className="p-8 text-center">
            <h3 className="text-lg text-[var(--gov-gray-dark)] mb-4">Total estimado a ser restituído aos consumidores:</h3>
            
            <div 
              className={`text-4xl md:text-5xl font-bold text-[var(--gov-blue-dark)] mb-6 tabular-nums tracking-tight ${isPulsing ? 'valor-animado' : ''}`}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatCurrency(displayValue)}
            </div>
            
            <div className="w-full mb-6">
              <Progress value={85} className="h-4 bg-[var(--gov-gray)]" 
                style={{
                  background: 'var(--gov-gray)',
                  '--progress-background': 'linear-gradient(90deg, rgba(19,81,180,0.8) 0%, rgba(255,205,7,1) 100%)',
                  backgroundSize: '200% 200%',
                  animation: 'progressAnimation 2.5s ease-in-out infinite'
                } as React.CSSProperties}
              />

            </div>
            
            <p className="text-sm text-[var(--gov-gray-dark)] italic">
              Valores atualizados em tempo real com base na estimativa nacional de cobrança indevida do ICMS na conta de luz.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
