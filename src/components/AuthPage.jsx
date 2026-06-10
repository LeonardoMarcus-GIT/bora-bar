import { LockKeyhole, Mail, MapPin, UserRound } from "lucide-react";
import { useState } from "react";
import { resetPassword, signIn, signUp } from "../services/authService.js";

function getFriendlyAuthError() {
  return "Email ou senha invalidos.";
}

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
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

        setFeedback("Enviamos o link de recuperacao para seu email.");
        return;
      }

      if (isSignup) {
        const { error } = await signUp(email.trim(), password, {
          display_name: displayName.trim(),
          city: city.trim(),
          neighborhood: neighborhood.trim()
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
    } catch {
      setFeedback(isRecover ? "Nao foi possivel enviar agora." : getFriendlyAuthError());
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="account-page">
      <section className="account-panel">
        <div className="account-heading">
          <p className="section-kicker">Sua conta</p>
          <h1>{isRecover ? "Recuperar senha" : "Entrar no Bora Bar"}</h1>
          <p>
            {isRecover
              ? "Informe seu email para receber o link de recuperacao."
              : "Salve seu perfil e continue explorando bares sem perder o clima."}
          </p>
        </div>

        {!isRecover && (
          <div className="auth-tabs" role="tablist" aria-label="Acesso">
            <button
              className={isLogin ? "is-active" : ""}
              type="button"
              onClick={() => resetFeedback("login")}
            >
              Entrar
            </button>
            <button
              className={isSignup ? "is-active" : ""}
              type="button"
              onClick={() => resetFeedback("signup")}
            >
              Criar conta
            </button>
          </div>
        )}

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

          {isSignup && (
            <div className="profile-grid">
              <label>
                <span>Cidade</span>
                <div className="field-with-icon">
                  <MapPin size={18} aria-hidden="true" />
                  <input
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Sao Paulo"
                  />
                </div>
              </label>
              <label>
                <span>Bairro</span>
                <div className="field-with-icon">
                  <MapPin size={18} aria-hidden="true" />
                  <input
                    value={neighborhood}
                    onChange={(event) => setNeighborhood(event.target.value)}
                    placeholder="Pinheiros"
                  />
                </div>
              </label>
            </div>
          )}

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
          ) : (
            <button type="button" onClick={() => resetFeedback("recover")}>
              Esqueci minha senha
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
