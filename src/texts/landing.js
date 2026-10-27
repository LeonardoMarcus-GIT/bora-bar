// Textos da página inicial (pages/LandingPage.jsx).
// Títulos com destaque vêm em duas partes: `titulo` (normal) e `destaque` (em itálico/cor).

export const nav = {
  ariaLabel: "Navegação da página",
  brandAria: "Bora Bar, início",
  brandName: "Bora Bar",
  explore: "Explorar",
  howItWorks: "Como funciona",
  forBusiness: "Para estabelecimentos",
  login: "Entrar",
  openMenu: "Abrir menu"
};

export const hero = {
  eyebrow: "A cidade está chamando",
  titulo: "Seu rolê",
  destaque: "começa aqui.",
  description:
    "Descubra bares e restaurantes perto de você. Veja cardápio com preços, promoções e shows de cada lugar antes de sair de casa.",
  primaryButton: "Bora?",
  secondaryButton: "Criar minha conta",
  signalLabel: "Exemplo de uma promoção de hoje",
  // Exemplos que se alternam no cartão do topo (ilustrativos).
  signalTexts: ["Chopp em dobro até as 20h", "Samba ao vivo às 21h", "Happy hour até as 20h"],
  scrollCue: "Conheça o Bora Bar"
};

export const discovery = {
  eyebrow: "Descoberta sem enrolação",
  titulo: "Nunca mais fique meia hora",
  destaque: "decidindo onde ir.",
  description:
    "Do boteco da esquina ao rooftop que está cheio de energia, o Bora Bar deixa o clima da cidade visível antes de você sair de casa.",
  exploreLink: "Explorar lugares perto de mim",
  // Rótulo de cada um dos 3 bares da lista, na ordem.
  placeTags: ["Aberto agora", "🍻 Happy hour", "🎸 Música ao vivo"],
  // Destaque de cada um dos 3 bares (exemplos ilustrativos).
  placeHighlights: ["Chopp em dobro até 20h", "Happy hour até 20h", "Samba hoje às 21h"]
};

// Prévia do aplicativo (celular ilustrativo)
export const preview = {
  ariaLabel: "Prévia do aplicativo Bora Bar",
  greeting: "Boa noite, Leo",
  question: "Qual vai ser hoje?",
  notifications: "Ver notificações",
  search: "Bar, bairro ou cidade",
  filters: ["Todos", "Happy hour", "Ao vivo"],
  openNow: "Aberto agora",
  highlight: "Chopp em dobro até 20h"
};

// Cada card leva à lista filtrada pelo clima (#clima/<id>, ver src/utils/vibes.js).
export const nightTypesHeading = {
  eyebrow: "Do seu jeito",
  titulo: "Qual é o rolê",
  destaque: "de hoje?"
};

export const nightTypeLabels = {
  barzinho: "Barzinho",
  "comer-bem": "Comer bem",
  drinks: "Drinks",
  "musica-ao-vivo": "Música ao vivo",
  festa: "Festa",
  date: "Date",
  "assistir-jogo": "Assistir jogo",
  rooftop: "Rooftop"
};

export const how = {
  eyebrow: "Sem complicação",
  titulo: "Descubra. Combine.",
  destaque: "Bora.",
  steps: [
    { title: "Descubra", description: "Encontre lugares próximos que combinam com você." },
    { title: "Confira antes de sair", description: "Veja se está aberto, o cardápio, os preços e as promoções do dia." },
    { title: "Chama a galera", description: "Compartilhe o lugar e transforme o plano em rolê." }
  ]
};

export const finalCta = {
  eyebrow: "A cidade está viva",
  titulo: "A noite já",
  destaque: "começou.",
  description: "Só falta você decidir onde.",
  button: "Bora?"
};

export const footer = {
  tagline: "Bora Bar — encontre seu próximo rolê.",
  explore: "Explorar",
  forBusiness: "Para estabelecimentos",
  about: "Sobre",
  terms: "Termos",
  privacy: "Privacidade"
};

export const loginModal = {
  closeAria: "Fechar login",
  eyebrow: "Sua noite começa agora",
  title: "Bora?",
  copy: "Entre e descubra onde a noite vai te levar.",
  emailLabel: "E-mail",
  emailPlaceholder: "você@email.com",
  passwordLabel: "Senha",
  passwordPlaceholder: "Sua senha",
  submit: "Entrar",
  submitting: "Entrando...",
  divider: "ou entre com",
  googleSoon: "Login com Google estará disponível em breve.",
  appleSoon: "Login com Apple estará disponível em breve.",
  noAccount: "Ainda não tem conta?",
  createAccount: "Criar conta"
};
