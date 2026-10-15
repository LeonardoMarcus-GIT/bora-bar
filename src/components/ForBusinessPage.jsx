import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  Megaphone,
  MessageCircle,
  Store,
  UtensilsCrossed
} from "lucide-react";

// Contato comercial do Bora Bar (quem vende). Não confundir com o WhatsApp de
// cada bar, que o próprio dono cadastra no painel.
const SALES_WHATSAPP = "5524992196584";
const SALES_MESSAGE =
  "Olá! Tenho um bar e quero saber mais sobre o programa Parceiro Fundador do Bora Bar.";
const SALES_WHATSAPP_URL = `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(SALES_MESSAGE)}`;

const FOUNDER_SPOTS = 10;
const FOUNDER_CITY = "Volta Redonda";

const benefits = [
  {
    icon: UtensilsCrossed,
    title: "Cardápio sempre atualizado",
    description: "Altere itens, preços e disponibilidade pelo celular, na hora que precisar."
  },
  {
    icon: Megaphone,
    title: "Promoções e eventos",
    description: "Publique o samba de hoje e o chopp em dobro: motivos reais para o cliente escolher seu bar."
  },
  {
    icon: BarChart3,
    title: "Interesse dos clientes",
    description: "Veja quantas pessoas abriram sua página, chamaram no WhatsApp, ligaram e pediram rota."
  }
];

const founderPerks = [
  "Sem cartão e sem contrato",
  "A gente cadastra seu bar: cardápio, fotos e horários",
  "Aberto/fechado automático pelo seu horário",
  "Condição especial garantida para os primeiros parceiros",
  "Cancele quando quiser"
];

export default function ForBusinessPage({ onBack, onGetStarted }) {
  function scrollToOffer() {
    document.querySelector("#founder-offer")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main className="for-business-page">
      <section className="for-business-hero">
        <div className="for-business-topbar">
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={18} aria-hidden="true" />
            Voltar
          </button>
          <span className="for-business-mark">
            <Store size={18} aria-hidden="true" />
            Bora Bar para estabelecimentos
          </span>
        </div>

        <div className="for-business-hero-copy">
          <p className="section-kicker">Seu bar mais fácil de encontrar</p>
          <h1>Mostre o que seu estabelecimento tem de melhor.</h1>
          <p>
            Mantenha cardápio, preços, promoções e eventos atualizados para o
            cliente decidir antes de sair de casa.
          </p>
          <div className="for-business-actions">
            <a
              className="primary-action"
              href={SALES_WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={18} aria-hidden="true" />
              Quero ser parceiro
            </a>
            <button className="secondary-action" type="button" onClick={scrollToOffer}>
              Ver a condição de lançamento
            </button>
          </div>
        </div>

        <div className="for-business-proof" aria-label="Benefícios principais">
          <span><BadgeCheck size={18} aria-hidden="true" /> Controle pelo celular</span>
          <span><CalendarDays size={18} aria-hidden="true" /> Atualização em minutos</span>
          <span><BarChart3 size={18} aria-hidden="true" /> Interesse mensurável</span>
        </div>
      </section>

      <section className="for-business-section">
        <div className="for-business-section-heading">
          <p className="section-kicker">Feito para a rotina do bar</p>
          <h2>Uma presença digital simples de cuidar</h2>
        </div>
        <div className="business-benefit-grid">
          {benefits.map(({ icon: Icon, title, description }) => (
            <article className="business-benefit" key={title}>
              <Icon size={22} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="for-business-section business-steps-section">
        <div className="for-business-section-heading">
          <p className="section-kicker">Como entrar</p>
          <h2>Do primeiro contato ao bar no ar</h2>
        </div>
        <ol className="business-steps">
          <li><span>1</span><div><strong>Chame no WhatsApp</strong><p>Conte qual é o seu bar. A conversa é direta com a gente.</p></div></li>
          <li><span>2</span><div><strong>A gente monta sua página</strong><p>Cadastramos cardápio, fotos, endereço e horários para você.</p></div></li>
          <li><span>3</span><div><strong>Você atualiza pelo celular</strong><p>Com seu acesso ao painel, muda preços, promoções e eventos quando quiser.</p></div></li>
        </ol>
      </section>

      <section className="for-business-section" id="founder-offer">
        <div className="for-business-section-heading">
          <p className="section-kicker">Condição de lançamento</p>
          <h2>Programa Parceiro Fundador</h2>
        </div>
        <article className="business-plan is-featured founder-offer">
          <div>
            <span className="plan-badge">
              Vagas para os {FOUNDER_SPOTS} primeiros bares de {FOUNDER_CITY}
            </span>
            <strong className="plan-price">30 dias grátis</strong>
            <p>
              Entre agora, use tudo por um mês sem pagar nada e decida depois.
              Quem entra como fundador garante uma condição especial enquanto
              continuar com a gente.
            </p>
            <a
              className="primary-action"
              href={SALES_WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={18} aria-hidden="true" />
              Quero minha vaga
            </a>
          </div>
          <ul>
            {founderPerks.map((perk) => (
              <li key={perk}><Check size={16} aria-hidden="true" />{perk}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="for-business-final">
        <div>
          <p className="section-kicker">Já é parceiro?</p>
          <h2>Entre no painel e atualize seu bar.</h2>
        </div>
        <button className="secondary-action" type="button" onClick={onGetStarted}>
          Entrar na área do estabelecimento
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </section>
    </main>
  );
}
