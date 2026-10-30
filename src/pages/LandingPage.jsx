import { useEffect, useState } from "react";
import { Apple, ArrowUpRight, BadgePercent, Check, Clock3, Eye, Music, Search, Share2, X } from "lucide-react";
import { mockBars } from "../data/mockBars.js";
import { signIn } from "../services/authService.js";
import logoIcon from "../assets/bora-bar-icon.png";
import { getLoginError } from "../texts/authErrors.js";
import { RotatingText } from "../components/TextEffects.jsx";
import BarStories from "../components/BarStories.jsx";
import { VIBES } from "../utils/vibes.js";
import { formatCurrency } from "../utils/format.js";
import * as t from "../texts/landing.js";
import "../styles/landing.css";
import "../styles/landing-bolso.css";

// A landing usa os bares de exemplo (mockBars) só como ilustração.
const VIBE_EMOJI = {
  barzinho: "🍻",
  "comer-bem": "🍽️",
  drinks: "🍸",
  "musica-ao-vivo": "🎶",
  festa: "🪩",
  date: "🕯️",
  "assistir-jogo": "⚽",
  rooftop: "🌆"
};

function LoginModal({ onClose, onCreateAccount, onAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback("");

    try {
      const { error } = await signIn(email.trim(), password);
      if (error) throw error;
      onAuthenticated();
    } catch (error) {
      setFeedback(getLoginError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="landing-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="landing-login-modal"
        aria-labelledby="landing-login-title"
        aria-modal="true"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="landing-modal-close" type="button" onClick={onClose} aria-label={t.loginModal.closeAria}>
          <X size={20} aria-hidden="true" />
        </button>
        <img className="landing-modal-logo" src={logoIcon} alt={t.nav.brandName} />
        <p className="landing-eyebrow">{t.loginModal.eyebrow}</p>
        <h2 id="landing-login-title">{t.loginModal.title} <span aria-hidden="true">🍻</span></h2>
        <p className="landing-modal-copy">{t.loginModal.copy}</p>

        <form className="landing-login-form" onSubmit={handleSubmit}>
          <label>
            <span>{t.loginModal.emailLabel}</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t.loginModal.emailPlaceholder}
              autoComplete="email"
              required
            />
          </label>
          <label>
            <span>{t.loginModal.passwordLabel}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t.loginModal.passwordPlaceholder}
              autoComplete="current-password"
              required
            />
          </label>
          <button className="landing-cta landing-cta-primary landing-login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t.loginModal.submitting : t.loginModal.submit}
            <ArrowUpRight size={18} aria-hidden="true" />
          </button>
          {feedback && <p className="landing-login-feedback">{feedback}</p>}
        </form>

        <div className="landing-social-divider"><span>{t.loginModal.divider}</span></div>
        <div className="landing-social-actions">
          <button type="button" onClick={() => setFeedback(t.loginModal.googleSoon)}>
            <span className="landing-google-mark">G</span> Google
          </button>
          <button type="button" onClick={() => setFeedback(t.loginModal.appleSoon)}>
            <Apple size={18} aria-hidden="true" /> Apple
          </button>
        </div>
        <p className="landing-modal-footer">
          {t.loginModal.noAccount} <button type="button" onClick={onCreateAccount}>{t.loginModal.createAccount}</button>
        </p>
      </section>
    </div>
  );
}

// Celular do topo: três telas que se revezam sozinhas (lista, bar e story).
function PhoneDemo() {
  const [screen, setScreen] = useState(0);
  const [list, featured, story] = [mockBars.slice(0, 3), mockBars[0], mockBars[5] ?? mockBars[1]];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timerId = window.setInterval(() => setScreen((current) => (current + 1) % 3), 3400);
    return () => window.clearInterval(timerId);
  }, []);

  const screenClass = (index) => `lpb-screen${screen === index ? " is-active" : ""}`;

  return (
    <div className="lpb-phone" role="img" aria-label={t.phone.ariaLabel}>
      <div className="lpb-island" />
      <div className="lpb-phone-screen">
        <section className={screenClass(0)}>
          <p className="lpb-k">{t.phone.greeting}</p>
          <p className="lpb-h">{t.phone.question}</p>
          <div className="lpb-search"><Search size={12} aria-hidden="true" /> {t.phone.search}</div>
          <div className="lpb-mini-stories">
            {mockBars.slice(0, 5).map((bar) => <i key={bar.id} style={{ backgroundImage: `url(${bar.image})` }} />)}
          </div>
          {list.map((bar) => (
            <div className="lpb-card" key={bar.id}>
              <i style={{ backgroundImage: `url(${bar.image})` }} />
              <div><b>{bar.name}</b><span>{bar.neighborhood}</span><em>{bar.promotion}</em></div>
            </div>
          ))}
        </section>
        <section className={screenClass(1)}>
          <div className="lpb-cover" style={{ backgroundImage: `url(${featured.image})` }} />
          <p className="lpb-ok">● {t.phone.openNow}</p>
          <p className="lpb-h">{featured.name}</p>
          <div className="lpb-promo"><small>{t.phone.promoLabel}</small>{featured.promotion}</div>
          {(featured.menu?.cervejas ?? []).map((item) => (
            <p className="lpb-item" key={item.name}><span>{item.name}</span><b>{formatCurrency(item.price)}</b></p>
          ))}
        </section>
        <section className={`${screenClass(2)} lpb-story`} style={{ backgroundImage: `linear-gradient(transparent 35%, rgba(0,0,0,.85)), url(${story.image})` }}>
          <div className="lpb-bars"><i /><i /></div>
          <p className="lpb-k">{t.phone.storyKicker}</p>
          <p className="lpb-h">{t.phone.storyTitle}</p>
          <p className="lpb-l">{t.phone.storyLine}</p>
          <span className="lpb-cta">{t.phone.storyCta}</span>
        </section>
      </div>
    </div>
  );
}

