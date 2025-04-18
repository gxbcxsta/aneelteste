// Script para testar a detecção de IP da Paraíba
// Execute este script no console do navegador na página do aplicativo

// Função para simular um usuário da Paraíba
function simularUsuarioParaiba() {
  // 1. Limpar qualquer localização armazenada no localStorage
  localStorage.removeItem('localizacao');
  
  // 2. Simular uma resposta de API para a Paraíba
  const localizacaoParaiba = {
    ip: "177.200.100.123", // IP fictício
    estado: "Paraíba",
    detalhes: {
      countryCode: "BR",
      regionName: "Paraíba",
      regionCode: "PB"
    },
    timestamp: Date.now()
  };
  
  // 3. Armazenar no localStorage
  localStorage.setItem('localizacao', JSON.stringify(localizacaoParaiba));
  
  // 4. Acessar o contexto do usuário e atualizar o estado
  if (window.userContextForTest) {
    window.userContextForTest.updateUserData({
      estado: "Paraíba"
    });
    console.log("Estado do usuário atualizado para Paraíba");
  } else {
    // Tentar encontrar o contexto de usuário através de outra abordagem
    console.log("Não foi possível acessar o contexto do usuário diretamente");
    console.log("Localização da Paraíba configurada no localStorage");
    console.log("Recarregue a página para aplicar as mudanças");
  }
  
  // 5. Informar ao usuário
  console.log("Simulação de usuário da Paraíba configurada");
  console.log("Estado definido como: Paraíba");
  console.log("Companhias elétricas que devem aparecer:");
  console.log("✓ Energisa Paraíba (opção válida/correta)");
  console.log("✓ Neoenergia Pernambuco (opção adicional)");
  console.log("✓ Equatorial Alagoas (opção adicional)");
}

// Executar a simulação
simularUsuarioParaiba();