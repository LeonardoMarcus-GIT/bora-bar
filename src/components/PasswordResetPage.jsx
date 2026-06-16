import { LockKeyhole } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { updatePassword } from "../services/authService.js";

function getPasswordResetError(error) {
  const message = `${error?.message ?? ""} ${error?.name ?? ""}`.toLowerCase();

  if (
    message.includes("session") ||
    message.includes("jwt") ||
    message.includes("not authenticated")
  ) {
    return "Esse link expirou ou ja foi usado. Peca um novo link de recuperacao.";
  }

  if (message.includes("password")) {
    return "Use uma senha com pelo menos 6 caracteres.";
  }

  return "Nao foi possivel atualizar a senha agora.";
}

export default function PasswordResetPage({ onBackToLogin, onDone }) {
  const { isAuthReady, user } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canUpdatePassword = Boolean(user);

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");

    if (isAuthReady && !canUpdatePassword) {
      setFeedback("Abra o link mais recente enviado por email para criar uma nova senha.");
      return;
    }

    if (password !== confirmPassword) {
      setFeedback("As senhas precisam ser iguais.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await updatePassword(password);

      if (error) {
        throw error;
      }

      setFeedback("Senha atualizada.");
      setPassword("");
      setConfirmPassword("");
      onDone();
    } catch (error) {
      console.warn("Falha ao atualizar senha.", error);
      setFeedback(getPasswordResetError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="account-page">
      <section className="account-panel">
        <div className="account-heading">
          <p className="section-kicker">Seguranca</p>
          <h1>Nova senha</h1>
          <p>Crie uma nova senha para continuar usando sua conta.</p>
        </div>

        {isAuthReady && !canUpdatePassword && (
          <div className="auth-warning">
            <p>O link de recuperacao nao esta ativo nesta janela.</p>
            <button type="button" onClick={onBackToLogin}>
              Pedir novo link
            </button>
          </div>
        )}

        <form className="account-form" onSubmit={handleSubmit}>
          <label>
            <span>Nova senha</span>
            <div className="field-with-icon">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                disabled={isAuthReady && !canUpdatePassword}
                required
              />
            </div>
          </label>

          <label>
            <span>Confirmar senha</span>
            <div className="field-with-icon">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={6}
                disabled={isAuthReady && !canUpdatePassword}
                required
              />
            </div>
          </label>

          <button
            className="primary-action"
            type="submit"
            disabled={isSubmitting || !isAuthReady || !canUpdatePassword}
          >
            {!isAuthReady ? "Verificando..." : isSubmitting ? "Salvando..." : "Atualizar senha"}
          </button>
          {feedback && <p className="form-feedback">{feedback}</p>}
        </form>
      </section>
    </main>
  );
}
