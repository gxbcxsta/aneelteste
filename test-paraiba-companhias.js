// Este arquivo contém a lista de companhias elétricas que seriam exibidas para um usuário da Paraíba

// Mapeamento de estados para companhias elétricas conforme o código da aplicação:
const opcoesCompanhiaPorEstado = {
  // Estados com uma única companhia
  "Acre": ["Energisa Acre", "Amazonas Energia", "Equatorial Maranhão"],
  "Alagoas": ["Equatorial Alagoas", "Neoenergia Pernambuco", "Energisa Mato Grosso do Sul"],
  "Amapá": ["CEA Equatorial", "Roraima Energia", "Energisa Rondônia"],
  "Amazonas": ["Amazonas Energia", "Energisa Tocantins", "Equatorial Piauí"],
  "Bahia": ["Neoenergia Coelba", "Energisa Paraíba", "Equatorial Pará"],
  "Ceará": ["Enel Ceará", "Energisa Acre", "CPFL Piratininga"],
  "Distrito Federal": ["Neoenergia Brasília", "Energisa Rondônia", "CPFL Rio Grande Energia (RGE)"],
  "Espírito Santo": ["EDP Espírito Santo", "Neoenergia Pernambuco", "CELESC Distribuição"],
  "Maranhão": ["Equatorial Maranhão", "Enel Distribuição Rio", "Neoenergia Cosern"],
  "Mato Grosso": ["Energisa Mato Grosso", "Neoenergia Coelba", "CPFL Piratininga"],
  "Mato Grosso do Sul": ["Energisa Mato Grosso do Sul", "Equatorial Maranhão", "EDP Espírito Santo"],
  "Paraíba": ["Energisa Paraíba", "Neoenergia Pernambuco", "Equatorial Alagoas"],
  "Paraná": ["Copel Distribuição", "Neoenergia Coelba", "Amazonas Energia"],
  "Pernambuco": ["Neoenergia Pernambuco", "Energisa Mato Grosso", "EDP São Paulo"],
  "Piauí": ["Equatorial Piauí", "CELESC Distribuição", "Neoenergia Brasília"],
  "Rio Grande do Norte": ["Neoenergia Cosern", "Energisa Sergipe", "CEMIG Distribuição"],
  "Rondônia": ["Energisa Rondônia", "Equatorial Goiás", "CEMIG Distribuição"],
  "Roraima": ["Roraima Energia", "Energisa Mato Grosso", "Enel Ceará"],
  "Sergipe": ["Energisa Sergipe", "Enel Distribuição São Paulo", "CEA Equatorial"],
  "Tocantins": ["Energisa Tocantins", "EDP Espírito Santo", "Copel Distribuição"],
  
  // Estados com duas companhias
  "Goiás": ["Equatorial Goiás", "Celg GT (Transmissão e Geração)", "Light S/A"],
  "Pará": ["Equatorial Pará", "Celpa", "Energisa Sergipe"],
  "Rio de Janeiro": ["Light", "Enel Rio", "Neoenergia Coelba"],
  "Rio Grande do Sul": ["CEEE Equatorial", "RGE Sul", "Light S/A"],
  "Santa Catarina": ["Celesc Distribuição", "Cooperativas locais (como CERGAL, CERILUZ, etc.)", "Equatorial Pará"],
  
  // Estados com três companhias
  "Minas Gerais": ["CEMIG Distribuição", "Energisa Minas Gerais", "Light (em pequenas áreas de MG)"],
  
  // Estados com múltiplas companhias
  "São Paulo": [
    "Enel São Paulo", 
    "Enel Distribuição São Paulo", 
    "CPFL Paulista", 
    "CPFL Piratininga", 
    "EDP São Paulo", 
    "Energisa Sul-Sudeste (em parte do interior)"
  ]
};

// Exibir as companhias elétricas para Paraíba
const companhiasParaiba = opcoesCompanhiaPorEstado["Paraíba"];
console.log("Estado: Paraíba");
console.log("Companhias elétricas disponíveis para seleção:");
console.log("1. " + companhiasParaiba[0] + " (única opção válida)");
console.log("2. " + companhiasParaiba[1] + " (opção adicional, não válida)");
console.log("3. " + companhiasParaiba[2] + " (opção adicional, não válida)");
console.log("\nApenas a primeira companhia (Energisa Paraíba) será aceita como resposta correta");