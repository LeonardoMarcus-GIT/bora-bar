// Textos da página inicial (pages/LandingPage.jsx), no visual da Versão 3 "Bolso".
// Títulos com destaque vêm em duas partes: `titulo` (normal) e `destaque` (em itálico/cor).

export const nav = {
  ariaLabel: "Navegação da página",
  brandAria: "Bora Bar, início",
  brandName: "Bora Bar",
  howItWorks: "Como funciona",
  forBusiness: "Para estabelecimentos",
  login: "Entrar",
  openApp: "Abrir o app"
};

export const hero = {
  pill: "Volta Redonda · grátis para quem sai",
  titulo: "Seu rolê começa",
  // Final do título que vai trocando sozinho (em itálico coral).
  destaques: ["aqui.", "no samba.", "no happy hour.", "com um bora."],
  description: "Veja se está aberto, o cardápio com preços, as promoções e os shows de hoje. Antes de sair de casa.",
  primaryButton: "Bora?",
  secondaryButton: "Tenho um bar"
};

// Celular de demonstração do topo (ilustrativo, com os bares de exemplo).
export const phone = {
  ariaLabel: "Prévia do aplicativo Bora Bar",
  greeting: "Boa noite",
  question: "Qual vai ser hoje?",
  search: "Bar, bairro ou cidade",
  openNow: "Aberto · Fecha às 2h",
  promoLabel: "Promoção de hoje",
  storyKicker: "Hoje tem",
  storyTitle: "Roda de samba",
  storyLine: "21h · Samba da Rua",
  storyCta: "Ver o bar",
  // Etiquetas que flutuam em volta do celular.
  floating: ["Chopp em dobro até 20h", "Samba às 21h", "Aberto · fecha às 2h"]
};

export const today = {
  eyebrow: "Hoje nos bares",
  titulo: "Promoção e show",
  destaque: "em stories.",
  description: "Toque numa bolinha. É o próprio bar que publica."
};

// Cada card leva à lista filtrada pelo clima (#clima/<id>, ver src/utils/vibes.js).
export const nightTypesHeading = {
  eyebrow: "Do seu jeito",
  titulo: "Qual é o rolê",
  destaque: "de hoje?"
};

export const how = {
  eyebrow: "Sem complicação",
  titulo: "Descubra. Combine.",
  destaque: "Bora.",
  steps: [
    { title: "Descubra", description: "Lugares perto de você, filtrados pelo clima: barzinho, date, samba, jogo." },
    { title: "Confira antes de sair", description: "Aberto agora, cardápio com preços, promoções e a agenda do dia." },
    { title: "Chama a galera", description: "Mande o link no grupo. A página do bar abre bonita no WhatsApp." }
  ]
};

export const owners = {
  eyebrow: "Para bares e restaurantes",
  titulo: "Seu cardápio, suas promoções,",
  destaque: "no bolso do cliente.",
  perks: [
    "Site e cardápio digital para o QR Code",
    "Promoções e shows publicados em 1 minuto",
    "Aberto/fechado automático pelo horário",
    "30 dias grátis para os primeiros parceiros"
  ],
  button: "Quero ser Parceiro Fundador"
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
  login: "Entrar"
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
