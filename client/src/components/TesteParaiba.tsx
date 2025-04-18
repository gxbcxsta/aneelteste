import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUserData } from '../contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TesteParaiba() {
  const { userData, updateUserData } = useUserData();
  const [estadoAtual, setEstadoAtual] = useState<string>(userData.estado || '');
  const { toast } = useToast();
  
  // Função para simular um usuário da Paraíba
  const simularUsuarioParaiba = () => {
    // 1. Limpar qualquer localização armazenada no localStorage
    localStorage.removeItem('localizacao');
    
    // 2. Simular uma resposta de API para a Paraíba
    const localizacaoParaiba = {
      ip: "177.200.100.123", // IP fictício
      estado: "Paraíba",
      detalhes: {
        countryCode: "BR",
        regionName: "Paraíba",
        regionCode: "PB"
      },
      timestamp: Date.now()
    };
    
    // 3. Armazenar no localStorage
    localStorage.setItem('localizacao', JSON.stringify(localizacaoParaiba));
    
    // 4. Atualizar o contexto do usuário
    updateUserData({ estado: "Paraíba" });
    
    // 5. Mostrar toast de confirmação
    toast({
      title: "Teste ativado",
      description: "Estado definido como Paraíba. As companhias elétricas configuradas são: Energisa Paraíba (válida), Neoenergia Pernambuco e Equatorial Alagoas.",
    });
    
    // 6. Atualizar o estado local
    setEstadoAtual("Paraíba");
  };
  
  // Carregar opções de companhia para o estado atual
  const opcoesCompanhiaPorEstado: Record<string, string[]> = {
    "Paraíba": ["Energisa Paraíba", "Neoenergia Pernambuco", "Equatorial Alagoas"],
  };
  
  const companhiasParaiba = opcoesCompanhiaPorEstado["Paraíba"] || [];
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Teste de Detecção: Paraíba</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Estado atual:</p>
            <p className="font-bold">{estadoAtual || "Não definido"}</p>
          </div>
          
          {estadoAtual === "Paraíba" && (
            <div>
              <p className="text-sm font-medium mb-1">Companhias elétricas disponíveis:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{companhiasParaiba[0]} <span className="text-green-600 font-bold">(válida)</span></li>
                <li>{companhiasParaiba[1]} <span className="text-red-600">(não válida)</span></li>
                <li>{companhiasParaiba[2]} <span className="text-red-600">(não válida)</span></li>
              </ul>
            </div>
          )}
          
          <Button 
            onClick={simularUsuarioParaiba}
            className="w-full"
          >
            Simular Acesso da Paraíba
          </Button>
          
          <p className="text-xs text-gray-500 mt-2">
            Este teste simula um acesso da Paraíba e configura as opções de companhia elétrica 
            de acordo. O teste funciona modificando apenas o estado no contexto do usuário e no localStorage.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}