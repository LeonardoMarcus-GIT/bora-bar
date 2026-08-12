import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock3,
  Eye,
  Heart,
  Image,
  LayoutDashboard,
  MessageCircle,
  Navigation,
  Phone,
  PhoneCall,
  Plus,
  Save,
  Store,
  Tag,
  Trash2,
  Upload,
  UtensilsCrossed
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import BarAddressFields from "./BarAddressFields.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { geocodeAddress } from "../services/addressService.js";
import { fetchBarMetrics } from "../services/analyticsService.js";
import { uploadBusinessCoverImage } from "../services/businessImageService.js";
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
  { id: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { id: "overview", label: "Perfil público", icon: Store },
  { id: "menu", label: "Cardápio", icon: UtensilsCrossed },
  { id: "promotions", label: "Promoções", icon: Tag },
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
    return "Não aprovado";
  }

  return "Em análise";
}

const WEEK_DAYS = [
  { id: "mon", label: "Seg" },
  { id: "tue", label: "Ter" },
  { id: "wed", label: "Qua" },
  { id: "thu", label: "Qui" },
  { id: "fri", label: "Sex" },
  { id: "sat", label: "Sab" },
  { id: "sun", label: "Dom" }
];

function parseHours(hours) {
  const text = String(hours ?? "");
  const match = text.match(/(\d{1,2})h\s*(?:as|a|-)\s*(\d{1,2})h/i);
  const dayText = text.split(":")[0].toLowerCase();
  const selectedDays = dayText.includes("todos")
    ? WEEK_DAYS.map((day) => day.id)
    : WEEK_DAYS.filter((day) => dayText.includes(day.label.toLowerCase())).map(
        (day) => day.id
      );

  return {
    days: selectedDays.length ? selectedDays : WEEK_DAYS.map((day) => day.id),
    opensAt: `${String(match ? Number(match[1]) : 16).padStart(2, "0")}:00`,
    closesAt: `${String(match ? Number(match[2]) : 1).padStart(2, "0")}:00`
  };
}

function formatBusinessHours({ days, opensAt, closesAt }) {
  if (!days.length) {
    return "Horário a confirmar";
  }

  const dayLabels = WEEK_DAYS.filter((day) => days.includes(day.id)).map(
    (day) => day.label
  );
  const dayText = days.length === WEEK_DAYS.length ? "Todos os dias" : dayLabels.join(", ");
  const openHour = opensAt?.slice(0, 2) || "16";
  const closeHour = closesAt?.slice(0, 2) || "01";
  return `${dayText}: ${openHour}h-${closeHour}h`;
}

