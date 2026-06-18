import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock3,
  Image,
  MapPin,
  Phone,
  Plus,
  Save,
  Store,
  Tag,
  Trash2,
  UtensilsCrossed
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  createBarClaim,
  fetchBusinessAccess,
  fetchManagedBarData,
  replaceManagedEvents,
  replaceManagedMenu,
  replaceManagedPromotions,
  updateManagedBar
} from "../services/businessService.js";

const tabs = [
  { id: "overview", label: "Informacoes", icon: Store },
  { id: "menu", label: "Cardapio", icon: UtensilsCrossed },
  { id: "promotions", label: "Promocoes", icon: Tag },
  { id: "events", label: "Eventos", icon: CalendarDays }
];

function createTemporaryId() {
  return crypto.randomUUID();
}

function emptyCategory() {
  return {
    id: createTemporaryId(),
    name: "",
    slug: "",
    isActive: true,
    items: []
  };
}

function emptyMenuItem() {
  return {
    id: createTemporaryId(),
    name: "",
    description: "",
    price: "",
    isAvailable: true
  };
}

function emptyPromotion() {
  return {
    id: createTemporaryId(),
    title: "",
    description: "",
    startsAt: "",
    endsAt: "",
    isActive: true
  };
}

function emptyEvent() {
  return {
    id: createTemporaryId(),
    title: "",
    description: "",
    startsAt: "",
    endsAt: "",
    price: "",
    isActive: true
  };
}

function legacyMenuToCategories(menu = {}) {
  return Object.entries(menu).map(([name, items]) => ({
    id: createTemporaryId(),
    name,
    slug: name,
    isActive: true,
    items: items.map((item) => ({
      id: createTemporaryId(),
      name: item.name,
      description: item.description ?? "",
      price: item.price,
      isAvailable: true
    }))
  }));
}

