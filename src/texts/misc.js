// Textos menores: cartão de QR Code, página avulsa, campos de endereço e atalhos do cardápio.

// pages/QrCodePage.jsx
export const qr = {
  title: (name) => `QR Code — ${name}`,
  generating: "Gerando QR Code…",
  notFound: "Estabelecimento não encontrado. Confira o link.",
  error: "Não foi possível gerar o QR Code agora. Tente de novo.",
  print: "Imprimir",
  download: "Baixar imagem do QR Code",
  kicker: "Cardápio digital",
  qrAria: (url) => `QR Code para ${url}`,
  call: "Aponte a câmera do celular para ver o cardápio, os preços e falar com a gente.",
  hint: "Dica: imprima em papel mais grosso ou plastifique. Teste com a câmera do celular antes de colar."
};

// pages/StandalonePage.jsx
export const standalone = {
  loading: "Carregando…",
  errorTitle: "Não conseguimos abrir esta página agora",
  errorCopy: "Pode ser a conexão. Tente de novo em instantes.",
  retry: "Tentar de novo",
  notFoundTitle: "Página não encontrada",
  notFoundCopy: "Confira o link ou o QR Code e tente de novo."
};

// components/AddressFields.jsx (endereço do perfil do usuário)
export const address = {
  statesFailed: "Não foi possível carregar estados agora.",
  citiesFailed: "Não foi possível carregar cidades agora.",
  found: "Endereço encontrado.",
  cepNotFound: "Não encontramos esse CEP. Você pode preencher manualmente.",
  legend: "Endereço para sugestões próximas",
  intro: "Opcional. Usaremos esse endereço apenas para melhorar sugestões próximas.",
  cep: "CEP",
  state: "Estado",
  city: "Cidade",
  neighborhood: "Bairro",
  neighborhoodPlaceholder: "Centro",
  loading: "Carregando...",
  select: "Selecione",
  searching: "Buscando endereço..."
};

// components/BarAddressFields.jsx (endereço do estabelecimento, no painel)
export const barAddress = {
  found: "Endereço encontrado. Confira e ajuste número ou qualquer outro campo.",
  cepNotFound: "Não encontramos esse CEP. Preencha os campos manualmente.",
  legend: "Endereço do estabelecimento",
  intro: "O CEP preenche os dados automaticamente, mas todos os campos podem ser corrigidos.",
  cep: "CEP",
  street: "Rua ou avenida",
  streetPlaceholder: "Rua 33",
  number: "Número",
  numberPlaceholder: "77",
  complement: "Complemento",
  complementPlaceholder: "Loja 2, fundos...",
  neighborhood: "Bairro",
  neighborhoodPlaceholder: "Vila Santa Cecília",
  city: "Cidade",
  cityPlaceholder: "Volta Redonda",
  state: "Estado",
  statePlaceholder: "Rio de Janeiro",
  uf: "UF",
  ufPlaceholder: "RJ",
  searching: "Buscando endereço...",
  previewTitle: "Como aparecerá no app",
  previewEmpty: "Preencha o endereço acima."
};

// components/MenuNav.jsx
export const menuNav = {
  ariaLabel: "Categorias do cardápio"
};
