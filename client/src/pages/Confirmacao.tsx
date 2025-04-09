import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, RefreshCw, AlertCircle, Lock, Smartphone, CreditCard, Check, ChevronRight, Phone, Mail, BanknoteIcon, CircleDollarSign } from "lucide-react";
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
    .min(11, "Telefone deve ter pelo menos 11 dígitos")
    .max(11, "Telefone deve ter no máximo 11 dígitos")
    .regex(/^[0-9]+$/, "Telefone deve conter apenas números"),
});

// Esquema de validação para o código SMS
const codigoSchema = z.object({
  codigo: z
    .string()
    .length(6, "O código deve ter 6 dígitos")
    .regex(/^[0-9]+$/, "Código deve conter apenas números"),
});

// Esquema de validação para os dados bancários
const dadosBancariosSchema = z.object({
  banco: z.string().min(1, "Selecione um banco"),
  chavePix: z.string().min(11, "CPF deve ter pelo menos 11 dígitos").max(11, "CPF deve ter no máximo 11 dígitos"),
});

type ContatoFormValues = z.infer<typeof contatoSchema>;
type CodigoFormValues = z.infer<typeof codigoSchema>;
type DadosBancariosFormValues = z.infer<typeof dadosBancariosSchema>;

export default function Confirmacao() {
  const [location] = useLocation();
  const [etapa, setEtapa] = useState<"contato" | "codigo" | "bancarios" | "confirmacao">("contato");
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(30);
  const [tentativasRestantes, setTentativasRestantes] = useState(3);
  const [codigoInvalido, setCodigoInvalido] = useState(false);
  const [valorRestituicao, setValorRestituicao] = useState("R$ 0,00");
  const [podeReenviar, setPodeReenviar] = useState(false);
  const [telefoneConfirmado, setTelefoneConfirmado] = useState("");
  const [emailConfirmado, setEmailConfirmado] = useState("");
  const [bancoSelecionado, setBancoSelecionado] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [animacaoAtiva, setAnimacaoAtiva] = useState(false);
  const [codigoJaReinviado, setCodigoJaReinviado] = useState(false);

  const { toast } = useToast();

  // Extrair parâmetros da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nome = params.get("nome") || "";
    const valor = params.get("valor") || "0";
    
    setNomeUsuario(nome.split(" ")[0]);
    
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

  // Formulário de código
  const codigoForm = useForm<CodigoFormValues>({
    resolver: zodResolver(codigoSchema),
    defaultValues: {
      codigo: "",
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

  // Temporizador para reenvio de código
  useEffect(() => {
    let intervalo: NodeJS.Timeout;
    
    if (codigoEnviado && tempoRestante > 0) {
      intervalo = setInterval(() => {
        setTempoRestante((tempo) => {
          if (tempo <= 1) {
            setPodeReenviar(true);
            return 0;
          }
          return tempo - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [codigoEnviado, tempoRestante]);

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

  // Função para enviar o código SMS
  const enviarCodigoSMS = async (telefone: string) => {
    console.log(`Enviando SMS para ${telefone}`);

    // Gerar um código de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
      // Token de autenticação para a API
      const TOKEN = "eb50f988-1fa0-4982-962c-6247b89e11c3";
      
      // API URL conforme documentação
      const API_URL = `https://sms.aresfun.com/v1/integration/${TOKEN}/send-sms`;
      
      // Corpo da requisição conforme documentação
      const payload = {
        to: [telefone], // Array de telefones (até 400 por requisição)
        message: `Seu código de verificação para restituição de ICMS é: ${codigo}`,
        from: "ICMS-BR"  // Opcional, identificador do remetente
      };
      
      try {
        // Tentativa real de envio (comentada para desenvolvimento)
        // const response = await fetch(API_URL, {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json'
        //   },
        //   body: JSON.stringify(payload)
        // });
        
        // Simulação para ambiente de desenvolvimento
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Em ambiente de produção, verificaríamos a resposta
        // if (!response.ok) {
        //   throw new Error(`Erro no envio de SMS: ${response.status}`);
        // }
        
        console.log(`Código SMS enviado: ${codigo}`);
        return codigo;
        
      } catch (apiError) {
        console.error("Erro na API de SMS:", apiError);
        return codigo; // Retornamos o código mesmo em caso de erro
      }
      
    } catch (error) {
      console.error("Erro no envio de SMS:", error);
      return codigo; // Retornamos o código para o fluxo continuar
    }
  };

  // Enviar código e ir para próxima etapa
  const onSubmitContato = async (data: ContatoFormValues) => {
    try {
      // Animação de transição
      setAnimacaoAtiva(true);
      
      // Enviar código para o telefone
      await enviarCodigoSMS(data.telefone);
      
      // Atualizar estado
      setCodigoEnviado(true);
      setTempoRestante(30);
      setPodeReenviar(false);
      setTelefoneConfirmado(data.telefone);
      setEmailConfirmado(data.email);
      
      // Ir para próxima etapa com atraso para animação
      setTimeout(() => {
        setEtapa("codigo");
        setAnimacaoAtiva(false);
      }, 300);
      
      // Mostrar toast
      toast({
        title: "Código enviado!",
        description: `Enviamos um código de verificação para ${formatarTelefone(data.telefone)}`,
      });
    } catch (error) {
      setAnimacaoAtiva(false);
      toast({
        variant: "destructive",
        title: "Erro ao enviar código",
        description: "Não foi possível enviar o código. Tente novamente.",
      });
    }
  };

  // Verificar código e ir para próxima etapa
  const onSubmitCodigo = (data: CodigoFormValues) => {
    // Aqui seria a verificação com a API
    // Para teste, vamos aceitar qualquer código
    const codigoCorreto = true; // Simulando código correto
    
    // Animação de transição
    setAnimacaoAtiva(true);
    
    if (codigoCorreto) {
      setTimeout(() => {
        setEtapa("bancarios");
        setCodigoInvalido(false);
        setAnimacaoAtiva(false);
      }, 300);
    } else {
      setTimeout(() => {
        setAnimacaoAtiva(false);
      }, 300);
      
      setCodigoInvalido(true);
      setTentativasRestantes((prev) => prev - 1);
      
      if (tentativasRestantes <= 1) {
        // Se acabarem as tentativas, vai para os dados bancários mesmo assim
        toast({
          variant: "destructive",
          title: "Limite de tentativas excedido",
          description: "Você pode continuar o processo e validar seu telefone mais tarde.",
        });
        setEtapa("bancarios");
      } else {
        toast({
          variant: "destructive",
          title: "Código inválido",
          description: `Você tem mais ${tentativasRestantes - 1} tentativas.`,
        });
      }
    }
  };

  // Reenviar código
  const reenviarCodigo = async () => {
    if (!podeReenviar) return;
    
    try {
      await enviarCodigoSMS(telefoneConfirmado);
      setTempoRestante(30);
      setPodeReenviar(false);
      setCodigoJaReinviado(true); // Marca que o código já foi reenviado
      
      toast({
        title: "Código reenviado!",
        description: `Enviamos um novo código de verificação para ${formatarTelefone(telefoneConfirmado)}`,
      });
    } catch (error) {
      setCodigoJaReinviado(true); // Mesmo em caso de erro, permitimos pular
      toast({
        variant: "destructive",
        title: "Erro ao reenviar código",
        description: "Não foi possível reenviar o código. Tente novamente ou pule esta etapa.",
      });
    }
  };

  // Pular verificação de código
  const pularVerificacao = () => {
    // Animação de transição
    setAnimacaoAtiva(true);
    
    setTimeout(() => {
      setEtapa("bancarios");
      setAnimacaoAtiva(false);
    }, 300);
    
    toast({
      title: "Verificação pulada",
      description: "Você poderá validar seu telefone mais tarde.",
    });
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
      window.location.href = "/sucesso?nome=" + encodeURIComponent(nomeUsuario);
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
                              placeholder="DDD + Número (ex: 11999999999)"
                              type="tel"
                              maxLength={11}
                              inputMode="numeric"
                              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Enviaremos um código para confirmar seu número
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

      case "codigo":
        return (
          <div className={classeAnimacao}>
            <div className="mb-4 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
              <div className="flex items-start">
                <Smartphone className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-blue-700 font-semibold">Verificação de segurança</h3>
                  <p className="text-blue-600 text-sm mt-1">
                    Enviamos um código de verificação para seu celular{" "}
                    <span className="font-semibold">
                      {formatarTelefone(telefoneConfirmado)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <Form {...codigoForm}>
              <form onSubmit={codigoForm.handleSubmit(onSubmitCodigo)} className="space-y-6">
                <FormField
                  control={codigoForm.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--gov-blue-dark)] font-semibold">Digite o código de 6 dígitos</FormLabel>
                      <FormControl>
                        <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-[var(--gov-blue)] focus-within:border-[var(--gov-blue)] transition-all">
                          <Lock className="ml-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Código de verificação"
                            inputMode="numeric"
                            maxLength={6}
                            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-center font-bold letter-spacing-wide"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-center text-sm text-[var(--gov-gray-dark)]">
                  {podeReenviar ? (
                    <Button
                      variant="link"
                      className="p-0 h-auto text-[var(--gov-blue)]"
                      onClick={reenviarCodigo}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reenviar código
                    </Button>
                  ) : (
                    <div className="flex items-center text-[var(--gov-gray-dark)]">
                      <Clock className="h-3 w-3 mr-1" />
                      Reenviar código em {tempoRestante}s
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-6">
                  {codigoJaReinviado ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-[var(--gov-gray-dark)] hover:text-[var(--gov-blue)] transition-colors"
                      onClick={pularVerificacao}
                    >
                      Pular esta etapa
                    </Button>
                  ) : (
                    <div></div> // Espaço vazio quando não for mostrar o botão
                  )}
                  <Button 
                    type="submit" 
                    className="bg-[var(--gov-blue)] hover:bg-[var(--gov-blue)]/90 text-white font-semibold px-6 transition-all"
                  >
                    Verificar código
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
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-blue-100 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-4 flex items-center">
                <CircleDollarSign className="h-5 w-5 mr-2 text-green-500" />
                Resumo da Solicitação
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-blue-100">
                  <span className="text-[var(--gov-gray-dark)]">Email:</span>
                  <span className="font-medium text-[var(--gov-blue-dark)]">{emailConfirmado}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-blue-100">
                  <span className="text-[var(--gov-gray-dark)]">Telefone:</span>
                  <span className="font-medium text-[var(--gov-blue-dark)]">{formatarTelefone(telefoneConfirmado)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-blue-100">
                  <span className="text-[var(--gov-gray-dark)]">Banco:</span>
                  <span className="font-medium text-[var(--gov-blue-dark)]">{bancoSelecionado}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-blue-100">
                  <span className="text-[var(--gov-gray-dark)]">Chave PIX:</span>
                  <span className="font-medium text-[var(--gov-blue-dark)]">{formatarCPF(chavePix)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[var(--gov-gray-dark)]">Valor a receber:</span>
                  <span className="font-bold text-xl text-green-600">{valorRestituicao}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-yellow-700">
                  Ao confirmar, você declara que as informações fornecidas são verdadeiras e concorda
                  com os termos do processo de restituição do ICMS cobrado indevidamente.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center mt-8">
              <Button 
                onClick={finalizarProcesso}
                className="bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] font-bold py-6 px-8 text-lg rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Confirmar e Finalizar
              </Button>
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
                <div className="inline-block bg-green-100 text-green-800 rounded-full px-4 py-1 text-sm mb-2">
                  Restituição ICMS
                </div>
                <h1 className="text-2xl font-bold text-[var(--gov-blue-dark)] mb-2">
                  Olá {nomeUsuario}, você está quase lá!
                </h1>
                <p className="text-[var(--gov-gray-dark)]">
                  Complete suas informações para receber sua restituição no valor de:
                </p>
                <div className="mt-2 inline-block bg-green-50 border border-green-200 rounded-lg px-6 py-3">
                  <span className="text-3xl font-bold text-green-600">{valorRestituicao}</span>
                </div>
              </div>

              {/* Progresso visual destacado */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--gov-blue-light)]/10 to-[var(--gov-yellow)]/10 rounded-lg"></div>
                <div className="relative p-4">
                  <div className="flex items-center justify-between">
                    {["contato", "codigo", "bancarios", "confirmacao"].map((step, index) => (
                      <div key={index} className="flex flex-col items-center relative">
                        <div 
                          className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                            ["contato", "codigo", "bancarios", "confirmacao"].indexOf(etapa) >= index 
                              ? "bg-[var(--gov-blue)] text-white shadow-md" 
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {["contato", "codigo", "bancarios", "confirmacao"].indexOf(etapa) > index ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>
                        {index < 3 && (
                          <div 
                            className={`absolute top-5 w-full h-[2px] left-1/2 transition-all duration-500 ${
                              ["contato", "codigo", "bancarios", "confirmacao"].indexOf(etapa) > index 
                              ? "bg-[var(--gov-blue)]" 
                              : "bg-gray-200"
                            }`}
                            style={{ width: 'calc(100% - 2.5rem)' }}
                          ></div>
                        )}
                        <span className={`text-sm mt-2 transition-all duration-300 ${
                          ["contato", "codigo", "bancarios", "confirmacao"].indexOf(etapa) >= index 
                            ? "text-[var(--gov-blue-dark)] font-medium" 
                            : "text-gray-500"
                        }`}>
                          {index === 0 ? "Contato" : 
                          index === 1 ? "Verificação" : 
                          index === 2 ? "Dados Bancários" : "Confirmação"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Conteúdo da etapa atual */}
              <div className="bg-white rounded-lg border border-[var(--gov-gray)] p-6">
                <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-6 pb-3 border-b border-gray-100">
                  {etapa === "contato" && "Preencha seus dados de contato"}
                  {etapa === "codigo" && "Verifique seu telefone"}
                  {etapa === "bancarios" && "Informe seus dados bancários"}
                  {etapa === "confirmacao" && "Confirme suas informações"}
                </h2>
                
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