export default function LandingPage({ onExplore, onCreateAccount, onAuthenticated }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const FloatIcons = [BadgePercent, Music, Clock3];

  return (
    <main className="landing-page lpb">
      <nav className="lpb-nav" aria-label={t.nav.ariaLabel}>
        <a className="lpb-brand" href="#inicio" aria-label={t.nav.brandAria}>
          <img src={logoIcon} alt="" />
          <span>{t.nav.brandName}</span>
        </a>
        <div className="lpb-nav-links">
          <a href="#como-funciona">{t.nav.howItWorks}</a>
          <a href="#for-business">{t.nav.forBusiness}</a>
          <button type="button" onClick={() => setIsLoginOpen(true)}>{t.nav.login}</button>
        </div>
        <button className="lpb-btn lpb-btn-small" type="button" onClick={onExplore}>{t.nav.openApp}</button>
      </nav>

      <section className="lpb-hero" id="inicio">
        <p className="lpb-pill"><span className="lpb-dot" /> {t.hero.pill}</p>
        <h1>
          {t.hero.titulo} <span className="lpb-swap"><RotatingText items={t.hero.destaques} interval={2600} as="em" /></span>
        </h1>
        <p className="lpb-sub">{t.hero.description}</p>
        <div className="lpb-actions">
          <button className="lpb-btn" type="button" onClick={onExplore}>{t.hero.primaryButton} <ArrowUpRight size={18} aria-hidden="true" /></button>
          <a className="lpb-btn lpb-btn-ghost" href="#for-business">{t.hero.secondaryButton}</a>
        </div>
        <div className="lpb-phone-area">
          <PhoneDemo />
          {t.phone.floating.map((label, index) => {
            const Icon = FloatIcons[index];
            return <span className={`lpb-float f${index + 1}`} key={label} aria-hidden="true"><Icon size={16} /> {label}</span>;
          })}
        </div>
      </section>

      <section className="lpb-sec">
        <header className="lpb-head">
          <p className="lpb-eyebrow">{t.today.eyebrow}</p>
          <h2>{t.today.titulo} <em>{t.today.destaque}</em></h2>
          <p>{t.today.description}</p>
        </header>
        <div className="lpb-stories"><BarStories bars={mockBars} onSelectBar={onExplore} /></div>
      </section>

      <section className="lpb-sec">
        <header className="lpb-head">
          <p className="lpb-eyebrow">{t.nightTypesHeading.eyebrow}</p>
          <h2>{t.nightTypesHeading.titulo} <em>{t.nightTypesHeading.destaque}</em></h2>
        </header>
        <div className="lpb-vibes">
          {VIBES.map((vibe, index) => (
            <a className="lpb-vibe" href={`#clima/${vibe.id}`} key={vibe.id} onClick={() => window.scrollTo({ top: 0 })}>
              <img src={mockBars[index % mockBars.length]?.image} alt="" loading="lazy" />
              <span aria-hidden="true">{VIBE_EMOJI[vibe.id]}</span>
              <b>{vibe.label}</b>
            </a>
          ))}
        </div>
      </section>

      <section className="lpb-sec lpb-steps" id="como-funciona">
        <header className="lpb-head">
          <p className="lpb-eyebrow">{t.how.eyebrow}</p>
          <h2>{t.how.titulo} <em>{t.how.destaque}</em></h2>
        </header>
        {t.how.steps.map(({ title, description }, index) => {
          const Icon = [Search, Eye, Share2][index];
          return (
            <article className="lpb-step" style={{ "--n": index }} key={title}>
              <span><Icon size={26} aria-hidden="true" /></span>
              <small>0{index + 1}</small>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          );
        })}
      </section>

      <section className="lpb-sec">
        <div className="lpb-owners">
          <p className="lpb-eyebrow">{t.owners.eyebrow}</p>
          <h2>{t.owners.titulo} <em>{t.owners.destaque}</em></h2>
          <ul>{t.owners.perks.map((perk) => <li key={perk}><Check size={18} aria-hidden="true" /> {perk}</li>)}</ul>
          <a className="lpb-btn" href="#for-business">{t.owners.button}</a>
        </div>
      </section>

      <section className="landing-final-cta">
        <div className="lpb-rings" aria-hidden="true"><i /><i /><i /></div>
        <div className="landing-final-copy">
          <p className="landing-eyebrow">{t.finalCta.eyebrow}</p>
          <h2>{t.finalCta.titulo}<br /><em>{t.finalCta.destaque}</em></h2>
          <p>{t.finalCta.description}</p>
          <button className="landing-cta landing-cta-primary" type="button" onClick={onExplore}>{t.finalCta.button} <ArrowUpRight size={19} /></button>
        </div>
      </section>

      <footer className="lpb-footer">
        <a className="lpb-brand" href="#inicio"><img src={logoIcon} alt="" /><span>{t.nav.brandName}</span></a>
        <nav>
          <button type="button" onClick={onExplore}>{t.footer.explore}</button>
          <a href="#for-business">{t.footer.forBusiness}</a>
          <button type="button" onClick={() => setIsLoginOpen(true)}>{t.footer.login}</button>
        </nav>
        <p>{t.footer.tagline}</p>
      </footer>

      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} onCreateAccount={onCreateAccount} onAuthenticated={onAuthenticated} />}
    </main>
  );
}
