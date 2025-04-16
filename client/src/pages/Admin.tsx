import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, Info, Search, ChevronRight, AlertTriangle } from "lucide-react";

// Interfaces para os dados da API
interface Visitante {
  id: number;
  cpf: string;
  nome?: string;
  telefone?: string;
  primeiro_acesso: string;
  ultimo_acesso: string;
  ip?: string;
  navegador?: string;
  sistema_operacional?: string;
}

interface PaginaVisitada {
  id: number;
  visitante_id: number;
  url: string;
  pagina: string;
  timestamp: string;
  referrer?: string;
  dispositivo?: string;
}

interface EstatisticaPagina {
  pagina: string;
  total: number;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('visitantes');
  const [selectedVisitante, setSelectedVisitante] = useState<number | null>(null);
  const [searchCpf, setSearchCpf] = useState('');

  // Consulta para obter todos os visitantes
  const {
    data: visitantes,
    isLoading: loadingVisitantes,
    error: visitantesError,
    refetch: refetchVisitantes
  } = useQuery({
    queryKey: ['/api/rastreamento/visitantes'],
    enabled: activeTab === 'visitantes'
  });

  // Consulta para obter páginas visitadas pelo visitante selecionado
  const {
    data: paginasVisitadas,
    isLoading: loadingPaginas,
    error: paginasError,
    refetch: refetchPaginas
  } = useQuery({
    queryKey: ['/api/rastreamento/visitante', selectedVisitante, 'paginas'],
    queryFn: async () => {
      if (!selectedVisitante) return null;
      const res = await fetch(`/api/rastreamento/visitante/${selectedVisitante}/paginas`);
      if (!res.ok) throw new Error('Erro ao buscar páginas visitadas');
      return res.json();
    },
    enabled: !!selectedVisitante
  });

  // Consulta para obter estatísticas de páginas
  const {
    data: estatisticas,
    isLoading: loadingEstatisticas,
    error: estatisticasError,
    refetch: refetchEstatisticas
  } = useQuery({
    queryKey: ['/api/rastreamento/estatisticas/paginas'],
    enabled: activeTab === 'estatisticas'
  });

