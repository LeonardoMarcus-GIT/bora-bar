import { useEffect, useState } from "react";
import {
  Apple,
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
  LocateFixed,
  LockKeyhole,
  MapPin,
  Menu,
  Music2,
  Play,
  Search,
  Sparkles,
  Star,
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
import "./LandingPage.css";

const discoveryBars = mockBars.slice(0, 3);

const nightTypes = [
  { label: "Barzinho", icon: Beer, image: discoveryBars[0]?.image },
  { label: "Comer bem", icon: UtensilsCrossed, image: discoveryBars[1]?.image },
  { label: "Drinks", icon: GlassWater, image: discoveryBars[2]?.image },
  { label: "Música ao vivo", icon: Music2, image: mockBars[3]?.image },
  { label: "Festa", icon: Sparkles, image: mockBars[4]?.image },
  { label: "Date", icon: Heart, image: mockBars[5]?.image },
  { label: "Assistir jogo", icon: Ticket, image: discoveryBars[1]?.image },
  { label: "Rooftop", icon: ArrowUpRight, image: discoveryBars[2]?.image }
];

const stories = [
  {
    label: "Tá bombando",
    icon: Flame,
    title: "A noite começa no primeiro brinde.",
    image: discoveryBars[0]?.image
  },
  {
    label: "Happy Hour começou",
    icon: Beer,
    title: "Chopp gelado, conversa solta.",
    image: discoveryBars[1]?.image
  },
  {
    label: "Música ao vivo agora",
    icon: Music2,
    title: "Seu próximo refrão favorito.",
    image: discoveryBars[2]?.image
  }
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

function getLoginError(error) {
  const message = String(error?.message ?? "").toLowerCase();

  if (message.includes("invalid") || message.includes("credentials")) {
    return "E-mail ou senha incorretos.";
  }

  if (message.includes("confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }

  return "Não foi possível entrar agora. Tente novamente.";
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
        <button className="landing-modal-close" type="button" onClick={onClose} aria-label="Fechar login">
          <X size={20} aria-hidden="true" />
        </button>
        <img className="landing-modal-logo" src={logoIcon} alt="Bora Bar" />
        <p className="landing-eyebrow">Sua noite começa agora</p>
        <h2 id="landing-login-title">Bora? <span aria-hidden="true">🍻</span></h2>
        <p className="landing-modal-copy">Entre e descubra onde a noite vai te levar.</p>

        <form className="landing-login-form" onSubmit={handleSubmit}>
          <label>
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@email.com"
              autoComplete="email"
              required
            />
          </label>
          <label>
            <span>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Sua senha"
              autoComplete="current-password"
              required
            />
          </label>
          <button className="landing-cta landing-cta-primary landing-login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar"}
            <ArrowUpRight size={18} aria-hidden="true" />
          </button>
          {feedback && <p className="landing-login-feedback">{feedback}</p>}
        </form>

        <div className="landing-social-divider"><span>ou entre com</span></div>
        <div className="landing-social-actions">
          <button type="button" onClick={() => setFeedback("Login com Google estará disponível em breve.")}>
            <span className="landing-google-mark">G</span> Google
          </button>
          <button type="button" onClick={() => setFeedback("Login com Apple estará disponível em breve.")}>
            <Apple size={18} aria-hidden="true" /> Apple
          </button>
        </div>
        <p className="landing-modal-footer">
          Ainda não tem conta? <button type="button" onClick={onCreateAccount}>Criar conta</button>
        </p>
      </section>
    </div>
  );
}

function AppPreview() {
  const [activeBar, setActiveBar] = useState(0);
  const bar = discoveryBars[activeBar] ?? discoveryBars[0];

  return (
    <div className="landing-phone" aria-label="Prévia do aplicativo Bora Bar">
      <div className="landing-phone-island" />
      <div className="landing-phone-top"><span>09:41</span><span>●●●</span></div>
      <div className="landing-phone-greeting">
        <div><p>Boa noite, Leo</p><strong>Qual vai ser hoje?</strong></div>
        <button type="button" aria-label="Ver notificações"><Sparkles size={16} /></button>
      </div>
      <div className="landing-phone-search"><Search size={15} /><span>Bar, bairro ou cidade</span></div>
      <div className="landing-phone-filters"><span>Todos</span><span>Happy hour</span><span>Ao vivo</span></div>
      <button
        type="button"
        className="landing-phone-place"
        onClick={() => setActiveBar((current) => (current + 1) % discoveryBars.length)}
      >
        <LandingMedia image={bar?.image} alt="" />
        <div className="landing-phone-place-overlay">
          <span><Flame size={13} /> Bombando agora</span>
          <strong>{bar?.name}</strong>
          <p>{bar?.neighborhood} · {bar?.distanceKm?.toFixed(1).replace(".", ",")} km</p>
          <div><Star size={14} fill="currentColor" /> 4,8 <small>· 86 pessoas</small></div>
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
        <nav className="landing-nav" aria-label="Navegação da página">
          <a className="landing-brand" href="#inicio" aria-label="Bora Bar, início">
            <img src={logoIcon} alt="" />
            <span>Bora Bar</span>
          </a>
          <div className={isMenuOpen ? "landing-nav-links is-open" : "landing-nav-links"}>
            <a href="#descobrir" onClick={() => setIsMenuOpen(false)}>Explorar</a>
            <a href="#como-funciona" onClick={() => setIsMenuOpen(false)}>Como funciona</a>
            <button type="button" onClick={onCreateAccount}>Para estabelecimentos</button>
          </div>
          <div className="landing-nav-actions">
            <button className="landing-nav-login" type="button" onClick={() => setIsLoginOpen(true)}>Entrar</button>
            <button className="landing-nav-menu" type="button" onClick={() => setIsMenuOpen((open) => !open)} aria-label="Abrir menu">
              <Menu size={20} aria-hidden="true" />
            </button>
          </div>
        </nav>

        <div className="landing-hero-content">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow"><span /> A cidade está chamando</p>
            <img className="landing-hero-logo" src={logoFull} alt="Bora Bar" />
            <h1>Seu rolê<br /><em>começa aqui.</em></h1>
            <p className="landing-hero-description">Descubra bares, restaurantes e lugares que combinam com você. Veja onde a galera está indo e escolha o próximo rolê sem perder tempo.</p>
            <div className="landing-hero-actions">
              <button className="landing-cta landing-cta-primary" type="button" onClick={() => setIsLoginOpen(true)}>Bora? <ArrowUpRight size={19} aria-hidden="true" /></button>
              <button className="landing-cta landing-cta-secondary" type="button" onClick={onCreateAccount}>Criar minha conta</button>
            </div>
          </div>
          <div className="landing-hero-signal">
            <div className="landing-live-dot" />
            <span>Agora em Volta Redonda</span>
            <strong>38 lugares abertos</strong>
          </div>
        </div>
        <a className="landing-scroll-cue" href="#descobrir"><span>Conheça o Bora Bar</span><ArrowDownRight size={18} /></a>
      </section>

      <section className="landing-discovery landing-section" id="descobrir">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">Descoberta sem enrolação</p>
          <h2>Nunca mais fique meia hora<br /><em>decidindo onde ir.</em></h2>
          <p>Do boteco da esquina ao rooftop que está cheio de energia, o Bora Bar deixa o clima da cidade visível antes de você sair de casa.</p>
        </div>
        <div className="landing-discovery-layout">
          <AppPreview />
          <div className="landing-discovery-list">
            {discoveryBars.map((bar, index) => (
              <article className="landing-place-row" key={bar.id}>
                <LandingMedia image={bar.image} alt="" />
                <div>
                  <span className={index === 0 ? "landing-place-live" : "landing-place-tag"}>{index === 0 ? <><Flame size={13} /> Bombando agora</> : index === 1 ? "🍻 Happy hour" : "🎸 Música ao vivo"}</span>
                  <h3>{bar.name}</h3>
                  <p><MapPin size={14} /> {bar.distanceKm.toFixed(1).replace(".", ",")} km · {bar.neighborhood}</p>
                </div>
                <div className="landing-place-meta"><span><UsersRound size={15} /> {index === 0 ? 86 : index === 1 ? 42 : 61}</span><strong>4,{8 - index}</strong></div>
              </article>
            ))}
            <button className="landing-text-link" type="button" onClick={onExplore}>Explorar lugares perto de mim <ChevronRight size={17} /></button>
          </div>
        </div>
      </section>

      <section className="landing-map-section landing-section" id="movimento">
        <div className="landing-map-copy">
          <p className="landing-eyebrow">O pulso da cidade</p>
          <h2>Veja o que está<br /><em>rolando agora.</em></h2>
          <p>Os lugares ganham vida no mapa para você sentir o movimento e escolher o momento certo de chegar.</p>
          <button className="landing-cta landing-cta-primary" type="button" onClick={onExplore}>Abrir o mapa <LocateFixed size={18} /></button>
        </div>
        <div className="landing-map-canvas" aria-label="Mapa ilustrativo com estabelecimentos próximos">
          <div className="landing-map-grid" />
          <div className="landing-map-road road-one" /><div className="landing-map-road road-two" /><div className="landing-map-road road-three" />
          <div className="landing-map-pin pin-main"><span><Flame size={17} /></span><div><strong>Bar do Centro</strong><small>Bombando</small></div></div>
          <div className="landing-map-pin pin-rooftop"><span><UsersRound size={16} /></span><div><strong>Rooftop 360</strong><small>82 pessoas</small></div></div>
          <div className="landing-map-pin pin-music"><span><Music2 size={16} /></span><div><strong>Boteco 21</strong><small>Música ao vivo</small></div></div>
          <div className="landing-map-pin pin-pizza"><span><UtensilsCrossed size={16} /></span><div><strong>Casa Pizza</strong><small>Mesas disponíveis</small></div></div>
          <div className="landing-map-you"><span /> Você está aqui</div>
        </div>
      </section>

      <section className="landing-types landing-section">
        <div className="landing-types-heading">
          <p className="landing-eyebrow">Do seu jeito</p>
          <h2>Qual é o rolê<br /><em>de hoje?</em></h2>
        </div>
        <div className="landing-types-grid">
          {nightTypes.map(({ label, icon: Icon, image }, index) => (
            <button className={`landing-type-card type-${index + 1}`} type="button" key={label} onClick={onExplore}>
              <LandingMedia image={image} alt="" />
              <span className="landing-type-shade" />
              <Icon size={20} aria-hidden="true" />
              <strong>{label}</strong>
              <ArrowUpRight className="landing-type-arrow" size={19} aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className="landing-how landing-section" id="como-funciona">
        <div className="landing-how-heading"><p className="landing-eyebrow">Sem complicação</p><h2>Descubra. Combine.<br /><em>Bora.</em></h2></div>
        <div className="landing-steps">
          <article><span>01</span><MapPin size={28} /><h3>Descubra</h3><p>Encontre lugares próximos que combinam com você.</p></article>
          <article><span>02</span><Flame size={28} /><h3>Veja o movimento</h3><p>Descubra quais lugares estão tranquilos e quais estão bombando.</p></article>
          <article><span>03</span><UsersRound size={28} /><h3>Chama a galera</h3><p>Compartilhe o lugar e transforme o plano em rolê.</p></article>
        </div>
      </section>

      <section className="landing-stories landing-section">
        <div className="landing-stories-heading"><p className="landing-eyebrow">Experiências reais</p><h2>Encontre o clima<br /><em>que você procura.</em></h2><p>Um gostinho da noite, do jeito que ela é.</p></div>
        <div className="landing-stories-row">
          {stories.map(({ label, icon: Icon, title, image }, index) => (
            <article className={`landing-story story-${index + 1}`} key={label}>
              <LandingMedia image={image} alt="" />
              <span className="landing-story-glow" />
              <div className="landing-story-top"><span><Icon size={15} aria-hidden="true" /> {label}</span><button type="button" aria-label="Reproduzir experiência"><Play size={15} fill="currentColor" /></button></div>
              <h3>{title}</h3>
              <p>Experiência Bora Bar</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-final-cta">
        <picture className="landing-final-media" aria-hidden="true"><source media="(max-width: 640px)" srcSet={landingBackdropMobile} /><img src={landingBackdrop} alt="" loading="lazy" /></picture>
        <div className="landing-final-overlay" />
        <div className="landing-final-copy"><p className="landing-eyebrow">A cidade está viva</p><h2>A noite já<br /><em>começou.</em></h2><p>Só falta você decidir onde.</p><button className="landing-cta landing-cta-primary" type="button" onClick={() => setIsLoginOpen(true)}>Bora? <ArrowUpRight size={19} /></button></div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-brand"><img src={logoIcon} alt="" /><strong>Bora Bar</strong><p>Bora Bar — encontre seu próximo rolê.</p></div>
        <div className="landing-footer-links"><a href="#descobrir">Explorar</a><button type="button" onClick={onCreateAccount}>Para estabelecimentos</button><a href="#como-funciona">Sobre</a><a href="#inicio">Termos</a><a href="#inicio">Privacidade</a></div>
        <div className="landing-footer-social"><a href="#inicio" aria-label="Instagram"><Instagram size={19} /></a><a href="#inicio" aria-label="TikTok"><Music2 size={19} /></a></div>
      </footer>

      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} onCreateAccount={onCreateAccount} onAuthenticated={onAuthenticated} />}
    </main>
  );
}
