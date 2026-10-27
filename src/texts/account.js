// Textos de login/cadastro (pages/AuthPage.jsx), nova senha (pages/PasswordResetPage.jsx)
// e perfil (pages/ProfilePage.jsx). Mensagens de erro ficam em authErrors.js.

export const auth = {
  introTagline: "Encontre o clima certo para a sua noite.",
  introTitulo: "Todo rolê",
  introDestaque: "bora.",
  introMeio: "começa com um",
  back: "Voltar",
  kicker: "Sua conta",
  heading: {
    login: "Entrar no Bora Bar",
    signup: "Criar conta",
    recover: "Recuperar senha"
  },
  copy: {
    login: "Entre para acessar seu perfil, comentar e salvar suas preferências.",
    signup: "Crie seu perfil para comentar e avaliar os lugares que visitar.",
    recover: "Informe seu e-mail para receber o link de recuperação."
  },
  nameLabel: "Nome ou apelido",
  namePlaceholder: "Ex: Ana",
  emailLabel: "E-mail",
  emailPlaceholder: "você@email.com",
  passwordLabel: "Senha",
  passwordPlaceholder: "Mínimo de 6 caracteres",
  submitting: "Aguarde...",
  submit: {
    login: "Entrar",
    signup: "Criar conta",
    recover: "Enviar link"
  },
  recoverSent: "Se esse e-mail estiver cadastrado, enviamos o link de recuperação.",
  confirmEmail: "Confira seu e-mail para confirmar sua conta.",
  backToLogin: "Voltar para entrar",
  haveAccount: "Já tenho uma conta",
  createAccount: "Criar conta",
  forgotPassword: "Esqueci minha senha"
};

export const passwordReset = {
  kicker: "Segurança",
  title: "Nova senha",
  copy: "Crie uma nova senha para continuar usando sua conta.",
  linkInactive: "O link de recuperação não está ativo nesta janela.",
  requestNewLink: "Pedir novo link",
  newPasswordLabel: "Nova senha",
  confirmPasswordLabel: "Confirmar senha",
  checking: "Verificando...",
  saving: "Salvando...",
  submit: "Atualizar senha",
  openLatestLink: "Abra o link mais recente enviado por e-mail para criar uma nova senha.",
  mismatch: "As senhas precisam ser iguais.",
  updated: "Senha atualizada."
};

export const profile = {
  loadingTitle: "Carregando perfil",
  loadingCopy: "Estamos preparando sua conta.",
  kicker: "Perfil",
  fallbackName: "Seu perfil",
  nameLabel: "Nome ou apelido",
  namePlaceholder: "Como você quer aparecer",
  emailLabel: "E-mail",
  save: "Salvar perfil",
  saving: "Salvando...",
  saved: "Perfil salvo.",
  saveFailed: "Não foi possível salvar agora.",
  businessAreaTitle: "Área do estabelecimento",
  businessAreaCopy: "Solicite acesso ou administre seu bar",
  learnTitle: "Ainda não faz parte?",
  learnCopy: "Conheça o Programa Parceiro Fundador",
  signOut: "Sair da conta"
};
