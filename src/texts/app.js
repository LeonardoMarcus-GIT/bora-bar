// Textos da tela principal do app: cabeçalho e busca (AppHeader), filtros (FilterBar),
// lista e card de bares (BarList, BarCard), menu de baixo (BottomNav) e selo aberto/fechado (StatusBadge).

export const header = {
  logoAria: "Logo Bora Bar",
  brandName: "Bora Bar",
  kicker: "Escolha o bar antes de sair",
  greeting: (hour) => (hour < 5 ? "Boa madrugada" : hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"),
  title: "Qual vai ser hoje?",
  notifications: "Notificações",
  searchPlaceholder: "Bar, bairro ou cidade",
  searchAria: "Buscar por nome do bar, cidade ou bairro",
  locationLoading: "Buscando localização",
  locationRefresh: "Atualizar localização",
  locationUseGps: "Usar GPS em vez do endereço salvo",
  locationUse: "Usar minha localização",
  loadingBars: "Carregando bares",
  barsFound: (count) => `${count} ${count === 1 ? "bar encontrado" : "bares encontrados"}`
};

export const filters = {
  ariaLabel: "Filtros",
  open: "Aberto agora",
  cheap: "Mais barato",
  near: "Mais próximo",
  promo: "Com promoção"
};

export const barList = {
  ariaLabel: "Lista de bares",
  noFavoritesTitle: "Nenhum favorito ainda",
  noFavoritesCopy: "Toque no coração de um bar para salvar aqui.",
  noBarsTitle: "Nenhum bar encontrado",
  noBarsCopy: "Tente outro bairro, cidade ou remova algum filtro."
};

export const barCard = {
  remove: "Remover",
  favorite: "Favoritar",
  removeFromFavorites: "Remover dos favoritos",
  openDetails: (name) => `Abrir detalhes de ${name}`,
  distanceUnavailable: "Distância indisponível",
  startingAt: "A partir de",
  since: "desde"
};

// Stories de "Hoje nos bares" (components/BarStories.jsx).
export const stories = {
  ariaLabel: "Hoje nos bares",
  promotion: "Promoção de hoje",
  event: "Vem aí",
  eventToday: "Hoje tem",
  dialogAria: (name) => `Story de ${name}`,
  close: "Fechar",
  previous: "Anterior",
  next: "Próximo",
  seeBar: "Ver o bar"
};

// Faixa "Perto de você" (components/NearbyStrip.jsx).
export const nearby = {
  title: "Perto de você",
  titleNoLocation: "Em destaque",
  allTitle: "Todos os lugares"
};

export const bottomNav = {
  ariaLabel: "Navegação principal",
  home: "Início",
  search: "Buscar",
  menu: "Cardápio",
  promotions: "Promoções",
  favorites: "Favoritos",
  profile: "Perfil"
};

export const status = {
  open: "Aberto",
  closed: "Fechado"
};

// Textos da tela inicial do app e da busca (App.jsx).
export const home = {
  suggestionType: { bar: "Estabelecimento", city: "Cidade", neighborhood: "Bairro" },
  barCount: (count) => `${count} ${count === 1 ? "bar" : "bares"}`,
  suggestionInCity: (typeLabel, city) => `${typeLabel} em ${city}`,
  summaryError: "Bares indisponíveis no momento",
  summaryNear: (count) => `${count} ${count === 1 ? "bar perto de você" : "bares perto de você"}`,
  summaryNearAddress: (count) => `${count} ${count === 1 ? "bar perto do seu endereço" : "bares perto do seu endereço"}`,
  summaryFound: (count) => `${count} ${count === 1 ? "bar encontrado" : "bares encontrados"}`,
  loadingBarTitle: "Carregando bar",
  loadingBarCopy: "Estamos buscando as informações desse lugar.",
  vibeShowing: "Mostrando lugares com clima de",
  seeAll: "Ver todos",
  vibesAria: "Clima do rolê",
  favoritesTitle: "Seus favoritos",
  loadingTitle: "Carregando bares",
  loadingCopy: "Buscando o que está rolando perto de você.",
  errorTitle: "Não conseguimos carregar os bares agora",
  errorCopy: "Pode ser a conexão ou uma instabilidade rápida. Tente de novo em instantes.",
  retry: "Tentar de novo",
  emptyTitle: "Nenhum bar por aqui ainda",
  emptyCopy: "Os primeiros estabelecimentos estão chegando. Volte em breve.",
  vibeEmptyTitle: (label) => `Nenhum lugar com ${label} por perto ainda`,
  vibeEmptyCopy: "Novos estabelecimentos estão chegando. Enquanto isso, veja todos os lugares."
};