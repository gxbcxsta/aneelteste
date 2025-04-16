import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertCircle } from "lucide-react";

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [, setLocation] = useLocation();

  // Função para validar o login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Verificar se as credenciais estão corretas (hardcoded por segurança básica)
    // Em produção, usar um sistema mais robusto de autenticação
    if (username === 'admin' && password === 'for4energy2025') {
      // Salvar o estado de autenticação no localStorage
      localStorage.setItem('adminAuth', JSON.stringify({
        isAuthenticated: true,
        timestamp: new Date().getTime()
      }));
      
      // Redirecionar para o painel admin
      setLocation('/admin');
    } else {
      setError('Credenciais inválidas. Por favor, tente novamente.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="bg-blue-50 border-b">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-700" />
            <CardTitle className="text-2xl font-bold text-blue-900">
              Acesso Administrativo
            </CardTitle>
          </div>
          <CardDescription>
            Acesso restrito ao painel de administração
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="pt-6 pb-2">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro de autenticação</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="border-t bg-gray-50 px-6 py-4">
            <Button 
              type="submit" 
              className="w-full"
            >
              Entrar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}