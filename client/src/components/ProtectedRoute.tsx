import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useUserData } from "@/contexts/UserContext";
import { requireCpf } from "@/utils/SecurityUtils";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Componente para proteger rotas que exigem que o usuário tenha informado o CPF
 * Se o usuário não tiver um CPF no contexto, será redirecionado para a página inicial
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, navigate] = useLocation();
  const { userData } = useUserData();

  useEffect(() => {
    // Verificar se o usuário tem CPF no contexto
    requireCpf(userData, navigate);
  }, [userData, navigate]);

  // Se o usuário tiver CPF, renderiza o conteúdo da página
  // Se não tiver, o useEffect já terá redirecionado para a página inicial
  return <>{userData?.cpf ? children : null}</>;
}