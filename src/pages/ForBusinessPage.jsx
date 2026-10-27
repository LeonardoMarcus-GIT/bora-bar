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

import { SALES_WHATSAPP_URL, FOUNDER_SPOTS, FOUNDER_CITY } from "../texts/contact.js";
import { benefits, founderPerks, steps } from "../texts/forBusiness.js";

// Ícone de cada benefício, na mesma ordem de `benefits` em texts/forBusiness.js.
const benefitIcons = [UtensilsCrossed, Megaphone, BarChart3];

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
          {benefits.map(({ title, description }, index) => {
            const Icon = benefitIcons[index];
            return (
              <article className="business-benefit" key={title}>
                <Icon size={22} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="for-business-section business-steps-section">
        <div className="for-business-section-heading">
          <p className="section-kicker">Como entrar</p>
          <h2>Do primeiro contato ao bar no ar</h2>
        </div>
        <ol className="business-steps">
          {steps.map(({ title, description }, index) => (
            <li key={title}>
              <span>{index + 1}</span>
              <div><strong>{title}</strong><p>{description}</p></div>
            </li>
          ))}
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
