import { LockKeyhole } from "lucide-react";
import { useState } from "react";
import { updatePassword } from "../services/authService.js";

export default function PasswordResetPage({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");

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
    } catch {
      setFeedback("Nao foi possivel atualizar a senha agora.");
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
                required
              />
            </div>
          </label>

          <button className="primary-action" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Atualizar senha"}
          </button>
          {feedback && <p className="form-feedback">{feedback}</p>}
        </form>
      </section>
    </main>
  );
}
