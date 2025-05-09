import React, { createContext, useContext, useState, ReactNode } from 'react';

// Interface que define os dados do usuário
export interface UserData {
  cpf: string;
  nome: string;
  dataNascimento: string;
  estado: string;
  companhia: string;
  ip: string;
  valorConta?: number;
  periodo?: number;
  email?: string;
  telefone?: string;
  valorRestituicao?: number;
  pagamentoId?: string;
  dataPagamento?: string;
  valorTaxaConformidade?: number;
  valorTaxaLAR?: number;
  protocolo?: string;
  dataPrevista?: string; // Data prevista para recebimento da restituição
  larCompleto?: boolean; // Indica se o pagamento LAR foi concluído
  acelerado?: boolean; // Indica se a restituição será acelerada
  statusDefinido?: boolean; // Flag para evitar loop infinito de renderização
  contaBancaria?: {
    banco: string;
    agencia: string;
    conta: string;
    tipo: string;
  };
}

// Interface do contexto
interface UserContextType {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
  clearUserData: () => void;
}

// Criando o contexto
const UserContext = createContext<UserContextType | undefined>(undefined);

// Valores iniciais vazios
const initialUserData: UserData = {
  cpf: '',
  nome: '',
  dataNascimento: '',
  estado: '',
  companhia: '',
  ip: '',
};

// Provider Component
export function UserProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<UserData>(initialUserData);

  // Função para atualizar dados do usuário (parcialmente)
  const updateUserData = (data: Partial<UserData>) => {
    setUserData(prevData => {
      // Novo estado que será definido
      const newData = {
        ...prevData,
        ...data
      };
      
      // Para fins de debug - registra os dados atualizados no console (sem dados sensíveis)
      console.log('Dados do usuário atualizados:', {
        ...newData,
        cpf: newData.cpf ? `***.**.***.${newData.cpf.substring(newData.cpf.length - 2)}` : '',
        nome: newData.nome ? `${newData.nome.split(' ')[0]} ***` : '',
        ip: newData.ip ? "***.***.***.**" : '',
        telefone: newData.telefone ? "(**) *.****-**" + newData.telefone.substring(newData.telefone.length - 2) : '',
        email: newData.email ? "***@" + (newData.email.split('@')[1] || 'dominio.com') : '',
      });
      
      return newData;
    });
  };

  // Função para limpar todos os dados do usuário
  const clearUserData = () => {
    setUserData(initialUserData);
  };

  return (
    <UserContext.Provider value={{ userData, updateUserData, clearUserData }}>
      {children}
    </UserContext.Provider>
  );
}

// Hook personalizado para usar o contexto
export function useUserData() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserData deve ser usado dentro de um UserProvider');
  }
  return context;
}