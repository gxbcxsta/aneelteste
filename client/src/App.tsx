import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import VerificarRestituicao from "@/pages/VerificarRestituicao";
import ConfirmarIdentidade from "@/pages/ConfirmarIdentidade";
import Resultado from "@/pages/Resultado";
import PaginaSimuladorICMS from "@/pages/SimuladorICMS";
import Confirmacao from "@/pages/Confirmacao";
import PagamentoPix from "@/pages/PagamentoPix";
import Sucesso from "@/pages/Sucesso";
import ResultadoCalculo from "@/pages/ResultadoCalculo";
import ConfirmacaoRestituicao from "@/pages/ConfirmacaoRestituicao";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/verificar" component={VerificarRestituicao}/>
      <Route path="/confirmar-identidade/:cpf" component={ConfirmarIdentidade}/>
      <Route path="/resultado" component={Resultado}/>
      <Route path="/calculo" component={PaginaSimuladorICMS}/>
      <Route path="/confirmacao" component={Confirmacao}/>
      <Route path="/pagamento" component={PagamentoPix}/>
      <Route path="/sucesso" component={Sucesso}/>
      <Route path="/resultado-calculo" component={ResultadoCalculo}/>
      <Route path="/confirmacao-restituicao" component={ConfirmacaoRestituicao}/>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
