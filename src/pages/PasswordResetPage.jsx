import { LockKeyhole } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { updatePassword } from "../services/authService.js";
import { getPasswordResetError } from "../texts/authErrors.js";
import { passwordReset as t } from "../texts/account.js";

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
      setFeedback(t.openLatestLink);
      return;
    }

    if (password !== confirmPassword) {
      setFeedback(t.mismatch);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await updatePassword(password);

      if (error) {
        throw error;
      }

      setFeedback(t.updated);
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
          <p className="section-kicker">{t.kicker}</p>
          <h1>{t.title}</h1>
          <p>{t.copy}</p>
        </div>

        {isAuthReady && !canUpdatePassword && (
          <div className="auth-warning">
            <p>{t.linkInactive}</p>
            <button type="button" onClick={onBackToLogin}>
              {t.requestNewLink}
            </button>
          </div>
        )}

        <form className="account-form" onSubmit={handleSubmit}>
          <label>
            <span>{t.newPasswordLabel}</span>
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
            <span>{t.confirmPasswordLabel}</span>
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
            {!isAuthReady ? t.checking : isSubmitting ? t.saving : t.submit}
          </button>
          {feedback && <p className="form-feedback">{feedback}</p>}
        </form>
      </section>
    </main>
  );
}