  // Formatar CPF
  const formatarCpf = (cpf: string) => {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Formatar data
  const formatarData = (dataString: string) => {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR');
  };

  // Função para filtrar visitantes pelo CPF
  const filtrarVisitantesPorCpf = () => {
    if (!visitantes || !Array.isArray(visitantes)) return [];
    
    if (!searchCpf.trim()) return visitantes;
    
    const cpfLimpo = searchCpf.replace(/\D/g, '');
    return visitantes.filter((v: Visitante) => 
      v.cpf.includes(cpfLimpo) || 
      (v.nome && v.nome.toLowerCase().includes(searchCpf.toLowerCase()))
    );
  };

  // Atualizar os dados ao mudar de tab
  useEffect(() => {
    if (activeTab === 'visitantes') {
      refetchVisitantes();
    } else if (activeTab === 'estatisticas') {
      refetchEstatisticas();
    }
    
    // Limpar seleção ao mudar de tab
    setSelectedVisitante(null);
  }, [activeTab, refetchVisitantes, refetchEstatisticas]);

  // Efeito para buscar páginas quando um visitante é selecionado
  useEffect(() => {
    if (selectedVisitante) {
      refetchPaginas();
    }
  }, [selectedVisitante, refetchPaginas]);

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="mb-8">
        <CardHeader className="bg-blue-50 border-b">
          <CardTitle className="text-2xl font-bold text-blue-900">
            Painel Administrativo
          </CardTitle>
          <CardDescription>
            Visualize dados de rastreamento de usuários e estatísticas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs
            defaultValue="visitantes"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-6 grid grid-cols-2 md:w-[400px]">
              <TabsTrigger value="visitantes">Visitantes</TabsTrigger>
              <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
            </TabsList>
            
            {/* Tab de Visitantes */}
            <TabsContent value="visitantes" className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Input
                    placeholder="Buscar por CPF ou nome"
                    value={searchCpf}
                    onChange={(e) => setSearchCpf(e.target.value)}
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <Button
                  onClick={() => refetchVisitantes()}
                  variant="outline"
                >
                  Atualizar
                </Button>
              </div>
              
              {loadingVisitantes ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : visitantesError ? (
                <Alert variant="destructive">
                  <AlertTitle>Erro ao carregar visitantes</AlertTitle>
                  <AlertDescription>
                    Ocorreu um erro ao buscar os dados. Tente novamente.
                  </AlertDescription>
                </Alert>
              ) : !visitantes || !Array.isArray(visitantes) || visitantes.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Nenhum visitante encontrado</AlertTitle>
                  <AlertDescription>
                    Não há visitantes registrados no sistema.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>Lista de visitantes rastreados</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CPF</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Primeiro Acesso</TableHead>
                        <TableHead>Último Acesso</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtrarVisitantesPorCpf().map((visitante: Visitante) => (
                        <TableRow 
                          key={visitante.id}
                          className={
                            selectedVisitante === visitante.id
                              ? "bg-blue-50"
                              : undefined
                          }
                        >
                          <TableCell>{formatarCpf(visitante.cpf)}</TableCell>
                          <TableCell>{visitante.nome || 'N/A'}</TableCell>
                          <TableCell>{visitante.telefone || 'N/A'}</TableCell>
                          <TableCell>{formatarData(visitante.primeiro_acesso)}</TableCell>
                          <TableCell>{formatarData(visitante.ultimo_acesso)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => setSelectedVisitante(
                                selectedVisitante === visitante.id ? null : visitante.id
                              )}
                              variant={selectedVisitante === visitante.id ? "default" : "outline"}
                            >
                              {selectedVisitante === visitante.id ? "Fechar" : "Ver Detalhes"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Detalhes do visitante selecionado */}
              {selectedVisitante && (
                <Card className="mt-8">
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="text-lg">
                      Páginas Visitadas
                    </CardTitle>
                    <CardDescription>
                      Histórico de navegação do visitante selecionado
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    {loadingPaginas ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-10 w-full" />
                        ))}
                      </div>
                    ) : paginasError ? (
                      <Alert variant="destructive">
                        <AlertTitle>Erro ao carregar histórico</AlertTitle>
                        <AlertDescription>
                          Ocorreu um erro ao buscar o histórico de navegação.
                        </AlertDescription>
                      </Alert>
                    ) : !paginasVisitadas || !Array.isArray(paginasVisitadas) || paginasVisitadas.length === 0 ? (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Nenhuma página visitada</AlertTitle>
                        <AlertDescription>
                          Este visitante ainda não acessou nenhuma página.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Página</TableHead>
                              <TableHead>URL</TableHead>
                              <TableHead>Data/Hora</TableHead>
                              <TableHead>Dispositivo</TableHead>
                              <TableHead>Referrer</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginasVisitadas.map((pagina: PaginaVisitada) => (
                              <TableRow key={pagina.id}>
                                <TableCell className="font-medium">{pagina.pagina}</TableCell>
                                <TableCell className="text-sm truncate max-w-[200px]">{pagina.url}</TableCell>
                                <TableCell>{formatarData(pagina.timestamp)}</TableCell>
                                <TableCell>{pagina.dispositivo || 'N/A'}</TableCell>
                                <TableCell className="text-sm truncate max-w-[200px]">{pagina.referrer || 'N/A'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Tab de Estatísticas */}
            <TabsContent value="estatisticas">
              <Card>
                <CardHeader className="bg-gray-50">
                  <CardTitle className="text-lg">
                    Estatísticas de Visualização de Páginas
                  </CardTitle>
                  <CardDescription>
                    Total de visualizações por página
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {loadingEstatisticas ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : estatisticasError ? (
                    <Alert variant="destructive">
                      <AlertTitle>Erro ao carregar estatísticas</AlertTitle>
                      <AlertDescription>
                        Ocorreu um erro ao buscar os dados. Tente novamente.
                      </AlertDescription>
                    </Alert>
                  ) : !estatisticas || !Array.isArray(estatisticas) || estatisticas.length === 0 ? (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Nenhuma estatística disponível</AlertTitle>
                      <AlertDescription>
                        Não há dados de visualização de páginas registrados.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableCaption>Total de visualizações por página</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Página</TableHead>
                            <TableHead className="text-right">Total de Visualizações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {estatisticas.map((estatistica: EstatisticaPagina, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{estatistica.pagina}</TableCell>
                              <TableCell className="text-right">{estatistica.total}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}