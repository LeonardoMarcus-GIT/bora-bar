import { LockKeyhole, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import AddressFields from "./AddressFields.jsx";
import { emptyAddress, geocodeAddress, toProfilePayload } from "../services/addressService.js";
import { resetPassword, signIn, signUp } from "../services/authService.js";

function getFriendlyAuthError(error, flow) {
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
    return "Confirme seu email antes de entrar.";
  }

  if (
    message.includes("invalid login") ||
    message.includes("invalid credentials") ||
    message.includes("invalid_credentials") ||
    message.includes("400")
  ) {
    return "Email ou senha invalidos.";
  }

  if (
    message.includes("login indisponivel") ||
    message.includes("supabase") ||
    message.includes("api key")
  ) {
    return "Login indisponivel no momento. Verifique a configuracao do app.";
  }

  if (message.includes("failed to fetch") || message.includes("network")) {
    return "Nao foi possivel conectar ao login agora. Tente novamente em instantes.";
  }

  if (message.includes("already registered") || message.includes("user already")) {
    return "Esse email ja tem uma conta. Tente entrar ou recuperar a senha.";
  }

  if (message.includes("password")) {
    return "Use uma senha com pelo menos 6 caracteres.";
  }

  if (message.includes("redirect") || message.includes("not allowed")) {
    return "O dominio do app precisa estar liberado no Supabase.";
  }

  if (message.includes("signup") && message.includes("disabled")) {
    return "Cadastro por email esta desativado no Supabase.";
  }

  if (message.includes("rate limit") || message.includes("too many")) {
    return "Muitas tentativas agora. Tente novamente em alguns minutos.";
  }

  if (flow === "recover") {
    return "Nao foi possivel enviar o link agora.";
  }

  if (flow === "signup") {
    return "Nao foi possivel criar a conta agora.";
  }

  return "Nao foi possivel entrar agora.";
}

function getHeadingText(mode) {
  if (mode === "recover") {
    return "Recuperar senha";
  }

  if (mode === "signup") {
    return "Criar conta";
  }

  return "Entrar no Bora Bar";
}

function getHeadingCopy(mode) {
  if (mode === "recover") {
    return "Informe seu email para receber o link de recuperacao.";
  }

  if (mode === "signup") {
    return "Crie seu perfil para comentar e avaliar os lugares que visitar.";
  }

  return "Entre para acessar seu perfil, comentar e salvar suas preferencias.";
}

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [address, setAddress] = useState(emptyAddress);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === "login";
  const isSignup = mode === "signup";
  const isRecover = mode === "recover";

  function resetFeedback(nextMode) {
    setMode(nextMode);
    setFeedback("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback("");

    try {
      if (isRecover) {
        const { error } = await resetPassword(email.trim());

        if (error) {
          throw error;
        }

        setFeedback("Se esse email estiver cadastrado, enviamos o link de recuperacao.");
        return;
      }

      if (isSignup) {
        let profileAddress = toProfilePayload(address);

        try {
          const { location } = await geocodeAddress(profileAddress);
          profileAddress = toProfilePayload({
            ...profileAddress,
            latitude: location?.latitude,
            longitude: location?.longitude,
            locationSource: location?.source,
            locationUpdatedAt: location?.updatedAt
          });
        } catch {
          // Cadastro continua mesmo se a localizacao aproximada nao estiver disponivel.
        }

        const { error } = await signUp(email.trim(), password, {
          display_name: displayName.trim(),
          city: profileAddress.city,
          city_ibge_code: profileAddress.cityIbgeCode,
          latitude: profileAddress.latitude,
          location_source: profileAddress.locationSource,
          location_updated_at: profileAddress.locationUpdatedAt,
          longitude: profileAddress.longitude,
          neighborhood: profileAddress.neighborhood,
          postal_code: profileAddress.postalCode,
          state: profileAddress.state,
          state_code: profileAddress.stateCode
        });

        if (error) {
          throw error;
        }

        setFeedback("Confira seu email para confirmar sua conta.");
        setPassword("");
        return;
      }

      const { error } = await signIn(email.trim(), password);

      if (error) {
        throw error;
      }

      onAuthenticated();
    } catch (error) {
      const flow = isRecover ? "recover" : isSignup ? "signup" : "login";
      console.warn("Falha no fluxo de autenticacao.", error);
      setFeedback(getFriendlyAuthError(error, flow));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="account-page">
      <section className="account-panel">
        <div className="account-heading">
          <p className="section-kicker">Sua conta</p>
          <h1>{getHeadingText(mode)}</h1>
          <p>{getHeadingCopy(mode)}</p>
        </div>

        <form className="account-form" onSubmit={handleSubmit}>
          {isSignup && (
            <label>
              <span>Nome ou apelido</span>
              <div className="field-with-icon">
                <UserRound size={18} aria-hidden="true" />
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Ex: Ana"
                  required
                />
              </div>
            </label>
          )}

          <label>
            <span>Email</span>
            <div className="field-with-icon">
              <Mail size={18} aria-hidden="true" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@email.com"
                required
              />
            </div>
          </label>

          {!isRecover && (
            <label>
              <span>Senha</span>
              <div className="field-with-icon">
                <LockKeyhole size={18} aria-hidden="true" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  placeholder="Minimo 6 caracteres"
                  required
                />
              </div>
            </label>
          )}

          {isSignup && <AddressFields address={address} onChange={setAddress} />}

          <button className="primary-action" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Aguarde..."
              : isRecover
                ? "Enviar link"
                : isSignup
                  ? "Criar conta"
                  : "Entrar"}
          </button>

          {feedback && <p className="form-feedback">{feedback}</p>}
        </form>

        <div className="account-links">
          {isRecover ? (
            <button type="button" onClick={() => resetFeedback("login")}>
              Voltar para entrar
            </button>
          ) : isSignup ? (
            <button type="button" onClick={() => resetFeedback("login")}>
              Ja tenho uma conta
            </button>
          ) : (
            <>
              <button type="button" onClick={() => resetFeedback("signup")}>
                Criar conta
              </button>
              <button
                className="account-link-muted"
                type="button"
                onClick={() => resetFeedback("recover")}
              >
                Esqueci minha senha
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
