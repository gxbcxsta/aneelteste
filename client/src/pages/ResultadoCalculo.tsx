import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Coins, User, Building, MapPin, ChevronRight, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

export default function ResultadoCalculo() {
  const [valorRestituicao, setValorRestituicao] = useState(0);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [companhia, setCompanhia] = useState("");
  const [estado, setEstado] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [valorMedio, setValorMedio] = useState("");
  const [meses, setMeses] = useState("");
  
  useEffect(() => {
    // Recupera parâmetros da URL
    const searchParams = new URLSearchParams(window.location.search);
    
    // Preenche os estados com os parâmetros
    setCpf(searchParams.get('cpf') || '');
    setNome(searchParams.get('nome') || '');
    setCompanhia(searchParams.get('companhia') || '');
    setEstado(searchParams.get('estado') || '');
    setDataNascimento(searchParams.get('nasc') || '');
    
    // Define os valores para cálculo
    const valor = searchParams.get('valor') || '0';
    setValorRestituicao(parseInt(valor));
    setValorMedio(searchParams.get('valorMedio') || '');
    setMeses(searchParams.get('meses') || '');
  }, []);
  
  // Formatar CPF
  const formatarCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };
  
  // Formatar valor monetário
  const formatarMoeda = (valor: number) => {
    return `R$ ${(valor / 100).toFixed(2).replace(".", ",")}`;
  };
  
  // Formatar data
  const formatarData = (data: string) => {
    // Assumindo que a data vem no formato YYYY-MM-DD
    if (!data || data.length < 10) return data;
    
    try {
      const [ano, mes, dia] = data.substring(0, 10).split('-');
      return `${dia}/${mes}/${ano}`;
    } catch {
      return data;
    }
  };
  
  const prosseguirParaPagamento = () => {
    window.location.href = `/pagamento?cpf=${encodeURIComponent(cpf)}&nome=${encodeURIComponent(nome)}&valor=${encodeURIComponent(valorRestituicao)}&nasc=${encodeURIComponent(dataNascimento)}&companhia=${encodeURIComponent(companhia)}&estado=${encodeURIComponent(estado)}`;
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <Header />
      
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--gov-blue-dark)]">
              Resultado do Cálculo de Restituição
            </h1>
            
            <Card className="overflow-hidden">
              <div className="bg-green-50 p-6 border-b border-green-100">
                <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-2">
                  Valor Disponível para Restituição
                </h2>
                
                <div className="flex items-center">
                  <Coins className="h-8 w-8 text-green-600 mr-3" />
                  <span className="text-3xl font-bold text-green-600">
                    {formatarMoeda(valorRestituicao)}
                  </span>
                </div>
                
                {valorMedio && meses && (
                  <p className="text-sm text-[var(--gov-gray-dark)] mt-4">
                    Cálculo baseado em {meses} meses com valor médio de {valorMedio}
                  </p>
                )}
              </div>
              
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-[var(--gov-blue-dark)]">
                  Dados do Solicitante
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-[var(--gov-blue)] mt-0.5" />
                    <div>
                      <p className="text-sm text-[var(--gov-gray-dark)]">Nome Completo</p>
                      <p className="font-medium">{nome}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="h-5 w-5 flex items-center justify-center text-[var(--gov-blue)] mt-0.5">
                      <span className="text-xs font-bold">CPF</span>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--gov-gray-dark)]">CPF</p>
                      <p className="font-medium">{formatarCPF(cpf)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-[var(--gov-blue)] mt-0.5" />
                    <div>
                      <p className="text-sm text-[var(--gov-gray-dark)]">Data de Nascimento</p>
                      <p className="font-medium">{formatarData(dataNascimento)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Building className="h-5 w-5 text-[var(--gov-blue)] mt-0.5" />
                    <div>
                      <p className="text-sm text-[var(--gov-gray-dark)]">Companhia Elétrica</p>
                      <p className="font-medium">{companhia}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-[var(--gov-blue)] mt-0.5" />
                    <div>
                      <p className="text-sm text-[var(--gov-gray-dark)]">Estado</p>
                      <p className="font-medium">{estado}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-[var(--gov-blue-dark)]">
                  Próximos Passos
                </h3>
                
                <p className="text-[var(--gov-gray-dark)]">
                  Para prosseguir com o seu processo de restituição, é necessário realizar o pagamento da taxa de processamento.
                </p>
                
                <Button 
                  onClick={prosseguirParaPagamento}
                  className="w-full bg-[var(--gov-blue)] hover:bg-[var(--gov-blue)]/90 mt-4"
                >
                  Prosseguir para pagamento
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">Informação Importante</h3>
              <p className="text-sm text-blue-700">
                O valor exibido corresponde ao montante que você tem direito a receber após a aprovação do seu processo.
                A taxa de processamento é necessária para cobrir os custos administrativos e operacionais.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}