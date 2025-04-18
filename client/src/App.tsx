import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import ScrollToTop from "@/components/ScrollToTop";
import LocalizacaoDetector from "@/components/LocalizacaoDetector";
import Rastreamento from "@/components/Rastreamento";
import NotificacaoSmsMonitor from "@/components/NotificacaoSmsMonitor";
import { UserProvider } from "./contexts/UserContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import VerificarRestituicao from "@/pages/VerificarRestituicao";
import ConfirmarIdentidade from "@/pages/ConfirmarIdentidade";
import Resultado from "@/pages/Resultado";
import PaginaSimuladorICMS from "@/pages/SimuladorICMS";
import Calculo from "@/pages/Calculo";
import Confirmacao from "@/pages/Confirmacao";
import PagamentoPix from "@/pages/PagamentoPix";
import Sucesso from "@/pages/Sucesso";
import SucessoPadrao from "@/pages/SucessoPadrao";
import ResultadoCalculo from "@/pages/ResultadoCalculo";
import ConfirmacaoRestituicao from "@/pages/ConfirmacaoRestituicao";
import TaxaComplementar from "@/pages/TaxaComplementar";
import PagamentoTCN from "@/pages/PagamentoTCN";
import TaxaLAR from "@/pages/TaxaLAR";
import PagamentoLAR from "@/pages/PagamentoLAR";
import DebugDetectorIp from "./debug/DebugDetectorIp";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import TesteParaibaPage from "@/pages/TesteParaibaPage";

function Router() {
  return (
    <>
      <Switch>
        {/* Rotas públicas - acessíveis sem CPF */}
        <Route path="/" component={Home}/>
        <Route path="/verificar" component={VerificarRestituicao}/>
        <Route path="/admin" component={Admin}/>
        <Route path="/admin-login" component={AdminLogin}/>
        
        {/* Rotas protegidas - exigem CPF */}
        <Route path="/confirmar-identidade">
          <ProtectedRoute>
            <ConfirmarIdentidade />
          </ProtectedRoute>
        </Route>
        
        <Route path="/resultado">
          <ProtectedRoute>
            <Resultado />
          </ProtectedRoute>
        </Route>
        
        <Route path="/calculo">
          <ProtectedRoute>
            <Calculo />
          </ProtectedRoute>
        </Route>
        
        <Route path="/simulador-icms">
          <ProtectedRoute>
            <PaginaSimuladorICMS />
          </ProtectedRoute>
        </Route>
        
        <Route path="/confirmacao">
          <ProtectedRoute>
            <Confirmacao />
          </ProtectedRoute>
        </Route>
        
        <Route path="/pagamento">
          <ProtectedRoute>
            <PagamentoPix />
          </ProtectedRoute>
        </Route>
        
        <Route path="/taxa-complementar">
          <ProtectedRoute>
            <TaxaComplementar />
          </ProtectedRoute>
        </Route>
        
        <Route path="/pagamento-tcn">
          <ProtectedRoute>
            <PagamentoTCN />
          </ProtectedRoute>
        </Route>
        
        <Route path="/taxa-lar">
          <ProtectedRoute>
            <TaxaLAR />
          </ProtectedRoute>
        </Route>
        
        <Route path="/pagamento-lar">
          <ProtectedRoute>
            <PagamentoLAR />
          </ProtectedRoute>
        </Route>
        
        <Route path="/sucesso">
          <ProtectedRoute>
            <Sucesso />
          </ProtectedRoute>
        </Route>
        
        <Route path="/sucesso-padrao">
          <ProtectedRoute>
            <SucessoPadrao />
          </ProtectedRoute>
        </Route>
        
        <Route path="/resultado-calculo">
          <ProtectedRoute>
            <ResultadoCalculo />
          </ProtectedRoute>
        </Route>
        
        <Route path="/confirmacao-restituicao">
          <ProtectedRoute>
            <ConfirmacaoRestituicao />
          </ProtectedRoute>
        </Route>
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <ScrollToTop />
        <LocalizacaoDetector />
        <Rastreamento />
        <NotificacaoSmsMonitor />
        <Router />
        <Toaster />
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
