import { useEffect, useState } from "react";
import {
  Apple,
  BadgePercent,
  ArrowDownRight,
  ArrowUpRight,
  Beer,
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Flame,
  GlassWater,
  Heart,
  Instagram,
  LockKeyhole,
  MapPin,
  Menu,
  Music2,
  Search,
  Sparkles,
  Ticket,
  UsersRound,
  UtensilsCrossed,
  X
} from "lucide-react";
import { mockBars } from "../data/mockBars.js";
import { signIn } from "../services/authService.js";
import logoFull from "../assets/bora-bar-logo-full.png";
import logoIcon from "../assets/bora-bar-icon.png";
import landingBackdrop from "../assets/bora-bar-bg-test.png";
import landingBackdropMobile from "../assets/bora-bar-bg-mobile.png";
import { getLoginError } from "../texts/authErrors.js";
import { RevealWords, RotatingText } from "../components/TextEffects.jsx";
import * as t from "../texts/landing.js";
import "../styles/landing.css";

const discoveryBars = mockBars.slice(0, 3);

// Cada card leva à lista filtrada pelo clima (#clima/<id>, ver src/utils/vibes.js).
// O nome de cada card fica em texts/landing.js (nightTypeLabels).
const nightTypes = [
  { vibe: "barzinho", icon: Beer, image: discoveryBars[0]?.image },
  { vibe: "comer-bem", icon: UtensilsCrossed, image: discoveryBars[1]?.image },
  { vibe: "drinks", icon: GlassWater, image: discoveryBars[2]?.image },
  { vibe: "musica-ao-vivo", icon: Music2, image: mockBars[3]?.image },
  { vibe: "festa", icon: Sparkles, image: mockBars[4]?.image },
  { vibe: "date", icon: Heart, image: mockBars[5]?.image },
  { vibe: "assistir-jogo", icon: Ticket, image: discoveryBars[1]?.image },
  { vibe: "rooftop", icon: ArrowUpRight, image: discoveryBars[2]?.image }
];


