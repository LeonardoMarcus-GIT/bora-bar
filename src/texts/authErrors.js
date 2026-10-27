// Mensagens de erro de login/cadastro/senha, em português. Para mudar um texto, edite aqui.

export function getFriendlyAuthError(error, flow) {
  const message = [
    error?.message,
    error?.code,
    error?.error_code,
    error?.name,
    error?.status
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (message.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }

  if (
    message.includes("email_address_invalid") ||
    message.includes("email address") ||
    message.includes("invalid email") ||
    message.includes("valid email")
  ) {
    return "Digite um e-mail válido para criar sua conta.";
  }

  if (
    message.includes("already registered") ||
    message.includes("user already") ||
    message.includes("user_already_exists") ||
    message.includes("email_exists")
  ) {
    return "Esse e-mail já tem uma conta. Tente entrar ou recuperar a senha.";
  }

  if (
    message.includes("invalid login") ||
    message.includes("invalid credentials") ||
    message.includes("invalid_credentials")
  ) {
    return "E-mail ou senha inválidos.";
  }

  if (message.includes("database") || message.includes("saving new user")) {
    return "Não conseguimos criar seu perfil agora. Tente novamente em instantes.";
  }

  if (message.includes("email") && message.includes("send")) {
    return "Não foi possível enviar o e-mail de confirmação agora.";
  }

  if (
    message.includes("login indisponível") ||
    message.includes("supabase") ||
    message.includes("api key")
  ) {
    return "Login indisponível no momento. Verifique a configuração do app.";
  }

  if (message.includes("failed to fetch") || message.includes("network")) {
    return "Não foi possível conectar ao login agora. Tente novamente em instantes.";
  }

  if (message.includes("password")) {
    return "Use uma senha com pelo menos 6 caracteres.";
  }

  if (message.includes("redirect") || message.includes("not allowed")) {
    return "O domínio do app precisa estar liberado no Supabase.";
  }

  if (message.includes("signup") && message.includes("disabled")) {
    return "Cadastro por e-mail está desativado no Supabase.";
  }

  if (message.includes("rate limit") || message.includes("too many")) {
    return "Muitas tentativas agora. Tente novamente em alguns minutos.";
  }

  if (flow === "recover") {
    return "Não foi possível enviar o link agora.";
  }

  if (flow === "signup") {
    return "Não foi possível criar a conta agora.";
  }

  return "Não foi possível entrar agora.";
}

export function getPasswordResetError(error) {
  const message = `${error?.message ?? ""} ${error?.name ?? ""}`.toLowerCase();

  if (
    message.includes("session") ||
    message.includes("jwt") ||
    message.includes("not authenticated")
  ) {
    return "Esse link expirou ou já foi usado. Peça um novo link de recuperação.";
  }

  if (message.includes("password")) {
    return "Use uma senha com pelo menos 6 caracteres.";
  }

  return "Não foi possível atualizar a senha agora.";
}

export function getLoginError(error) {
  const message = String(error?.message ?? "").toLowerCase();

  if (message.includes("invalid") || message.includes("credentials")) {
    return "E-mail ou senha incorretos.";
  }

  if (message.includes("confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }

  return "Não foi possível entrar agora. Tente novamente.";
}