function toDateTimeInput(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function toIsoDate(value) {
  return value ? new Date(value).toISOString() : "";
}

function normalizeTimedItems(items) {
  return items.map((item) => ({
    ...item,
    startsAt: toDateTimeInput(item.startsAt),
    endsAt: toDateTimeInput(item.endsAt)
  }));
}

function getClaimStatusLabel(status) {
  if (status === "approved") {
    return "Aprovado";
  }

  if (status === "rejected") {
    return "Nao aprovado";
  }

  return "Em analise";
}

export default function BusinessDashboard({
  bars,
  onBack,
  onDataChanged,
  onLoginRequired
}) {
  const { isAuthReady, user } = useAuth();
  const [access, setAccess] = useState({ memberships: [], claims: [] });
  const [selectedBarId, setSelectedBarId] = useState("");
  const [managedData, setManagedData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [setupError, setSetupError] = useState(false);
  const [claim, setClaim] = useState({
    barId: "",
    contactName: "",
    contactPhone: "",
    businessDocument: "",
    message: ""
  });

  const pendingBarIds = useMemo(
    () =>
      new Set(
        access.claims
          .filter((item) => item.status === "pending")
          .map((item) => item.barId)
      ),
    [access.claims]
  );

  const availableBars = useMemo(
    () =>
      bars.filter(
        (bar) =>
          !pendingBarIds.has(bar.id) &&
          !access.memberships.some((membership) => membership.barId === bar.id)
      ),
    [access.memberships, bars, pendingBarIds]
  );

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!user) {
      onLoginRequired();
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setSetupError(false);
    setFeedback("");
    setClaim((currentClaim) => ({
      ...currentClaim,
      contactName:
        currentClaim.contactName ||
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] ||
        ""
    }));

    fetchBusinessAccess(user.id)
      .then((nextAccess) => {
        if (!isMounted) {
          return;
        }

        setAccess(nextAccess);
        setSelectedBarId((currentBarId) => {
          if (
            currentBarId &&
            nextAccess.memberships.some(
              (membership) => membership.barId === currentBarId
            )
          ) {
            return currentBarId;
          }

          return nextAccess.memberships[0]?.barId ?? "";
        });
      })
      .catch(() => {
        if (isMounted) {
          setSetupError(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthReady, onLoginRequired, user]);

  useEffect(() => {
    if (!selectedBarId) {
      setManagedData(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setFeedback("");

    fetchManagedBarData(selectedBarId)
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setManagedData({
          ...data,
          categories: data.categories.length
            ? data.categories
            : legacyMenuToCategories(data.bar.legacyMenu),
          promotions: normalizeTimedItems(data.promotions),
          events: normalizeTimedItems(data.events)
        });
      })
      .catch(() => {
        if (isMounted) {
          setFeedback("Nao foi possivel carregar os dados do estabelecimento.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBarId]);

  async function handleClaimSubmit(event) {
    event.preventDefault();

    if (!claim.barId || !claim.contactName.trim() || !claim.contactPhone.trim()) {
      setFeedback("Selecione o bar e preencha seu nome e telefone.");
      return;
    }

    setIsSaving(true);
    setFeedback("");

    try {
      const nextClaim = await createBarClaim(user.id, claim);
      setAccess((currentAccess) => ({
        ...currentAccess,
        claims: [nextClaim, ...currentAccess.claims]
      }));
      setClaim((currentClaim) => ({
        ...currentClaim,
        barId: "",
        businessDocument: "",
        message: ""
      }));
      setFeedback("Solicitacao enviada. Vamos verificar o vinculo com o bar.");
    } catch (error) {
      const message = `${error?.message ?? ""} ${error?.code ?? ""}`.toLowerCase();
      setFeedback(
        message.includes("duplicate")
          ? "Ja existe uma solicitacao em analise para esse bar."
          : "Nao foi possivel enviar a solicitacao agora."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function updateBar(patch) {
    setManagedData((currentData) => ({
      ...currentData,
      bar: { ...currentData.bar, ...patch }
    }));
  }

  function updateCategory(categoryId, patch) {
    setManagedData((currentData) => ({
      ...currentData,
      categories: currentData.categories.map((category) =>
        category.id === categoryId ? { ...category, ...patch } : category
      )
    }));
  }

  function updateMenuItem(categoryId, itemId, patch) {
    setManagedData((currentData) => ({
      ...currentData,
      categories: currentData.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              items: category.items.map((item) =>
                item.id === itemId ? { ...item, ...patch } : item
              )
            }
          : category
      )
    }));
  }

  function addMenuItem(categoryId) {
    setManagedData((currentData) => ({
      ...currentData,
      categories: currentData.categories.map((category) =>
        category.id === categoryId
          ? { ...category, items: [...category.items, emptyMenuItem()] }
          : category
      )
    }));
  }

  function removeMenuItem(categoryId, itemId) {
    setManagedData((currentData) => ({
      ...currentData,
      categories: currentData.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              items: category.items.filter((item) => item.id !== itemId)
            }
          : category
      )
    }));
  }

  function updateListItem(listName, itemId, patch) {
    setManagedData((currentData) => ({
      ...currentData,
      [listName]: currentData[listName].map((item) =>
        item.id === itemId ? { ...item, ...patch } : item
      )
    }));
  }

  function removeListItem(listName, itemId) {
    setManagedData((currentData) => ({
      ...currentData,
      [listName]: currentData[listName].filter((item) => item.id !== itemId)
    }));
  }

  async function saveCurrentTab() {
    if (!managedData) {
      return;
    }

    setIsSaving(true);
    setFeedback("");

    try {
      if (activeTab === "overview") {
        const nextBar = await updateManagedBar(selectedBarId, managedData.bar);
        setManagedData((currentData) => ({ ...currentData, bar: nextBar }));
      }

      if (activeTab === "menu") {
        await replaceManagedMenu(selectedBarId, managedData.categories);
      }

      if (activeTab === "promotions") {
        await replaceManagedPromotions(
          selectedBarId,
          managedData.promotions.map((promotion) => ({
            ...promotion,
            startsAt: toIsoDate(promotion.startsAt),
            endsAt: toIsoDate(promotion.endsAt)
          }))
        );
      }

      if (activeTab === "events") {
        await replaceManagedEvents(
          selectedBarId,
          managedData.events.map((item) => ({
            ...item,
            startsAt: toIsoDate(item.startsAt),
            endsAt: toIsoDate(item.endsAt)
          }))
        );
      }

      setFeedback("Alteracoes salvas e publicadas.");
      onDataChanged?.();
    } catch {
      setFeedback("Nao foi possivel salvar agora. Verifique os campos e tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isAuthReady || isLoading) {
    return (
      <main className="account-page business-page">
        <section className="empty-state">
          <h2>Carregando area do estabelecimento</h2>
          <p>Estamos verificando seus acessos.</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (setupError) {
    return (
      <main className="account-page business-page">
        <section className="business-panel">
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={18} aria-hidden="true" />
            Voltar
          </button>
          <p className="section-kicker">Area do estabelecimento</p>
          <h1>Falta ativar esta area no banco</h1>
          <p className="business-muted">
            Rode a versao atualizada do arquivo schema.sql no Supabase para
            liberar solicitacoes e o painel do bar.
          </p>
        </section>
      </main>
    );
  }

  if (!access.memberships.length) {
    return (
      <main className="account-page business-page">
        <section className="business-panel business-claim-panel">
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={18} aria-hidden="true" />
            Voltar
          </button>

          <div className="business-heading">
            <span className="business-heading-icon">
              <Store size={24} aria-hidden="true" />
            </span>
            <div>
              <p className="section-kicker">Para estabelecimentos</p>
              <h1>Administre seu bar no Bora Bar</h1>
              <p>
                Solicite o acesso ao estabelecimento. Depois da verificacao,
                voce podera manter cardapio, precos, promocoes e eventos.
              </p>
            </div>
          </div>

          {access.claims.length > 0 && (
            <div className="claim-status-list">
              {access.claims.map((item) => (
                <article className="claim-status" key={item.id}>
                  <div>
                    <strong>{item.bar?.name ?? "Estabelecimento"}</strong>
                    <span>{getClaimStatusLabel(item.status)}</span>
                  </div>
                  {item.reviewNotes && <p>{item.reviewNotes}</p>}
                </article>
              ))}
            </div>
          )}

          {availableBars.length > 0 ? (
            <form className="business-form" onSubmit={handleClaimSubmit}>
              <label>
                <span>Qual estabelecimento e seu?</span>
                <select
                  value={claim.barId}
                  onChange={(event) =>
                    setClaim((currentClaim) => ({
                      ...currentClaim,
                      barId: event.target.value
                    }))
                  }
                  required
                >
                  <option value="">Selecione um bar</option>
                  {availableBars.map((bar) => (
                    <option key={bar.id} value={bar.id}>
                      {bar.name} - {bar.neighborhood}
                    </option>
                  ))}
                </select>
              </label>

              <div className="profile-grid">
                <label>
                  <span>Nome do responsavel</span>
                  <input
                    value={claim.contactName}
                    onChange={(event) =>
                      setClaim((currentClaim) => ({
                        ...currentClaim,
                        contactName: event.target.value
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  <span>Telefone ou WhatsApp</span>
                  <input
                    inputMode="tel"
                    value={claim.contactPhone}
                    onChange={(event) =>
                      setClaim((currentClaim) => ({
                        ...currentClaim,
                        contactPhone: event.target.value
                      }))
                    }
                    required
                  />
                </label>
              </div>

              <label>
                <span>CNPJ ou documento do estabelecimento (opcional)</span>
                <input
                  value={claim.businessDocument}
                  onChange={(event) =>
                    setClaim((currentClaim) => ({
                      ...currentClaim,
                      businessDocument: event.target.value
                    }))
                  }
                />
              </label>

              <label>
                <span>Como podemos confirmar seu vinculo?</span>
                <textarea
                  value={claim.message}
                  onChange={(event) =>
                    setClaim((currentClaim) => ({
                      ...currentClaim,
                      message: event.target.value
                    }))
                  }
                  placeholder="Ex: sou o proprietario e posso confirmar pelo telefone cadastrado."
                  rows={4}
                />
              </label>

              <button
                className="primary-action"
                type="submit"
                disabled={isSaving}
              >
                <BadgeCheck size={18} aria-hidden="true" />
                {isSaving ? "Enviando..." : "Solicitar acesso"}
              </button>
            </form>
          ) : (
            <p className="business-muted">
              Nao ha outro estabelecimento disponivel para uma nova solicitacao.
            </p>
          )}

          {feedback && <p className="form-feedback">{feedback}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="account-page business-page">
      <section className="business-panel">
        <div className="business-toolbar">
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={18} aria-hidden="true" />
            Voltar
          </button>

          {access.memberships.length > 1 && (
            <select
              aria-label="Selecionar estabelecimento"
              value={selectedBarId}
              onChange={(event) => setSelectedBarId(event.target.value)}
            >
              {access.memberships.map((membership) => (
                <option key={membership.barId} value={membership.barId}>
                  {membership.bar?.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {managedData && (
          <>
            <div className="business-heading">
              <img src={managedData.bar.image} alt="" />
              <div>
                <p className="section-kicker">Painel do estabelecimento</p>
                <h1>{managedData.bar.name}</h1>
                <p>
                  Edite as informacoes que aparecem para os clientes no Bora Bar.
                </p>
              </div>
            </div>

            <div className="business-tabs" role="tablist">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    className={activeTab === tab.id ? "is-active" : ""}
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setFeedback("");
                    }}
                  >
                    <Icon size={17} aria-hidden="true" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === "overview" && (
              <div className="business-editor">
                <div className="profile-grid">
                  <BusinessField
                    label="Nome do estabelecimento"
                    value={managedData.bar.name}
                    onChange={(value) => updateBar({ name: value })}
                  />
                  <BusinessField
                    label="Telefone ou WhatsApp"
                    icon={Phone}
                    value={managedData.bar.phone}
                    onChange={(value) => updateBar({ phone: value })}
                  />
                </div>

                <BusinessField
                  label="Descricao"
                  multiline
                  value={managedData.bar.description}
                  onChange={(value) => updateBar({ description: value })}
                />

                <BusinessField
                  label="Endereco"
                  icon={MapPin}
                  value={managedData.bar.address}
                  onChange={(value) => updateBar({ address: value })}
                />

                <div className="profile-grid">
                  <BusinessField
                    label="Bairro"
                    value={managedData.bar.neighborhood}
                    onChange={(value) => updateBar({ neighborhood: value })}
                  />
                  <BusinessField
                    label="Cidade"
                    value={managedData.bar.city}
                    onChange={(value) => updateBar({ city: value })}
                  />
                </div>

                <BusinessField
                  label="Horario de funcionamento"
                  icon={Clock3}
                  value={managedData.bar.hours}
                  onChange={(value) => updateBar({ hours: value })}
                />

                <BusinessField
                  label="URL da imagem principal"
                  icon={Image}
                  value={managedData.bar.image}
                  onChange={(value) => updateBar({ image: value })}
                />

                <div className="profile-grid">
                  <label>
                    <span>Faixa de preco</span>
                    <select
                      value={managedData.bar.priceLevel}
                      onChange={(event) =>
                        updateBar({ priceLevel: event.target.value })
                      }
                    >
                      <option value="$">$ - Economico</option>
                      <option value="$$">$$ - Moderado</option>
                      <option value="$$$">$$$ - Premium</option>
                    </select>
                  </label>

                  <label className="business-switch-row">
                    <span>Aberto agora</span>
                    <input
                      type="checkbox"
                      checked={managedData.bar.isOpen}
                      onChange={(event) =>
                        updateBar({ isOpen: event.target.checked })
                      }
                    />
                  </label>
                </div>
              </div>
            )}

            {activeTab === "menu" && (
              <div className="business-editor">
                {managedData.categories.map((category) => (
                  <section className="business-list-section" key={category.id}>
                    <div className="business-section-heading">
                      <input
                        aria-label="Nome da categoria"
                        value={category.name}
                        onChange={(event) =>
                          updateCategory(category.id, {
                            name: event.target.value,
                            slug: event.target.value
                              .trim()
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                          })
                        }
                        placeholder="Ex: Cervejas"
                      />
                      <button
                        className="icon-delete"
                        type="button"
                        onClick={() =>
                          setManagedData((currentData) => ({
                            ...currentData,
                            categories: currentData.categories.filter(
                              (item) => item.id !== category.id
                            )
                          }))
                        }
                        aria-label={`Remover categoria ${category.name}`}
                      >
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    </div>

                    <div className="business-items">
                      {category.items.map((item) => (
                        <article className="business-item-row" key={item.id}>
                          <input
                            aria-label="Nome do item"
                            value={item.name}
                            onChange={(event) =>
                              updateMenuItem(category.id, item.id, {
                                name: event.target.value
                              })
                            }
                            placeholder="Nome do item"
                          />
                          <input
                            aria-label="Descricao do item"
                            value={item.description}
                            onChange={(event) =>
                              updateMenuItem(category.id, item.id, {
                                description: event.target.value
                              })
                            }
                            placeholder="Descricao opcional"
                          />
                          <input
                            aria-label="Preco do item"
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(event) =>
                              updateMenuItem(category.id, item.id, {
                                price: event.target.value
                              })
                            }
                            placeholder="R$ 0,00"
                          />
                          <label className="compact-check">
                            <input
                              type="checkbox"
                              checked={item.isAvailable}
                              onChange={(event) =>
                                updateMenuItem(category.id, item.id, {
                                  isAvailable: event.target.checked
                                })
                              }
                            />
                            Disponivel
                          </label>
                          <button
                            className="icon-delete"
                            type="button"
                            onClick={() =>
                              removeMenuItem(category.id, item.id)
                            }
                            aria-label={`Remover ${item.name}`}
                          >
                            <Trash2 size={17} aria-hidden="true" />
                          </button>
                        </article>
                      ))}
                    </div>

                    <button
                      className="business-add-button"
                      type="button"
                      onClick={() => addMenuItem(category.id)}
                    >
                      <Plus size={17} aria-hidden="true" />
                      Adicionar item
                    </button>
                  </section>
                ))}

                <button
                  className="secondary-action"
                  type="button"
                  onClick={() =>
                    setManagedData((currentData) => ({
                      ...currentData,
                      categories: [...currentData.categories, emptyCategory()]
                    }))
                  }
                >
                  <Plus size={17} aria-hidden="true" />
                  Nova categoria
                </button>
              </div>
            )}

            {activeTab === "promotions" && (
              <TimedItemsEditor
                items={managedData.promotions}
                kind="promotion"
                onAdd={() =>
                  setManagedData((currentData) => ({
                    ...currentData,
                    promotions: [
                      ...currentData.promotions,
                      emptyPromotion()
                    ]
                  }))
                }
                onRemove={(itemId) =>
                  removeListItem("promotions", itemId)
                }
                onUpdate={(itemId, patch) =>
                  updateListItem("promotions", itemId, patch)
                }
              />
            )}

            {activeTab === "events" && (
              <TimedItemsEditor
                items={managedData.events}
                kind="event"
                onAdd={() =>
                  setManagedData((currentData) => ({
                    ...currentData,
                    events: [...currentData.events, emptyEvent()]
                  }))
                }
                onRemove={(itemId) => removeListItem("events", itemId)}
                onUpdate={(itemId, patch) =>
                  updateListItem("events", itemId, patch)
                }
              />
            )}

            <div className="business-save-bar">
              <button
                className="primary-action"
                type="button"
                onClick={saveCurrentTab}
                disabled={isSaving}
              >
                <Save size={18} aria-hidden="true" />
                {isSaving ? "Salvando..." : `Salvar ${tabs.find((tab) => tab.id === activeTab)?.label}`}
              </button>
              {feedback && <p className="form-feedback">{feedback}</p>}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function BusinessField({
  icon: Icon,
  label,
  multiline = false,
  onChange,
  value
}) {
  return (
    <label>
      <span>{label}</span>
      <div className={`field-with-icon ${multiline ? "textarea-field" : ""}`}>
        {Icon && <Icon size={18} aria-hidden="true" />}
        {multiline ? (
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={4}
          />
        ) : (
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
      </div>
    </label>
  );
}

function TimedItemsEditor({ items, kind, onAdd, onRemove, onUpdate }) {
  const isEvent = kind === "event";

  return (
    <div className="business-editor">
      {items.map((item) => (
        <section className="business-list-section" key={item.id}>
          <div className="business-section-heading">
            <input
              aria-label={isEvent ? "Nome do evento" : "Titulo da promocao"}
              value={item.title}
              onChange={(event) =>
                onUpdate(item.id, { title: event.target.value })
              }
              placeholder={isEvent ? "Ex: Samba ao vivo" : "Ex: Chopp em dobro"}
            />
            <button
              className="icon-delete"
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label={`Remover ${item.title}`}
            >
              <Trash2 size={17} aria-hidden="true" />
            </button>
          </div>

          <textarea
            value={item.description}
            onChange={(event) =>
              onUpdate(item.id, { description: event.target.value })
            }
            placeholder="Descricao opcional"
            rows={3}
          />

          <div className="profile-grid">
            <label>
              <span>Inicio</span>
              <input
                type="datetime-local"
                value={item.startsAt}
                onChange={(event) =>
                  onUpdate(item.id, { startsAt: event.target.value })
                }
                required={isEvent}
              />
            </label>
            <label>
              <span>Fim</span>
              <input
                type="datetime-local"
                value={item.endsAt}
                onChange={(event) =>
                  onUpdate(item.id, { endsAt: event.target.value })
                }
              />
            </label>
          </div>

          {isEvent && (
            <label>
              <span>Valor da entrada (opcional)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.price}
                onChange={(event) =>
                  onUpdate(item.id, { price: event.target.value })
                }
              />
            </label>
          )}

          <label className="compact-check">
            <input
              type="checkbox"
              checked={item.isActive}
              onChange={(event) =>
                onUpdate(item.id, { isActive: event.target.checked })
              }
            />
            {isEvent ? "Evento publicado" : "Promocao publicada"}
          </label>
        </section>
      ))}

      <button className="secondary-action" type="button" onClick={onAdd}>
        <Plus size={17} aria-hidden="true" />
        {isEvent ? "Novo evento" : "Nova promocao"}
      </button>
    </div>
  );
}
