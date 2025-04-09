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
import { CheckCircle2, Clock, RefreshCw, AlertCircle, Lock, Smartphone, CreditCard } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Lista de bancos brasileiros
const bancosBrasileiros = [
  { id: "001", nome: "Banco do Brasil" },
  { id: "033", nome: "Banco Santander" },
  { id: "104", nome: "Caixa Econômica Federal" },
  { id: "237", nome: "Banco Bradesco" },
  { id: "341", nome: "Itaú Unibanco" },
  { id: "077", nome: "Banco Inter" },
  { id: "260", nome: "Nubank" },
  { id: "336", nome: "C6 Bank" },
  { id: "212", nome: "Banco Original" },
  { id: "756", nome: "Banco Cooperativo do Brasil (SICOOB)" },
  { id: "748", nome: "Banco Cooperativo Sicredi" },
  { id: "655", nome: "Banco Votorantim" },
  { id: "041", nome: "Banrisul" },
  { id: "389", nome: "Banco Mercantil do Brasil" },
  { id: "422", nome: "Banco Safra" },
  { id: "025", nome: "Banco Alfa" },
  { id: "208", nome: "BTG Pactual" },
  { id: "021", nome: "Banestes" },
  { id: "070", nome: "BRB - Banco de Brasília" },
  { id: "085", nome: "Cooperativa Central de Crédito Urbano - CECRED" },
  { id: "136", nome: "Unicred" },
  { id: "623", nome: "Banco Pan" },
  { id: "656", nome: "Neon Pagamentos" },
  { id: "290", nome: "PagBank" },
  { id: "197", nome: "Stone Pagamentos" },
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

  const { toast } = useToast();

  // Extrair parâmetros da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nome = params.get("nome") || "";
    const valor = params.get("valor") || "0";
    
    // Formatar o valor para exibição
    const valorNumerico = parseFloat(valor);
    setValorRestituicao(
      valorNumerico.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    );
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
  const enviarCodigoSMS = (telefone: string) => {
    // Aqui seria a chamada para API de envio de SMS
    // Simulamos com um log e uma resposta de sucesso após 1 segundo
    console.log(`Enviando código para ${telefone}`);
    
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`Código gerado: ${codigo}`);
        resolve(codigo);
      }, 1000);
    });
  };

  // Enviar código e ir para próxima etapa
  const onSubmitContato = async (data: ContatoFormValues) => {
    try {
      // Enviar código para o telefone
      await enviarCodigoSMS(data.telefone);
      
      // Atualizar estado
      setCodigoEnviado(true);
      setTempoRestante(30);
      setPodeReenviar(false);
      setTelefoneConfirmado(data.telefone);
      setEmailConfirmado(data.email);
      
      // Ir para próxima etapa
      setEtapa("codigo");
      
      // Mostrar toast
      toast({
        title: "Código enviado!",
        description: `Enviamos um código de verificação para ${formatarTelefone(data.telefone)}`,
      });
    } catch (error) {
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
    
    if (codigoCorreto) {
      setEtapa("bancarios");
      setCodigoInvalido(false);
    } else {
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
      
      toast({
        title: "Código reenviado!",
        description: `Enviamos um novo código de verificação para ${formatarTelefone(telefoneConfirmado)}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao reenviar código",
        description: "Não foi possível reenviar o código. Tente novamente.",
      });
    }
  };

  // Pular verificação de código
  const pularVerificacao = () => {
    setEtapa("bancarios");
    
    toast({
      title: "Verificação pulada",
      description: "Você poderá validar seu telefone mais tarde.",
    });
  };

  // Submeter dados bancários
  const onSubmitDadosBancarios = (data: DadosBancariosFormValues) => {
    setBancoSelecionado(
      bancosBrasileiros.find((banco) => banco.id === data.banco)?.nome || ""
    );
    setChavePix(data.chavePix);
    setEtapa("confirmacao");
  };

  // Finalizar processo
  const finalizarProcesso = () => {
    window.location.href = "/sucesso"; // Redirecionar para página de sucesso
  };

  // Obter nome do usuário
  const obterNome = () => {
    const params = new URLSearchParams(window.location.search);
    const nome = params.get("nome") || "Cliente";
    
    // Retorna apenas o primeiro nome
    return nome.split(" ")[0];
  };

  // Renderizar etapas
  const renderEtapa = () => {
    switch (etapa) {
      case "contato":
        return (
          <Form {...contatoForm}>
            <form onSubmit={contatoForm.handleSubmit(onSubmitContato)} className="space-y-6">
              <div className="space-y-4">
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
                          className="border-[var(--gov-gray)] focus:border-[var(--gov-blue)]"
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
                        <Input
                          placeholder="DDD + Número (ex: 11999999999)"
                          type="tel"
                          maxLength={11}
                          inputMode="numeric"
                          className="border-[var(--gov-gray)] focus:border-[var(--gov-blue)]"
                          {...field}
                        />
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
                  className="bg-[var(--gov-blue)] hover:bg-[var(--gov-blue)]/90 text-white font-semibold px-6"
                >
                  Continuar
                </Button>
              </div>
            </form>
          </Form>
        );

      case "codigo":
        return (
          <div className="space-y-6">
            <Alert variant={codigoInvalido ? "destructive" : "default"} className="bg-blue-50 border-blue-200">
              <Smartphone className="h-4 w-4 text-blue-500" />
              <AlertTitle className="text-blue-700 font-semibold">Verificação de telefone</AlertTitle>
              <AlertDescription className="text-blue-600">
                Enviamos um código de 6 dígitos para{" "}
                <span className="font-semibold">
                  {formatarTelefone(telefoneConfirmado)}
                </span>
              </AlertDescription>
            </Alert>

            <Form {...codigoForm}>
              <form onSubmit={codigoForm.handleSubmit(onSubmitCodigo)} className="space-y-6">
                <FormField
                  control={codigoForm.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--gov-blue-dark)] font-semibold">Código de verificação</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o código de 6 dígitos"
                          inputMode="numeric"
                          maxLength={6}
                          className="border-[var(--gov-gray)] focus:border-[var(--gov-blue)]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-sm text-[var(--gov-gray-dark)]">
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
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-[var(--gov-gray-dark)] hover:text-[var(--gov-blue)]"
                    onClick={pularVerificacao}
                  >
                    Pular verificação
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-[var(--gov-blue)] hover:bg-[var(--gov-blue)]/90 text-white font-semibold px-6"
                  >
                    Verificar
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        );

      case "bancarios":
        return (
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
                          <SelectTrigger className="border-[var(--gov-gray)] focus:border-[var(--gov-blue)]">
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
                        <Input
                          placeholder="Seu CPF sem pontos ou traços"
                          inputMode="numeric"
                          maxLength={11}
                          className="border-[var(--gov-gray)] focus:border-[var(--gov-blue)]"
                          {...field}
                        />
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
                  className="bg-[var(--gov-blue)] hover:bg-[var(--gov-blue)]/90 text-white font-semibold px-6"
                >
                  Continuar
                </Button>
              </div>
            </form>
          </Form>
        );

      case "confirmacao":
        return (
          <div className="space-y-6">
            <div className="bg-[var(--gov-blue-light)]/10 border border-[var(--gov-blue-light)]/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-[var(--gov-blue-dark)] mb-3">Resumo dos dados</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[var(--gov-gray-dark)]">Email:</span>
                  <span className="font-medium">{emailConfirmado}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--gov-gray-dark)]">Telefone:</span>
                  <span className="font-medium">{formatarTelefone(telefoneConfirmado)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--gov-gray-dark)]">Banco:</span>
                  <span className="font-medium">{bancoSelecionado}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--gov-gray-dark)]">Chave PIX:</span>
                  <span className="font-medium">{formatarCPF(chavePix)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--gov-gray-dark)]">Valor a receber:</span>
                  <span className="font-medium text-green-600">{valorRestituicao}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-yellow-700">
                  Ao confirmar, você declara que as informações fornecidas são verdadeiras e concorda
                  com os termos do processo de restituição.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center mt-6">
              <Button 
                onClick={finalizarProcesso}
                className="bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] font-bold py-6 px-8 text-lg"
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
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-[var(--gov-blue-dark)] mb-2">
                  {obterNome()}, você está quase lá!
                </h1>
                <p className="text-[var(--gov-gray-dark)]">
                  Para finalizar o processo de restituição, precisamos confirmar alguns dados.
                </p>
              </div>

              {/* Etapas de forma semelhante ao SimuladorICMS */}
              <div className="flex items-center justify-between mb-8">
                {["contato", "codigo", "bancarios", "confirmacao"].map((step, index) => (
                  <div key={index} className="flex flex-col items-center relative">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                        ["contato", "codigo", "bancarios", "confirmacao"].indexOf(etapa) >= index 
                          ? "bg-[var(--gov-blue)] text-white" 
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {["contato", "codigo", "bancarios", "confirmacao"].indexOf(etapa) > index ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    {index < 3 && (
                      <div 
                        className={`absolute top-4 w-full h-[2px] left-1/2 ${
                          ["contato", "codigo", "bancarios", "confirmacao"].indexOf(etapa) > index ? "bg-[var(--gov-blue)]" : "bg-gray-200"
                        }`}
                        style={{ width: 'calc(100% - 2rem)' }}
                      ></div>
                    )}
                    <span className={`text-xs mt-2 ${
                      ["contato", "codigo", "bancarios", "confirmacao"].indexOf(etapa) >= index ? "text-[var(--gov-blue-dark)] font-medium" : "text-gray-500"
                    }`}>
                      {index === 0 ? "Contato" : 
                      index === 1 ? "Verificação" : 
                      index === 2 ? "Banco" : "Resumo"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Resumo do valor */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center mb-6">
                <p className="text-[var(--gov-gray-dark)] mb-2">Valor da sua restituição:</p>
                <div className="flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mr-2" />
                  <span className="text-3xl font-bold text-green-600">{valorRestituicao}</span>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-blue-600 text-sm">
                    <span className="font-semibold">Importante:</span> A restituição será processada após a confirmação
                    de todos os seus dados, através de transferência via PIX.
                  </p>
                </div>
              </div>

              {/* Conteúdo da etapa atual */}
              <div className="bg-white rounded-lg border border-[var(--gov-gray)] p-6">
                <h2 className="text-xl font-semibold text-[var(--gov-blue-dark)] mb-4">
                  {etapa === "contato" && "Confirme seus dados de contato"}
                  {etapa === "codigo" && "Verifique seu telefone"}
                  {etapa === "bancarios" && "Dados bancários para recebimento"}
                  {etapa === "confirmacao" && "Confirmação dos dados"}
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