function LandingMedia({ image, alt, className = "", priority = false }) {
  return (
    <img
      className={className}
      src={image}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

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

function AppPreview() {
  const [activeBar, setActiveBar] = useState(0);
  const bar = discoveryBars[activeBar] ?? discoveryBars[0];

  return (
    <div className="landing-phone" aria-label={t.preview.ariaLabel}>
      <div className="landing-phone-island" />
      <div className="landing-phone-top"><span>09:41</span><span>●●●</span></div>
      <div className="landing-phone-greeting">
        <div><p>{t.preview.greeting}</p><strong>{t.preview.question}</strong></div>
        <button type="button" aria-label={t.preview.notifications}><Sparkles size={16} /></button>
      </div>
      <div className="landing-phone-search"><Search size={15} /><span>{t.preview.search}</span></div>
      <div className="landing-phone-filters">
        {t.preview.filters.map((filter) => <span key={filter}>{filter}</span>)}
      </div>
      <button
        type="button"
        className="landing-phone-place"
        onClick={() => setActiveBar((current) => (current + 1) % discoveryBars.length)}
      >
        <LandingMedia image={bar?.image} alt="" />
        <div className="landing-phone-place-overlay">
          <span><Flame size={13} /> {t.preview.openNow}</span>
          <strong>{bar?.name}</strong>
          <p>{bar?.neighborhood} · {bar?.distanceKm?.toFixed(1).replace(".", ",")} km</p>
          <div><BadgePercent size={14} /> {t.preview.highlight}</div>
        </div>
      </button>
      <div className="landing-phone-nav"><MapPin size={17} /><Search size={17} /><Flame size={17} /><Heart size={17} /><CircleUserRound size={17} /></div>
    </div>
  );
}

export default function LandingPage({ onExplore, onCreateAccount, onAuthenticated }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <main className="landing-page">
      <section className="landing-hero" id="inicio">
        <picture className="landing-hero-media" aria-hidden="true">
          <source media="(max-width: 640px)" srcSet={landingBackdropMobile} />
          <img src={landingBackdrop} alt="" fetchPriority="high" />
        </picture>
        <div className="landing-hero-overlay" />
        <nav className="landing-nav" aria-label={t.nav.ariaLabel}>
          <a className="landing-brand" href="#inicio" aria-label={t.nav.brandAria}>
            <img src={logoIcon} alt="" />
            <span>{t.nav.brandName}</span>
          </a>
          <div className={isMenuOpen ? "landing-nav-links is-open" : "landing-nav-links"}>
            <a href="#descobrir" onClick={() => setIsMenuOpen(false)}>{t.nav.explore}</a>
            <a href="#como-funciona" onClick={() => setIsMenuOpen(false)}>{t.nav.howItWorks}</a>
            <button type="button" onClick={onCreateAccount}>{t.nav.forBusiness}</button>
          </div>
          <div className="landing-nav-actions">
            <button className="landing-nav-login" type="button" onClick={() => setIsLoginOpen(true)}>{t.nav.login}</button>
            <button className="landing-nav-menu" type="button" onClick={() => setIsMenuOpen((open) => !open)} aria-label={t.nav.openMenu}>
              <Menu size={20} aria-hidden="true" />
            </button>
          </div>
        </nav>

        <div className="landing-hero-content">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow"><span /> {t.hero.eyebrow}</p>
            <img className="landing-hero-logo" src={logoFull} alt={t.nav.brandName} />
            <h1><RevealWords text={t.hero.titulo} /><br /><em><RevealWords text={t.hero.destaque} start={2} /></em></h1>
            <p className="landing-hero-description">{t.hero.description}</p>
            <div className="landing-hero-actions">
              <button className="landing-cta landing-cta-primary" type="button" onClick={() => setIsLoginOpen(true)}>{t.hero.primaryButton} <ArrowUpRight size={19} aria-hidden="true" /></button>
              <button className="landing-cta landing-cta-secondary" type="button" onClick={onCreateAccount}>{t.hero.secondaryButton}</button>
            </div>
          </div>
          <div className="landing-hero-signal">
            <div className="landing-live-dot" />
            <span>{t.hero.signalLabel}</span>
            <RotatingText items={t.hero.signalTexts} />
          </div>
        </div>
        <a className="landing-scroll-cue" href="#descobrir"><span>{t.hero.scrollCue}</span><ArrowDownRight size={18} /></a>
      </section>

      <section className="landing-discovery landing-section" id="descobrir">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">{t.discovery.eyebrow}</p>
          <h2>{t.discovery.titulo}<br /><em>{t.discovery.destaque}</em></h2>
          <p>{t.discovery.description}</p>
        </div>
        <div className="landing-discovery-layout">
          <AppPreview />
          <div className="landing-discovery-list">
            {discoveryBars.map((bar, index) => (
              <article className="landing-place-row" key={bar.id}>
                <LandingMedia image={bar.image} alt="" />
                <div>
                  <span className={index === 0 ? "landing-place-live" : "landing-place-tag"}>{index === 0 ? <><Flame size={13} /> {t.discovery.placeTags[0]}</> : t.discovery.placeTags[index]}</span>
                  <h3>{bar.name}</h3>
                  <p><MapPin size={14} /> {bar.distanceKm.toFixed(1).replace(".", ",")} km · {bar.neighborhood}</p>
                </div>
                <div className="landing-place-meta"><span><BadgePercent size={14} /> {t.discovery.placeHighlights[index]}</span></div>
              </article>
            ))}
            <button className="landing-text-link" type="button" onClick={onExplore}>{t.discovery.exploreLink} <ChevronRight size={17} /></button>
          </div>
        </div>
      </section>

      <section className="landing-types landing-section">
        <div className="landing-types-heading">
          <p className="landing-eyebrow">{t.nightTypesHeading.eyebrow}</p>
          <h2>{t.nightTypesHeading.titulo}<br /><em>{t.nightTypesHeading.destaque}</em></h2>
        </div>
        <div className="landing-types-grid">
          {nightTypes.map(({ vibe, icon: Icon, image }, index) => {
            const label = t.nightTypeLabels[vibe];
            return (
            <button
              className={`landing-type-card type-${index + 1}`}
              type="button"
              key={label}
              onClick={() => {
                window.location.hash = `clima/${vibe}`;
                window.scrollTo({ top: 0 });
              }}
            >
              <LandingMedia image={image} alt="" />
              <span className="landing-type-shade" />
              <Icon size={20} aria-hidden="true" />
              <strong>{label}</strong>
              <ArrowUpRight className="landing-type-arrow" size={19} aria-hidden="true" />
            </button>
            );
          })}
        </div>
      </section>

      <section className="landing-how landing-section" id="como-funciona">
        <div className="landing-how-heading"><p className="landing-eyebrow">{t.how.eyebrow}</p><h2>{t.how.titulo}<br /><em>{t.how.destaque}</em></h2></div>
        <div className="landing-steps">
          {t.how.steps.map(({ title, description }, index) => {
            const StepIcon = [MapPin, Clock3, UsersRound][index];
            return (
              <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><StepIcon size={28} /><h3>{title}</h3><p>{description}</p></article>
            );
          })}
        </div>
      </section>

      <section className="landing-final-cta">
        <picture className="landing-final-media" aria-hidden="true"><source media="(max-width: 640px)" srcSet={landingBackdropMobile} /><img src={landingBackdrop} alt="" loading="lazy" /></picture>
        <div className="landing-final-overlay" />
        <div className="landing-final-copy"><p className="landing-eyebrow">{t.finalCta.eyebrow}</p><h2>{t.finalCta.titulo}<br /><em>{t.finalCta.destaque}</em></h2><p>{t.finalCta.description}</p><button className="landing-cta landing-cta-primary" type="button" onClick={() => setIsLoginOpen(true)}>{t.finalCta.button} <ArrowUpRight size={19} /></button></div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-brand"><img src={logoIcon} alt="" /><strong>{t.nav.brandName}</strong><p>{t.footer.tagline}</p></div>
        <div className="landing-footer-links"><a href="#descobrir">{t.footer.explore}</a><button type="button" onClick={onCreateAccount}>{t.footer.forBusiness}</button><a href="#como-funciona">{t.footer.about}</a><a href="#inicio">{t.footer.terms}</a><a href="#inicio">{t.footer.privacy}</a></div>
        <div className="landing-footer-social"><a href="#inicio" aria-label="Instagram"><Instagram size={19} /></a><a href="#inicio" aria-label="TikTok"><Music2 size={19} /></a></div>
      </footer>

      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} onCreateAccount={onCreateAccount} onAuthenticated={onAuthenticated} />}
    </main>
  );
}
