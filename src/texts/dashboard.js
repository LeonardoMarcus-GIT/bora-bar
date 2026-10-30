// Textos do painel do dono do bar (pages/BusinessDashboard.jsx).
// Os dias da semana e o texto do horário ("Seg, Ter: 16h-1h", "Todos os dias") ficam
// na própria página, porque são gravados no banco e lidos por utils/openingHours.js.

export const common = {
  back: "Voltar",
  establishment: "Estabelecimento",
  optionalDescription: "Descrição opcional",
  phoneOrWhatsapp: "Telefone ou WhatsApp"
};

export const tabs = {
  dashboard: "Visão geral",
  overview: "Perfil público",
  menu: "Cardápio",
  promotions: "Promoções",
  events: "Eventos"
};

export const claimStatus = {
  approved: "Aprovado",
  rejected: "Não aprovado",
  pending: "Em análise"
};

export const messages = {
  loadFailed: "Não foi possível carregar os dados do estabelecimento.",
  claimMissing: "Selecione o bar e preencha seu nome e telefone.",
  claimSent: "Solicitação enviada. Vamos verificar o vínculo com o bar.",
  claimDuplicate: "Já existe uma solicitação em análise para esse bar.",
  claimFailed: "Não foi possível enviar a solicitação agora.",
  coverReady: "Foto pronta. Salve o perfil público para publicar a alteração.",
  storyPhotoReady: "Foto pronta. Toque em Salvar para publicar no story.",
  invalidImageType: "Escolha uma imagem JPG, PNG ou WebP.",
  imageTooLarge: "A imagem deve ter no máximo 8 MB.",
  imageFailed: "Não foi possível enviar a imagem agora. Tente novamente.",
  saved: "Alterações salvas e publicadas.",
  savedAddressOnly: "Endereço salvo. Não foi possível atualizar a distância agora.",
  saveFailed: "Não foi possível salvar agora. Verifique os campos e tente novamente."
};

export const states = {
  loadingTitle: "Carregando área do estabelecimento",
  loadingCopy: "Estamos verificando seus acessos.",
  kicker: "Área do estabelecimento",
  errorTitle: "Não foi possível abrir esta área",
  errorCopy:
    "Sua conta está conectada, mas a consulta do painel falhou. Tente novamente para renovar a conexão.",
  retry: "Tentar de novo"
};

export const claim = {
  kicker: "Para estabelecimentos",
  title: "Administre seu bar no Bora Bar",
  copy:
    "Solicite o acesso ao estabelecimento. Depois da verificação, você poderá manter cardápio, preços, promoções e eventos.",
  whichBar: "Qual estabelecimento é seu?",
  selectBar: "Selecione um bar",
  responsibleName: "Nome do responsável",
  document: "CNPJ ou documento do estabelecimento (opcional)",
  howConfirm: "Como podemos confirmar seu vínculo?",
  messagePlaceholder: "Ex: sou o proprietário e posso confirmar pelo telefone cadastrado.",
  sending: "Enviando...",
  submit: "Solicitar acesso",
  noOtherBar: "Não há outro estabelecimento disponível para uma nova solicitação."
};

export const header = {
  selectEstablishment: "Selecionar estabelecimento",
  kicker: "Painel do estabelecimento",
  copy: "Edite as informações que aparecem para os clientes no Bora Bar."
};

export const profile = {
  name: "Nome do estabelecimento",
  description: "Descrição",
  acceptOrders: "Aceito pedidos pelo WhatsApp",
  ordersOn: "O botão de WhatsApp mostra “Peça por aqui”. Os pedidos chegam no seu WhatsApp.",
  ordersOff: "O botão de WhatsApp mostra “Tire suas dúvidas”.",
  vibesIntro: "Clima do lugar: em quais buscas da página inicial ele aparece",
  vibesAria: "Clima do lugar",
  priceLevel: "Faixa de preço",
  priceLow: "$ - Econômico",
  priceMid: "$$ - Moderado",
  priceHigh: "$$$ - Premium",
  openNow: "Aberto agora",
  closedNow: "Fechado agora",
  autoNote: ". Muda sozinho pelo horário acima.",
  unreadableHours: "Não conseguimos ler o horário. Ajuste os dias e horas acima para o status mudar sozinho."
};

