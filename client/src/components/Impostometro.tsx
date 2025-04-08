import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Impostometro() {
  const [counterValue, setCounterValue] = useState(68435258120.63);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  
  // Format the currency value with Brazilian formatting
  const formatCurrency = (value: number) => {
    return 'R$ ' + value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  useEffect(() => {
    const incrementValue = 13623928.30 / 500; // Increase by 13.623.928,30 over ~10 seconds
    
    const updateCounter = (timestamp: number) => {
      if (!lastUpdateRef.current) lastUpdateRef.current = timestamp;
      
      const deltaTime = timestamp - lastUpdateRef.current;
      
      if (deltaTime > 20) { // Update roughly 50 times per second
        lastUpdateRef.current = timestamp;
        setCounterValue(prev => prev + incrementValue);
      }
      
      animationFrameRef.current = requestAnimationFrame(updateCounter);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateCounter);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  return (
    <section className="py-12 bg-[var(--gov-gray-light)]">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto overflow-hidden shadow-md">
          <CardHeader className="bg-[var(--gov-blue)] p-4">
            <h2 className="text-2xl font-bold text-center text-white">Impostômetro Nacional - ICMS na Energia</h2>
          </CardHeader>
          
          <CardContent className="p-8 text-center">
            <h3 className="text-lg text-[var(--gov-gray-dark)] mb-4">Total estimado a ser restituído aos consumidores:</h3>
            
            <div 
              className="text-5xl md:text-6xl font-bold text-[var(--gov-blue-dark)] mb-6 tabular-nums"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatCurrency(counterValue)}
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
              <style jsx>{`
                @keyframes progressAnimation {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
              `}</style>
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
