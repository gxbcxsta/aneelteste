import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import VerificarRestituicao from "@/pages/VerificarRestituicao";
import Resultado from "@/pages/Resultado";
import Confirmacao from "@/pages/Confirmacao";
import PagamentoPix from "@/pages/PagamentoPix";
import Sucesso from "@/pages/Sucesso";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/verificar" component={VerificarRestituicao}/>
      <Route path="/resultado" component={Resultado}/>
      <Route path="/confirmacao" component={Confirmacao}/>
      <Route path="/pagamento" component={PagamentoPix}/>
      <Route path="/sucesso" component={Sucesso}/>
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