export const menu = {
  categoryName: "Nome da categoria",
  categoryPlaceholder: "Ex: Cervejas",
  removeCategory: (name) => `Remover categoria ${name}`,
  itemName: "Nome do item",
  remove: (name) => `Remover ${name}`,
  itemDescription: "Descrição do item",
  price: "Preço do item",
  available: "Disponível",
  itemAvailable: "Item disponível",
  addItem: "Adicionar item",
  newCategory: "Nova categoria"
};

export const timed = {
  eventName: "Nome do evento",
  promoTitle: "Título da promoção",
  eventPlaceholder: "Ex: Samba ao vivo",
  promoPlaceholder: "Ex: Chopp em dobro",
  start: "Início",
  end: "Fim",
  entryPrice: "Valor da entrada (opcional)",
  eventPublished: "Evento publicado",
  promoPublished: "Promoção publicada",
  newEvent: "Novo evento",
  newPromo: "Nova promoção",
  photo: "Foto do story (opcional)",
  photoHint: "Aparece em tela cheia nos stories do app e sai sozinha 8 horas depois de enviada. Use uma foto em pé, do prato, do drink ou do palco.",
  choosePhoto: "Tirar ou escolher foto",
  changePhoto: "Trocar foto",
  removePhoto: "Remover foto"
};

export const save = {
  saving: "Salvando...",
  save: (tabLabel) => `Salvar ${tabLabel}`
};

export const overview = {
  checks: {
    photo: "Foto e descrição",
    contact: "Endereço e contato",
    hours: "Horário publicado",
    menu: "Cardápio com itens",
    promo: "Promoção ou evento ativo"
  },
  metrics: {
    views: "Visualizações",
    whatsapp: "WhatsApp",
    routes: "Rotas abertas",
    calls: "Ligações",
    favorites: "Favoritos",
    storyViews: "Viram seu story",
    storyOpens: "Abriram o bar pelo story"
  },
  qualityKicker: "Qualidade do perfil",
  completeSuffix: "% completo",
  qualityCopy: "Perfis completos ajudam o cliente a decidir com menos dúvidas.",
  progressAria: "Progresso do perfil",
  lastDays: (days) => `Últimos ${days} dias`,
  interest: "Interesse dos clientes",
  noData: "Sem dados ainda",
  shortcutsKicker: "Atalhos",
  shortcutsTitle: "O que você quer fazer?",
  viewPage: "Ver minha página",
  viewPageCopy: "A página do QR Code e do link no Instagram",
  qr: "QR Code para imprimir",
  qrCopy: "Para mesa, balcão e vitrine",
  updateInfo: "Atualizar informações",
  updateInfoCopy: "Contato, endereço, foto e horário",
  publishPromo: "Publicar promoção",
  publishPromoCopy: "Com data de início e fim",
  editMenu: "Editar cardápio",
  editMenuCopy: "Preços e itens esgotados",
  newEvent: "Novo evento",
  newEventCopy: "Show, samba, jogo no telão",
  statusAuto: "Muda sozinho pelo seu horário",
  statusManual: "Cadastre o horário para mudar sozinho",
  quickPromoTitle: "Promoção de hoje",
  quickPromoPlaceholder: "Ex: Chopp em dobro até 20h",
  quickPromoPublish: "Publicar",
  quickPromoPublishing: "Publicando...",
  quickPromoPreview: "Aparece assim no app:",
  quickPromoNone: "Nenhuma promoção no ar agora. Publique uma e ela entra nos stories do app.",
  quickPromoHint: "Fica no ar até 23h59 de hoje. Para outra data ou foto, use a aba Promoções.",
  quickPromoPublished: "Promoção publicada. Já aparece no app.",
  promoEnded: "Promoção encerrada.",
  endPromo: "Encerrar",
  dailyTitle: "Visitas por dia",
  dailyTotal: (total) => `${total} ${total === 1 ? "visita" : "visitas"} na semana`,
  dailyEmpty: "Ainda sem visitas registradas nesta semana.",
  weekday: (isoDay) => ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"][new Date(`${isoDay}T12:00:00`).getDay()]
};

export const cover = {
  title: "Foto principal",
  copy: "Mostre o ambiente que mais representa seu estabelecimento.",
  uploading: "Enviando foto",
  choose: "Escolher foto",
  previewAlt: "Prévia da foto principal",
  orUrl: "Ou use uma URL de imagem"
};

export const hours = {
  title: "Horário de funcionamento",
  daysAria: "Dias de funcionamento",
  all: "Todos",
  opens: "Abre",
  closes: "Fecha"
};