export default function BusinessDashboard({
  bars,
  onBack,
  onDataChanged,
  onPreviewBar,
  onLoginRequired
}) {
  const { isAuthReady, session, user } = useAuth();
  const [access, setAccess] = useState({ memberships: [], claims: [] });
  const [selectedBarId, setSelectedBarId] = useState("");
  const [managedData, setManagedData] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [metrics, setMetrics] = useState({ available: false, days: 30, totals: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [setupError, setSetupError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
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

  const barsById = useMemo(
    () => new Map(bars.map((bar) => [bar.id, bar])),
    [bars]
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

    async function loadAccess() {
      try {
        return await fetchBusinessAccess(user.id);
      } catch (firstError) {
        console.warn("Primeira tentativa de acesso ao painel falhou.", firstError);
        return fetchBusinessAccess(user.id);
      }
    }

    loadAccess()
      .then((nextAccessResult) => {
        if (!isMounted) {
          return;
        }

        const nextAccess = {
          memberships: nextAccessResult.memberships.map((membership) => ({
            ...membership,
            bar: barsById.get(membership.barId) ?? null
          })),
          claims: nextAccessResult.claims.map((item) => ({
            ...item,
            bar: barsById.get(item.barId) ?? null
          }))
        };

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
      .catch((error) => {
        if (isMounted) {
          console.warn("Não foi possível abrir a área do estabelecimento.", error);
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
  }, [barsById, isAuthReady, onLoginRequired, reloadKey, user]);

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
          setFeedback("Não foi possível carregar os dados do estabelecimento.");
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

  useEffect(() => {
    let isMounted = true;

    if (!selectedBarId) {
      setMetrics({ available: false, days: 30, totals: {} });
      return () => {
        isMounted = false;
      };
    }

    fetchBarMetrics(selectedBarId).then((nextMetrics) => {
      if (isMounted) {
        setMetrics(nextMetrics);
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
        claims: [
          {
            ...nextClaim,
            bar: barsById.get(nextClaim.barId) ?? null
          },
          ...currentAccess.claims
        ]
      }));
      setClaim((currentClaim) => ({
        ...currentClaim,
        barId: "",
        businessDocument: "",
        message: ""
      }));
      setFeedback("Solicitação enviada. Vamos verificar o vínculo com o bar.");
    } catch (error) {
      const message = `${error?.message ?? ""} ${error?.code ?? ""}`.toLowerCase();
      setFeedback(
        message.includes("duplicate")
          ? "Já existe uma solicitação em análise para esse bar."
          : "Não foi possível enviar a solicitação agora."
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

  async function handleCoverImageSelected(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !selectedBarId) {
      return;
    }

    setIsUploadingImage(true);
    setFeedback("");

    try {
      const imageUrl = await uploadBusinessCoverImage(selectedBarId, file);
      updateBar({ image: imageUrl });
      setFeedback("Foto pronta. Salve o perfil público para publicar a alteração.");
    } catch (error) {
      if (error?.message === "INVALID_IMAGE_TYPE") {
        setFeedback("Escolha uma imagem JPG, PNG ou WebP.");
      } else if (error?.message === "IMAGE_TOO_LARGE") {
        setFeedback("A imagem deve ter no máximo 8 MB.");
      } else {
        setFeedback("Não foi possível enviar a imagem agora. Tente novamente.");
      }
    } finally {
      setIsUploadingImage(false);
    }
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

  function openNewPromotion() {
    setManagedData((currentData) => ({
      ...currentData,
      promotions: [...currentData.promotions, emptyPromotion()]
    }));
    setActiveTab("promotions");
  }

  async function saveCurrentTab() {
    if (!managedData) {
      return;
    }

    setIsSaving(true);
    setFeedback("");

    try {
      let successMessage = "Alteracoes salvas e publicadas.";

      if (activeTab === "overview") {
        let barToSave = managedData.bar;

        try {
          const { location } = await geocodeAddress(
            barToSave,
            session?.access_token,
            { saveProfile: false }
          );

          if (location) {
            barToSave = {
              ...barToSave,
              latitude: location.latitude,
              longitude: location.longitude
            };
          }
        } catch {
          successMessage =
            "Endereço salvo. Não foi possível atualizar a distância agora.";
        }

        const nextBar = await updateManagedBar(selectedBarId, barToSave);
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

      setFeedback(successMessage);
      onDataChanged?.();
    } catch {
      setFeedback("Não foi possível salvar agora. Verifique os campos e tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isAuthReady || isLoading) {
    return (
      <main className="account-page business-page">
        <section className="empty-state">
          <h2>Carregando área do estabelecimento</h2>
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
          <p className="section-kicker">Área do estabelecimento</p>
          <h1>Não foi possível abrir esta área</h1>
          <p className="business-muted">
            Sua conta está conectada, mas a consulta do painel falhou. Tente
            novamente para renovar a conexão.
          </p>
          <button
            className="primary-action"
            type="button"
            onClick={() => setReloadKey((currentKey) => currentKey + 1)}
          >
            Tentar novamente
          </button>
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
                Solicite o acesso ao estabelecimento. Depois da verificação,
                você poderá manter cardápio, preços, promoções e eventos.
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
                  <span>Nome do responsável</span>
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
                <span>Como podemos confirmar seu vínculo?</span>
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
              Não há outro estabelecimento disponível para uma nova solicitação.
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
                  Edite as informações que aparecem para os clientes no Bora Bar.
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
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-label={tab.label}
                    title={tab.label}
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

            {activeTab === "dashboard" && (
              <BusinessOverview
                data={managedData}
                metrics={metrics}
                onEditProfile={() => setActiveTab("overview")}
                onNewPromotion={openNewPromotion}
                onPreview={() => onPreviewBar?.(selectedBarId)}
              />
            )}

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
                  label="Descrição"
                  multiline
                  value={managedData.bar.description}
                  onChange={(value) => updateBar({ description: value })}
                />

                <BarAddressFields
                  address={managedData.bar}
                  onChange={(nextAddress) => updateBar(nextAddress)}
                />

                <BusinessHoursEditor
                  value={managedData.bar.hours}
                  onChange={(hours) => updateBar({ hours })}
                />

                <BusinessCoverImagePicker
                  image={managedData.bar.image}
                  isUploading={isUploadingImage}
                  onFileSelected={handleCoverImageSelected}
                  onUrlChange={(value) => updateBar({ image: value })}
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
                      <option value="$">$ - Econômico</option>
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
                          <div className="menu-item-main">
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
                          </div>

                          <div className="menu-item-details">
                            <input
                              aria-label="Descrição do item"
                              value={item.description}
                              onChange={(event) =>
                                updateMenuItem(category.id, item.id, {
                                  description: event.target.value
                                })
                              }
                              placeholder="Descrição opcional"
                            />
                            <label className="menu-price-field">
                              <span className="sr-only">Preco do item</span>
                              <b aria-hidden="true">R$</b>
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
                                placeholder="0,00"
                              />
                            </label>
                            <label className="menu-availability-switch">
                              <span>Disponível</span>
                              <input
                                type="checkbox"
                                aria-label="Item disponível"
                                checked={item.isAvailable}
                                onChange={(event) =>
                                  updateMenuItem(category.id, item.id, {
                                    isAvailable: event.target.checked
                                  })
                                }
                              />
                            </label>
                          </div>
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

            {activeTab !== "dashboard" && (
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
            )}
          </>
        )}
      </section>
    </main>
  );
}

function BusinessOverview({ data, metrics, onEditProfile, onNewPromotion, onPreview }) {
  const checks = [
    { label: "Foto e descrição", done: Boolean(data.bar.image && data.bar.description) },
    { label: "Endereço e contato", done: Boolean(data.bar.address && data.bar.phone) },
    { label: "Horário publicado", done: Boolean(data.bar.hours) },
    {
      label: "Cardápio com itens",
      done: data.categories.some((category) => category.items.length > 0)
    },
    {
      label: "Promoção ou evento ativo",
      done: data.promotions.some((item) => item.isActive) ||
        data.events.some((item) => item.isActive)
    }
  ];
  const completed = checks.filter((item) => item.done).length;
  const completion = Math.round((completed / checks.length) * 100);
  const totals = metrics.totals ?? {};
  const metricItems = [
    { label: "Visualizacoes", value: totals.view ?? 0, icon: Eye },
    { label: "WhatsApp", value: totals.whatsapp ?? 0, icon: MessageCircle },
    {
      label: "Rotas abertas",
      value: (totals.route_google ?? 0) + (totals.route_waze ?? 0),
      icon: Navigation
    },
    { label: "Ligacoes", value: totals.phone ?? 0, icon: PhoneCall },
    { label: "Favoritos", value: totals.favorite ?? 0, icon: Heart }
  ];

  return (
    <div className="business-overview">
      <section className="business-overview-summary">
        <div>
          <p className="section-kicker">Qualidade do perfil</p>
          <h2>{completion}% completo</h2>
          <p>
            Perfis completos ajudam o cliente a decidir com menos duvidas.
          </p>
        </div>
        <div
          className="business-progress"
          role="progressbar"
          aria-label="Progresso do perfil"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={completion}
        >
          <span style={{ width: `${completion}%` }} />
        </div>
        <div className="business-checklist">
          {checks.map((item) => (
            <span className={item.done ? "is-done" : ""} key={item.label}>
              <BadgeCheck size={16} aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </div>
      </section>

      <section className="business-overview-section">
        <div className="business-overview-title">
          <div>
            <p className="section-kicker">Ultimos {metrics.days} dias</p>
            <h2>Interesse dos clientes</h2>
          </div>
          {!metrics.available && <span className="metrics-pending">Sem dados ainda</span>}
        </div>
        <div className="business-metrics-grid">
          {metricItems.map(({ label, value, icon: Icon }) => (
            <article className="business-metric" key={label}>
              <Icon size={19} aria-hidden="true" />
              <strong>{value}</strong>
              <span>{label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="business-overview-section">
        <div className="business-overview-title">
          <div>
            <p className="section-kicker">Atalhos</p>
            <h2>O que você quer fazer?</h2>
          </div>
        </div>
        <div className="business-quick-grid">
          <button type="button" onClick={onPreview}>
            <Eye size={19} aria-hidden="true" />
            <span><strong>Ver perfil público</strong><small>Confira como o cliente vê seu bar</small></span>
          </button>
          <button type="button" onClick={onEditProfile}>
            <Store size={19} aria-hidden="true" />
            <span><strong>Atualizar informações</strong><small>Contato, endereço, foto e horário</small></span>
          </button>
          <button type="button" onClick={onNewPromotion}>
            <Tag size={19} aria-hidden="true" />
            <span><strong>Publicar promoção</strong><small>Crie um motivo para visitar hoje</small></span>
          </button>
        </div>
      </section>
    </div>
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

function BusinessCoverImagePicker({ image, isUploading, onFileSelected, onUrlChange }) {
  const inputRef = useRef(null);

  return (
    <section className="cover-image-editor">
      <div className="cover-image-heading">
        <div>
          <span>Foto principal</span>
          <small>Mostre o ambiente que mais representa seu estabelecimento.</small>
        </div>
        <button
          className="secondary-action cover-image-upload"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload size={17} aria-hidden="true" />
          {isUploading ? "Enviando foto" : "Escolher foto"}
        </button>
      </div>

      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFileSelected}
      />

      <div className="cover-image-preview">
        {image ? <img src={image} alt="Previa da foto principal" /> : <Image size={24} aria-hidden="true" />}
      </div>

      <label className="cover-image-url">
        <span>Ou use uma URL de imagem</span>
        <div className="field-with-icon">
          <Image size={18} aria-hidden="true" />
          <input value={image} onChange={(event) => onUrlChange(event.target.value)} />
        </div>
      </label>
    </section>
  );
}

function BusinessHoursEditor({ value, onChange }) {
  const [schedule, setSchedule] = useState(() => parseHours(value));

  useEffect(() => {
    setSchedule(parseHours(value));
  }, [value]);

  function updateSchedule(patch) {
    setSchedule((currentSchedule) => {
      const nextSchedule = { ...currentSchedule, ...patch };
      onChange(formatBusinessHours(nextSchedule));
      return nextSchedule;
    });
  }

  function toggleDay(dayId) {
    updateSchedule({
      days: schedule.days.includes(dayId)
        ? schedule.days.filter((id) => id !== dayId)
        : [...schedule.days, dayId]
    });
  }

  const allDaysSelected = schedule.days.length === WEEK_DAYS.length;

  return (
    <section className="business-hours-editor">
      <div className="hours-editor-heading">
        <div>
          <span>Horário de funcionamento</span>
          <small>{formatBusinessHours(schedule)}</small>
        </div>
        <Clock3 size={20} aria-hidden="true" />
      </div>

      <div className="hours-days" role="group" aria-label="Dias de funcionamento">
        <button
          className={allDaysSelected ? "is-active" : ""}
          type="button"
          onClick={() =>
            updateSchedule({ days: allDaysSelected ? [] : WEEK_DAYS.map((day) => day.id) })
          }
        >
          Todos
        </button>
        {WEEK_DAYS.map((day) => (
          <button
            className={schedule.days.includes(day.id) ? "is-active" : ""}
            type="button"
            key={day.id}
            onClick={() => toggleDay(day.id)}
          >
            {day.label}
          </button>
        ))}
      </div>

      <div className="hours-time-fields">
        <label>
          <span>Abre</span>
          <input
            type="time"
            value={schedule.opensAt}
            onChange={(event) => updateSchedule({ opensAt: event.target.value })}
          />
        </label>
        <label>
          <span>Fecha</span>
          <input
            type="time"
            value={schedule.closesAt}
            onChange={(event) => updateSchedule({ closesAt: event.target.value })}
          />
        </label>
      </div>
    </section>
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
              aria-label={isEvent ? "Nome do evento" : "Título da promoção"}
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
            placeholder="Descrição opcional"
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

          <label className="publish-status-switch">
            <input
              type="checkbox"
              aria-label={isEvent ? "Evento publicado" : "Promoção publicada"}
              checked={item.isActive}
              onChange={(event) =>
                onUpdate(item.id, { isActive: event.target.checked })
              }
            />
            <span>{isEvent ? "Evento publicado" : "Promoção publicada"}</span>
          </label>
        </section>
      ))}

      <button className="secondary-action timed-item-add" type="button" onClick={onAdd}>
        <Plus size={17} aria-hidden="true" />
        {isEvent ? "Novo evento" : "Nova promoção"}
      </button>
    </div>
  );
}
