import { ArrowLeft, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import AddressFields from "../components/AddressFields.jsx";
import { emptyAddress, geocodeAddress, toProfilePayload } from "../services/addressService.js";
import { resetPassword, signIn, signUp } from "../services/authService.js";
import logoIcon from "../assets/bora-bar-icon.png";
import { getFriendlyAuthError } from "../texts/authErrors.js";
import { auth } from "../texts/account.js";

const t = auth;

function completeAuthentication(onAuthenticated) {
  try {
    onAuthenticated();
  } catch (error) {
    console.warn("Login concluído, mas o redirecionamento falhou.", error);
    window.location.hash = "app";
    window.scrollTo({ top: 0 });
  }
}

export default function AuthPage({ onAuthenticated, onBackToLanding }) {
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

        setFeedback(t.recoverSent);
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
          // Cadastro continua mesmo se a localização aproximada não estiver disponível.
        }

        const { data, error } = await signUp(email.trim(), password, {
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

        if (data.session) {
          completeAuthentication(onAuthenticated);
          return;
        }

        setFeedback(t.confirmEmail);
        setPassword("");
        return;
      }

      const { error } = await signIn(email.trim(), password);

      if (error) {
        throw error;
      }

      completeAuthentication(onAuthenticated);
    } catch (error) {
      const flow = isRecover ? "recover" : isSignup ? "signup" : "login";
      console.warn("Falha no fluxo de autenticação.", error);
      setFeedback(getFriendlyAuthError(error, flow));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="account-page auth-page">
      <section className="auth-page-intro" aria-hidden="true">
        <img src={logoIcon} alt="" />
        <p>{t.introTagline}</p>
        <h2>{t.introTitulo}<br />{t.introMeio} <em>{t.introDestaque}</em></h2>
      </section>
      <section className="account-panel auth-panel">
        <button className="auth-back-button" type="button" onClick={onBackToLanding}>
          <ArrowLeft size={17} aria-hidden="true" /> {t.back}
        </button>
        <div className="account-heading">
          <p className="section-kicker">{t.kicker}</p>
          <h1>
            {/* O nome "Bora Bar" sai na serifa itálica coral, igual à marca. */}
            {t.heading[mode].split(/(Bora Bar)/).map((part, index) =>
              part === "Bora Bar" ? <em className="brand-word" key={index}>{part}</em> : part
            )}
          </h1>
          <p>{t.copy[mode]}</p>
        </div>

        <form className="account-form" onSubmit={handleSubmit}>
          {isSignup && (
            <label>
              <span>{t.nameLabel}</span>
              <div className="field-with-icon">
                <UserRound size={18} aria-hidden="true" />
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder={t.namePlaceholder}
                  required
                />
              </div>
            </label>
          )}

          <label>
            <span>{t.emailLabel}</span>
            <div className="field-with-icon">
              <Mail size={18} aria-hidden="true" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t.emailPlaceholder}
                required
              />
            </div>
          </label>

          {!isRecover && (
            <label>
              <span>{t.passwordLabel}</span>
              <div className="field-with-icon">
                <LockKeyhole size={18} aria-hidden="true" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  placeholder={t.passwordPlaceholder}
                  required
                />
              </div>
            </label>
          )}

          {isSignup && <AddressFields address={address} onChange={setAddress} />}

          <button className="primary-action" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t.submitting : t.submit[mode]}
          </button>

          {feedback && <p className="form-feedback">{feedback}</p>}
        </form>

        <div className="account-links">
          {isRecover ? (
            <button type="button" onClick={() => resetFeedback("login")}>
              {t.backToLogin}
            </button>
          ) : isSignup ? (
            <button type="button" onClick={() => resetFeedback("login")}>
              {t.haveAccount}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => resetFeedback("signup")}>
                {t.createAccount}
              </button>
              <button
                className="account-link-muted"
                type="button"
                onClick={() => resetFeedback("recover")}
              >
                {t.forgotPassword}
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
