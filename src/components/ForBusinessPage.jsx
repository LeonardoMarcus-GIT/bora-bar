import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  Megaphone,
  Store,
  UtensilsCrossed
} from "lucide-react";

const benefits = [
  {
    icon: UtensilsCrossed,
    title: "Cardápio sempre atualizado",
    description: "Altere itens, preços e disponibilidade sem depender de suporte."
  },
  {
    icon: Megaphone,
    title: "Promoções e eventos",
    description: "Publique motivos reais para o cliente escolher seu bar hoje."
  },
  {
    icon: BarChart3,
    title: "Interesse dos clientes",
    description: "Acompanhe visitas, rotas, ligações, WhatsApp e favoritos."
  }
];

const plans = [
  {
    name: "Presença",
    price: "Grátis",
    description: "Para manter as informações essenciais corretas.",
    features: ["Perfil público", "Cardápio e preços", "Horários e contato"]
  },
  {
    name: "Destaque",
    price: "Em breve",
    description: "Para aparecer mais nas buscas da sua região.",
    featured: true,
    features: ["Tudo do Presença", "Posição de destaque", "Promoções impulsionadas"]
  },
  {
    name: "Parceiro",
    price: "Em breve",
    description: "Para transformar atenção em visitas recorrentes.",
    features: ["Tudo do Destaque", "Métricas ampliadas", "Campanhas e suporte prioritário"]
  }
];

export default function ForBusinessPage({ onBack, onGetStarted }) {
  function scrollToPlans() {
    document.querySelector("#business-plans")?.scrollIntoView({ behavior: "smooth" });
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
            <button className="primary-action" type="button" onClick={onGetStarted}>
              Cadastrar ou administrar meu bar
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            <button className="secondary-action" type="button" onClick={scrollToPlans}>
              Conhecer os planos
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
          <h2>Do pedido ao perfil publicado</h2>
        </div>
        <ol className="business-steps">
          <li><span>1</span><div><strong>Crie sua conta</strong><p>Use o email do responsável pelo estabelecimento.</p></div></li>
          <li><span>2</span><div><strong>Solicite o acesso</strong><p>Selecione o bar e informe um contato para confirmação.</p></div></li>
          <li><span>3</span><div><strong>Comece a publicar</strong><p>Após a aprovação, o painel fica liberado para sua equipe.</p></div></li>
        </ol>
      </section>

      <section className="for-business-section" id="business-plans">
        <div className="for-business-section-heading">
          <p className="section-kicker">Planos</p>
          <h2>Comece sem custo e cresça quando fizer sentido</h2>
        </div>
        <div className="business-plan-grid">
          {plans.map((plan) => (
            <article
              className={`business-plan ${plan.featured ? "is-featured" : ""}`}
              key={plan.name}
            >
              {plan.featured && <span className="plan-badge">Mais visibilidade</span>}
              <h3>{plan.name}</h3>
              <strong className="plan-price">{plan.price}</strong>
              <p>{plan.description}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="for-business-final">
        <div>
          <p className="section-kicker">Pronto para começar?</p>
          <h2>Coloque seu bar no caminho de quem já está procurando.</h2>
        </div>
        <button className="primary-action" type="button" onClick={onGetStarted}>
          Entrar na área do estabelecimento
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </section>
    </main>
  );
}
