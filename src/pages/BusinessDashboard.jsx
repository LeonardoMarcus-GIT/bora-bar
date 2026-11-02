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
  QrCode,
  Save,
  Store,
  Tag,
  Trash2,
  Upload,
  UtensilsCrossed
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import BarAddressFields from "../components/BarAddressFields.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { geocodeAddress } from "../services/addressService.js";
import { fetchBarDailyViews, fetchBarMetrics } from "../services/analyticsService.js";
import { uploadBusinessCoverImage, uploadBusinessStoryImage } from "../services/businessImageService.js";
import { getOpenStatus, parseOpeningDays } from "../utils/openingHours.js";
import { VIBES } from "../utils/vibes.js";
import { CountUp } from "../components/TextEffects.jsx";
import * as t from "../texts/dashboard.js";
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
  { id: "dashboard", label: t.tabs.dashboard, icon: LayoutDashboard },
  { id: "overview", label: t.tabs.overview, icon: Store },
  { id: "menu", label: t.tabs.menu, icon: UtensilsCrossed },
  { id: "promotions", label: t.tabs.promotions, icon: Tag },
  { id: "events", label: t.tabs.events, icon: CalendarDays }
];

const EVENT_DEFAULT_HOURS = 3;
const HOUR_MS = 3600000;

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

// Fim sugerido: evento dura 3 horas; promoção vale até 23h59 daquele dia.
function getDefaultEnd(start, isEvent) {
  if (isEvent) {
    return new Date(start.getTime() + EVENT_DEFAULT_HOURS * HOUR_MS);
  }

  const end = new Date(start);
  end.setHours(23, 59, 0, 0);
  return end > start ? end : new Date(end.getTime() + 24 * HOUR_MS);
}

// Promoção nova já vem com a data e a hora do celular: começa agora
// (arredondado para baixo, de 5 em 5 minutos) e vale até 23h59 de hoje.
function emptyPromotion() {
  const start = new Date();
  start.setMinutes(Math.floor(start.getMinutes() / 5) * 5, 0, 0);
  const end = getDefaultEnd(start, false);

  return {
    id: createTemporaryId(),
    title: "",
    description: "",
    imageUrl: "",
    startsAt: toDateTimeInput(start.toISOString()),
    endsAt: toDateTimeInput(end.toISOString()),
    isActive: true
  };
}

// Evento novo já vem na próxima meia hora do celular, com 3 horas de duração.
function emptyEvent() {
  const start = new Date();
  start.setMinutes(start.getMinutes() < 30 ? 30 : 60, 0, 0);
  const end = getDefaultEnd(start, true);

  return {
    id: createTemporaryId(),
    title: "",
    description: "",
    imageUrl: "",
    startsAt: toDateTimeInput(start.toISOString()),
    endsAt: toDateTimeInput(end.toISOString()),
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

// Ao mudar o início, o fim acompanha: o evento mantém a duração e a promoção
// muda de dia mantendo o horário. Ano menor que 2000 é só o ano pela metade
// enquanto o dono digita.
function getStartPatch(item, startsAt, isEvent) {
  const previous = new Date(item.startsAt);
  const next = new Date(startsAt);
  const end = new Date(item.endsAt);

  if (!(next.getFullYear() >= 2000) || Number.isNaN(end.getTime())) {
    return { startsAt };
  }

  let nextEnd = end;

  if (previous.getFullYear() >= 2000) {
    if (isEvent) {
      nextEnd = new Date(end.getTime() + (next - previous));
    } else {
      const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayShift = Math.round((startOfDay(next) - startOfDay(previous)) / (24 * HOUR_MS));
      nextEnd = new Date(end);
      nextEnd.setDate(end.getDate() + dayShift);
    }
  }

  if (nextEnd <= next) {
    nextEnd = getDefaultEnd(next, isEvent);
  }

  return { startsAt, endsAt: toDateTimeInput(nextEnd.toISOString()) };
}

function normalizeTimedItems(items) {
  return items.map((item) => ({
    ...item,
    startsAt: toDateTimeInput(item.startsAt),
    endsAt: toDateTimeInput(item.endsAt)
  }));
}

function getClaimStatusLabel(status) {
  return t.claimStatus[status] ?? t.claimStatus.pending;
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

function toTimeInput(hours, minutes) {
  return `${String(Number(hours)).padStart(2, "0")}:${String(Number(minutes ?? 0)).padStart(2, "0")}`;
}

function toHoursLabel(time, fallback) {
  const [hours, minutes] = (time || fallback).split(":");
  return minutes && minutes !== "00" ? `${hours}h${minutes}` : `${hours}h`;
}

function parseHours(hours) {
  const text = String(hours ?? "");
  const match = text.match(
    /(\d{1,2})(?:h|:)(\d{2})?h?\s*(?:às|as|a|-)\s*(\d{1,2})(?:h|:)(\d{2})?/i
  );
  // Só o primeiro trecho (antes de "|") é editável aqui; dias vêm do mesmo
  // leitor usado para calcular "aberto agora".
  const firstSegment = text.split("|")[0];
  const firstDigit = firstSegment.search(/\d/);
  const dayText =
    firstDigit === -1 ? "" : firstSegment.slice(0, firstDigit).replace(/[:\s]+$/, "");
  const dayIndexes = dayText.trim() ? parseOpeningDays(dayText) : [];
  // WEEK_DAYS começa na segunda; Date.getDay() começa no domingo.
  const selectedDays = WEEK_DAYS.filter((_, index) =>
    dayIndexes.includes((index + 1) % 7)
  ).map((day) => day.id);

  return {
    days: selectedDays.length ? selectedDays : WEEK_DAYS.map((day) => day.id),
    opensAt: match ? toTimeInput(match[1], match[2]) : "16:00",
    closesAt: match ? toTimeInput(match[3], match[4]) : "01:00"
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
  return `${dayText}: ${toHoursLabel(opensAt, "16:00")}-${toHoursLabel(closesAt, "01:00")}`;
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
  const [dailyViews, setDailyViews] = useState([]);
  // Aviso rápido da visão geral (não é apagado quando a lista de bares recarrega).
  const [toast, setToast] = useState({ text: "", id: 0 });
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
          setFeedback(t.messages.loadFailed);
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
      setDailyViews([]);
      return () => {
        isMounted = false;
      };
    }

    Promise.all([fetchBarMetrics(selectedBarId), fetchBarDailyViews(selectedBarId, 7)]).then(
      ([nextMetrics, nextDailyViews]) => {
        if (isMounted) {
          setMetrics(nextMetrics);
          setDailyViews(nextDailyViews);
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [selectedBarId]);

  async function handleClaimSubmit(event) {
    event.preventDefault();

    if (!claim.barId || !claim.contactName.trim() || !claim.contactPhone.trim()) {
      setFeedback(t.messages.claimMissing);
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
      setFeedback(t.messages.claimSent);
    } catch (error) {
      const message = `${error?.message ?? ""} ${error?.code ?? ""}`.toLowerCase();
      setFeedback(
        message.includes("duplicate")
          ? t.messages.claimDuplicate
          : t.messages.claimFailed
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
      setFeedback(t.messages.coverReady);
    } catch (error) {
      if (error?.message === "INVALID_IMAGE_TYPE") {
        setFeedback(t.messages.invalidImageType);
      } else if (error?.message === "IMAGE_TOO_LARGE") {
        setFeedback(t.messages.imageTooLarge);
      } else {
        setFeedback(t.messages.imageFailed);
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

  // Salva a lista inteira de promoções (padrão replace_bar_promotions) a partir da visão geral.
  async function savePromotionList(nextPromotions, successMessage) {
    setIsSaving(true);

    try {
      await replaceManagedPromotions(
        selectedBarId,
        nextPromotions.map((promotion) => ({
          ...promotion,
          startsAt: toIsoDate(promotion.startsAt),
          endsAt: toIsoDate(promotion.endsAt)
        }))
      );
      setManagedData((currentData) => ({ ...currentData, promotions: nextPromotions }));
      setToast({ text: successMessage, id: Date.now() });
      onDataChanged?.();
      return true;
    } catch {
      setToast({ text: t.messages.saveFailed, id: Date.now() });
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  // "Promoção de hoje": começa agora e vale até 23h59 de hoje.
  function publishQuickPromotion(title) {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 0, 0);

    return savePromotionList(
      [
        ...managedData.promotions,
        {
          ...emptyPromotion(),
          title,
          startsAt: toDateTimeInput(now.toISOString()),
          endsAt: toDateTimeInput(endOfDay.toISOString())
        }
      ],
      t.overview.quickPromoPublished
    );
  }

  function endPromotion(promotionId) {
    return savePromotionList(
      managedData.promotions.map((promotion) =>
        promotion.id === promotionId ? { ...promotion, isActive: false } : promotion
      ),
      t.overview.promoEnded
    );
  }

  async function saveCurrentTab() {
    if (!managedData) {
      return;
    }

    setIsSaving(true);
    setFeedback("");

    try {
      let successMessage = t.messages.saved;

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
          successMessage = t.messages.savedAddressOnly;
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
      setFeedback(t.messages.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  // Status calculado pelo horário que está sendo editado (atualiza na hora).
  const openStatus = getOpenStatus(managedData?.bar?.hours, managedData?.bar?.isOpen);

  if (!isAuthReady || isLoading) {
    return (
      <main className="account-page business-page">
        <section className="empty-state">
          <h2>{t.states.loadingTitle}</h2>
          <p>{t.states.loadingCopy}</p>
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
            {t.common.back}
          </button>
          <p className="section-kicker">{t.states.kicker}</p>
          <h1>{t.states.errorTitle}</h1>
          <p className="business-muted">{t.states.errorCopy}</p>
          <button
            className="primary-action"
            type="button"
            onClick={() => setReloadKey((currentKey) => currentKey + 1)}
          >
            {t.states.retry}
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
            {t.common.back}
          </button>

          <div className="business-heading">
            <span className="business-heading-icon">
              <Store size={24} aria-hidden="true" />
            </span>
            <div>
              <p className="section-kicker">{t.claim.kicker}</p>
              <h1>{t.claim.title}</h1>
              <p>{t.claim.copy}</p>
            </div>
          </div>

          {access.claims.length > 0 && (
            <div className="claim-status-list">
              {access.claims.map((item) => (
                <article className="claim-status" key={item.id}>
                  <div>
                    <strong>{item.bar?.name ?? t.common.establishment}</strong>
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
                <span>{t.claim.whichBar}</span>
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
                  <option value="">{t.claim.selectBar}</option>
                  {availableBars.map((bar) => (
                    <option key={bar.id} value={bar.id}>
                      {bar.name} - {bar.neighborhood}
                    </option>
                  ))}
                </select>
              </label>

              <div className="profile-grid">
                <label>
                  <span>{t.claim.responsibleName}</span>
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
                  <span>{t.common.phoneOrWhatsapp}</span>
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
                <span>{t.claim.document}</span>
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
                <span>{t.claim.howConfirm}</span>
                <textarea
                  value={claim.message}
                  onChange={(event) =>
                    setClaim((currentClaim) => ({
                      ...currentClaim,
                      message: event.target.value
                    }))
                  }
                  placeholder={t.claim.messagePlaceholder}
                  rows={4}
                />
              </label>

              <button
                className="primary-action"
                type="submit"
                disabled={isSaving}
              >
                <BadgeCheck size={18} aria-hidden="true" />
                {isSaving ? t.claim.sending : t.claim.submit}
              </button>
            </form>
          ) : (
            <p className="business-muted">{t.claim.noOtherBar}</p>
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
            {t.common.back}
          </button>

          {access.memberships.length > 1 && (
            <select
              aria-label={t.header.selectEstablishment}
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
                <p className="section-kicker">{t.header.kicker}</p>
                <h1>{managedData.bar.name}</h1>
                <p>{t.header.copy}</p>
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
                dailyViews={dailyViews}
                data={managedData}
                isSaving={isSaving}
                metrics={metrics}
                openStatus={openStatus}
                onEndPromotion={endPromotion}
                onOpenTab={(tabId) => {
                  if (tabId === "promotions" && !managedData.promotions.length) openNewPromotion();
                  else setActiveTab(tabId);
                  setFeedback("");
                }}
                onQuickPromotion={publishQuickPromotion}
                onPreview={() => onPreviewBar?.(selectedBarId)}
                onOpenQrCode={() =>
                  window.open(`/r/${encodeURIComponent(selectedBarId)}/qr`, "_blank", "noopener")
                }
              />
            )}

            {activeTab === "overview" && (
              <div className="business-editor">
                <div className="profile-grid">
                  <BusinessField
                    label={t.profile.name}
                    value={managedData.bar.name}
                    onChange={(value) => updateBar({ name: value })}
                  />
                  <BusinessField
                    label={t.common.phoneOrWhatsapp}
                    icon={Phone}
                    value={managedData.bar.phone}
                    onChange={(value) => updateBar({ phone: value })}
                  />
                </div>

                <BusinessField
                  label={t.profile.description}
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

                {managedData.bar.whatsappOrdersSupported && (
                  <label className="business-switch-row">
                    <span>
                      {t.profile.acceptOrders}
                      <small>
                        {managedData.bar.takesWhatsappOrders
                          ? t.profile.ordersOn
                          : t.profile.ordersOff}
                      </small>
                    </span>
                    <input
                      type="checkbox"
                      checked={managedData.bar.takesWhatsappOrders}
                      onChange={(event) =>
                        updateBar({ takesWhatsappOrders: event.target.checked })
                      }
                    />
                  </label>
                )}

                {managedData.bar.vibesSupported && (
                  <div className="vibes-editor">
                    <span>{t.profile.vibesIntro}</span>
                    <div className="vibes-editor-options" role="group" aria-label={t.profile.vibesAria}>
                      {VIBES.map((vibe) => {
                        const isActive = managedData.bar.vibes.includes(vibe.id);

                        return (
                          <button
                            className={isActive ? "is-active" : ""}
                            type="button"
                            key={vibe.id}
                            aria-pressed={isActive}
                            onClick={() =>
                              updateBar({
                                vibes: isActive
                                  ? managedData.bar.vibes.filter((id) => id !== vibe.id)
                                  : [...managedData.bar.vibes, vibe.id]
                              })
                            }
                          >
                            {vibe.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <BusinessCoverImagePicker
                  image={managedData.bar.image}
                  isUploading={isUploadingImage}
                  onFileSelected={handleCoverImageSelected}
                  onUrlChange={(value) => updateBar({ image: value })}
                />

                <div className="profile-grid">
                  <label>
                    <span>{t.profile.priceLevel}</span>
                    <select
                      value={managedData.bar.priceLevel}
                      onChange={(event) =>
                        updateBar({ priceLevel: event.target.value })
                      }
                    >
                      <option value="$">{t.profile.priceLow}</option>
                      <option value="$$">{t.profile.priceMid}</option>
                      <option value="$$$">{t.profile.priceHigh}</option>
                    </select>
                  </label>

                  {openStatus.isAutomatic ? (
                    <div className="business-switch-row business-auto-status">
                      <span>
                        {openStatus.isOpen ? t.profile.openNow : t.profile.closedNow}
                        <small>
                          {openStatus.detail}{t.profile.autoNote}
                        </small>
                      </span>
                    </div>
                  ) : (
                    <label className="business-switch-row">
                      <span>
                        {t.profile.openNow}
                        <small>{t.profile.unreadableHours}</small>
                      </span>
                      <input
                        type="checkbox"
                        checked={managedData.bar.isOpen}
                        onChange={(event) =>
                          updateBar({ isOpen: event.target.checked })
                        }
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {activeTab === "menu" && (
              <div className="business-editor">
                {managedData.categories.map((category) => (
                  <section className="business-list-section" key={category.id}>
                    <div className="business-section-heading">
                      <input
                        aria-label={t.menu.categoryName}
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
                        placeholder={t.menu.categoryPlaceholder}
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
                        aria-label={t.menu.removeCategory(category.name)}
                      >
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    </div>

                    <div className="business-items">
                      {category.items.map((item) => (
                        <article className="business-item-row" key={item.id}>
                          <div className="menu-item-main">
                            <input
                              aria-label={t.menu.itemName}
                              value={item.name}
                              onChange={(event) =>
                                updateMenuItem(category.id, item.id, {
                                  name: event.target.value
                                })
                              }
                              placeholder={t.menu.itemName}
                            />
                            <button
                              className="icon-delete"
                              type="button"
                              onClick={() =>
                                removeMenuItem(category.id, item.id)
                              }
                              aria-label={t.menu.remove(item.name)}
                            >
                              <Trash2 size={17} aria-hidden="true" />
                            </button>
                          </div>

                          <div className="menu-item-details">
                            <input
                              aria-label={t.menu.itemDescription}
                              value={item.description}
                              onChange={(event) =>
                                updateMenuItem(category.id, item.id, {
                                  description: event.target.value
                                })
                              }
                              placeholder={t.common.optionalDescription}
                            />
                            <label className="menu-price-field">
                              <span className="sr-only">{t.menu.price}</span>
                              <b aria-hidden="true">R$</b>
                              <input
                                aria-label={t.menu.price}
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
                              <span>{t.menu.available}</span>
                              <input
                                type="checkbox"
                                aria-label={t.menu.itemAvailable}
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
                      {t.menu.addItem}
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
                  {t.menu.newCategory}
                </button>
              </div>
            )}

            {activeTab === "promotions" && (
              <TimedItemsEditor
                items={managedData.promotions}
                kind="promotion"
                barId={selectedBarId}
                onFeedback={setFeedback}
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
                barId={selectedBarId}
                onFeedback={setFeedback}
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
                  {isSaving ? t.save.saving : t.save.save(tabs.find((tab) => tab.id === activeTab)?.label)}
                </button>
                {feedback && <p className="form-feedback">{feedback}</p>}
              </div>
            )}

            {activeTab === "dashboard" && toast.text && (
              <p className="pnl-toast" role="status" aria-live="polite" key={toast.id}>{toast.text}</p>
            )}
          </>
        )}
      </section>
    </main>
  );
}

// Visão geral do painel (visual da Versão 3 "Bolso"): capa com status automático,
// "Promoção de hoje" publicada em um toque, números grandes, visitas da semana e atalhos.
function BusinessOverview({
  dailyViews,
  data,
  isSaving,
  metrics,
  openStatus,
  onEndPromotion,
  onOpenTab,
  onOpenQrCode,
  onPreview,
  onQuickPromotion
}) {
  const [quickTitle, setQuickTitle] = useState("");
  const checks = [
    { label: t.overview.checks.photo, done: Boolean(data.bar.image && data.bar.description) },
    { label: t.overview.checks.contact, done: Boolean(data.bar.address && data.bar.phone) },
    { label: t.overview.checks.hours, done: Boolean(data.bar.hours) },
    {
      label: t.overview.checks.menu,
      done: data.categories.some((category) => category.items.length > 0)
    },
    {
      label: t.overview.checks.promo,
      done: data.promotions.some((item) => item.isActive) ||
        data.events.some((item) => item.isActive)
    }
  ];
  const completed = checks.filter((item) => item.done).length;
  const completion = Math.round((completed / checks.length) * 100);
  // A barra começa vazia e enche (a transição está em motion.css).
  const [shownCompletion, setShownCompletion] = useState(0);
  useEffect(() => {
    const frameId = requestAnimationFrame(() => setShownCompletion(completion));
    return () => cancelAnimationFrame(frameId);
  }, [completion]);

  const totals = metrics.totals ?? {};
  const mainMetrics = [
    { label: t.overview.metrics.views, value: totals.view ?? 0, icon: Eye },
    { label: t.overview.metrics.whatsapp, value: totals.whatsapp ?? 0, icon: MessageCircle },
    {
      label: t.overview.metrics.routes,
      value: (totals.route_google ?? 0) + (totals.route_waze ?? 0),
      icon: Navigation
    },
    { label: t.overview.metrics.calls, value: totals.phone ?? 0, icon: PhoneCall }
  ];
  const extraMetrics = [
    { label: t.overview.metrics.favorites, value: totals.favorite ?? 0, icon: Heart },
    { label: t.overview.metrics.storyViews, value: totals.story_view ?? 0, icon: Image },
    { label: t.overview.metrics.storyOpens, value: totals.story_open ?? 0, icon: Store }
  ];

  const now = new Date();
  const activePromotions = data.promotions.filter((item) => {
    if (!item.isActive || !item.title.trim()) return false;
    const starts = item.startsAt ? new Date(item.startsAt) : null;
    const ends = item.endsAt ? new Date(item.endsAt) : null;
    return (!starts || starts <= now) && (!ends || ends >= now);
  });
  const weekTotal = dailyViews.reduce((sum, item) => sum + item.total, 0);
  const maxDay = Math.max(1, ...dailyViews.map((item) => item.total));

  async function handleQuickSubmit(event) {
    event.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    if (await onQuickPromotion(title)) setQuickTitle("");
  }

  return (
    <div className="business-overview pnl">
      <section
        className="pnl-hero"
        style={data.bar.image ? { backgroundImage: `url(${data.bar.image})` } : undefined}
      >
        <div className="pnl-hero-body">
          <span className={`pnl-status ${openStatus.isOpen ? "is-open" : ""}`}>
            <i aria-hidden="true" />
            {openStatus.isOpen ? t.profile.openNow : t.profile.closedNow}
            {openStatus.detail && <small> · {openStatus.detail}</small>}
          </span>
          <small className="pnl-status-note">
            {openStatus.isAutomatic ? t.overview.statusAuto : t.overview.statusManual}
          </small>
          <div className="pnl-hero-actions">
            <button type="button" onClick={onPreview}>
              <Eye size={17} aria-hidden="true" /> {t.overview.viewPage}
            </button>
            <button type="button" onClick={onOpenQrCode}>
              <QrCode size={17} aria-hidden="true" /> {t.overview.qr}
            </button>
          </div>
        </div>
      </section>

      <section className="pnl-card pnl-promo">
        <h2><Tag size={18} aria-hidden="true" /> {t.overview.quickPromoTitle}</h2>
        {activePromotions.length ? (
          <ul className="pnl-promo-list">
            {activePromotions.map((item) => (
              <li key={item.id}>
                <span>{item.title}</span>
                <button type="button" onClick={() => onEndPromotion(item.id)} disabled={isSaving}>
                  {t.overview.endPromo}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pnl-muted">{t.overview.quickPromoNone}</p>
        )}
        <form className="pnl-promo-form" onSubmit={handleQuickSubmit}>
          <input
            value={quickTitle}
            onChange={(event) => setQuickTitle(event.target.value)}
            placeholder={t.overview.quickPromoPlaceholder}
            maxLength={80}
            aria-label={t.overview.quickPromoTitle}
          />
          <button className="primary-action" type="submit" disabled={isSaving || !quickTitle.trim()}>
            {isSaving ? t.overview.quickPromoPublishing : t.overview.quickPromoPublish}
          </button>
        </form>
        {quickTitle.trim() && (
          <p className="pnl-preview">
            {t.overview.quickPromoPreview} <strong>{quickTitle.trim()}</strong>
          </p>
        )}
        <p className="pnl-hint">{t.overview.quickPromoHint}</p>
      </section>

      <section className="pnl-section">
        <div className="pnl-section-title">
          <div>
            <p className="section-kicker">{t.overview.lastDays(metrics.days)}</p>
            <h2>{t.overview.interest}</h2>
          </div>
          {!metrics.available && <span className="metrics-pending">{t.overview.noData}</span>}
        </div>
        <div className="pnl-metrics">
          {mainMetrics.map(({ label, value, icon: Icon }) => (
            <article className="pnl-metric" key={label}>
              <Icon size={20} aria-hidden="true" />
              <strong><CountUp value={value} /></strong>
              <span>{label}</span>
            </article>
          ))}
        </div>
        <div className="pnl-metrics-extra">
          {extraMetrics.map(({ label, value, icon: Icon }) => (
            <span key={label}>
              <Icon size={15} aria-hidden="true" />
              <strong><CountUp value={value} /></strong> {label}
            </span>
          ))}
        </div>
      </section>

      <section className="pnl-card pnl-chart">
        <div className="pnl-section-title">
          <h2>{t.overview.dailyTitle}</h2>
          <span className="pnl-muted">{t.overview.dailyTotal(weekTotal)}</span>
        </div>
        {dailyViews.length ? (
          <div className="pnl-bars">
            {dailyViews.map((item, index) => (
              <div key={item.day} title={`${item.total}`}>
                <b>{item.total || ""}</b>
                <i
                  style={{
                    "--h": `${Math.max(4, Math.round((item.total / maxDay) * 100))}%`,
                    "--n": index
                  }}
                />
                <span>{t.overview.weekday(item.day)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="pnl-muted">{t.overview.dailyEmpty}</p>
        )}
      </section>

      <section className="pnl-card pnl-quality">
        <p className="section-kicker">{t.overview.qualityKicker}</p>
        <h2><CountUp value={completion} />{t.overview.completeSuffix}</h2>
        <div
          className="business-progress"
          role="progressbar"
          aria-label={t.overview.progressAria}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={completion}
        >
          <span style={{ width: `${shownCompletion}%` }} />
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

      <section className="pnl-section">
        <div className="pnl-section-title">
          <div>
            <p className="section-kicker">{t.overview.shortcutsKicker}</p>
            <h2>{t.overview.shortcutsTitle}</h2>
          </div>
        </div>
        <div className="pnl-shortcuts">
          <button type="button" onClick={() => onOpenTab("overview")}>
            <Store size={20} aria-hidden="true" />
            <strong>{t.overview.updateInfo}</strong>
            <small>{t.overview.updateInfoCopy}</small>
          </button>
          <button type="button" onClick={() => onOpenTab("menu")}>
            <UtensilsCrossed size={20} aria-hidden="true" />
            <strong>{t.overview.editMenu}</strong>
            <small>{t.overview.editMenuCopy}</small>
          </button>
          <button type="button" onClick={() => onOpenTab("promotions")}>
            <Tag size={20} aria-hidden="true" />
            <strong>{t.overview.publishPromo}</strong>
            <small>{t.overview.publishPromoCopy}</small>
          </button>
          <button type="button" onClick={() => onOpenTab("events")}>
            <CalendarDays size={20} aria-hidden="true" />
            <strong>{t.overview.newEvent}</strong>
            <small>{t.overview.newEventCopy}</small>
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
          <span>{t.cover.title}</span>
          <small>{t.cover.copy}</small>
        </div>
        <button
          className="secondary-action cover-image-upload"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload size={17} aria-hidden="true" />
          {isUploading ? t.cover.uploading : t.cover.choose}
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
        {image ? <img src={image} alt={t.cover.previewAlt} /> : <Image size={24} aria-hidden="true" />}
      </div>

      <label className="cover-image-url">
        <span>{t.cover.orUrl}</span>
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
          <span>{t.hours.title}</span>
          <small>{formatBusinessHours(schedule)}</small>
        </div>
        <Clock3 size={20} aria-hidden="true" />
      </div>

      <div className="hours-days" role="group" aria-label={t.hours.daysAria}>
        <button
          className={allDaysSelected ? "is-active" : ""}
          type="button"
          onClick={() =>
            updateSchedule({ days: allDaysSelected ? [] : WEEK_DAYS.map((day) => day.id) })
          }
        >
          {t.hours.all}
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
          <span>{t.hours.opens}</span>
          <input
            type="time"
            value={schedule.opensAt}
            onChange={(event) => updateSchedule({ opensAt: event.target.value })}
          />
        </label>
        <label>
          <span>{t.hours.closes}</span>
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

// Foto opcional da promoção/evento: vira o fundo do story no app.
function StoryPhotoField({ barId, value, onChange, onFeedback }) {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !barId) return;

    setIsUploading(true);
    onFeedback?.("");

    try {
      onChange(await uploadBusinessStoryImage(barId, file));
      onFeedback?.(t.messages.storyPhotoReady);
    } catch (error) {
      onFeedback?.(
        error?.message === "INVALID_IMAGE_TYPE"
          ? t.messages.invalidImageType
          : error?.message === "IMAGE_TOO_LARGE"
            ? t.messages.imageTooLarge
            : t.messages.imageFailed
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="story-photo-field">
      <div className="story-photo-preview">
        {value ? <img src={value} alt="" /> : <Image size={22} aria-hidden="true" />}
      </div>
      <div className="story-photo-copy">
        <span>{t.timed.photo}</span>
        <small>{t.timed.photoHint}</small>
        <div className="story-photo-actions">
          <button className="secondary-action" type="button" onClick={() => inputRef.current?.click()} disabled={isUploading}>
            <Upload size={16} aria-hidden="true" />
            {isUploading ? t.cover.uploading : value ? t.timed.changePhoto : t.timed.choosePhoto}
          </button>
          {value && (
            <button className="story-photo-remove" type="button" onClick={() => onChange("")}>
              {t.timed.removePhoto}
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
      />
    </div>
  );
}

function TimedItemsEditor({ items, kind, barId, onAdd, onFeedback, onRemove, onUpdate }) {
  const isEvent = kind === "event";

  return (
    <div className="business-editor">
      {items.map((item) => (
        <section className="business-list-section" key={item.id}>
          <div className="business-section-heading">
            <input
              aria-label={isEvent ? t.timed.eventName : t.timed.promoTitle}
              value={item.title}
              onChange={(event) =>
                onUpdate(item.id, { title: event.target.value })
              }
              placeholder={isEvent ? t.timed.eventPlaceholder : t.timed.promoPlaceholder}
            />
            <button
              className="icon-delete"
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label={t.menu.remove(item.title)}
            >
              <Trash2 size={17} aria-hidden="true" />
            </button>
          </div>

          <textarea
            value={item.description}
            onChange={(event) =>
              onUpdate(item.id, { description: event.target.value })
            }
            placeholder={t.common.optionalDescription}
            rows={3}
          />

          <StoryPhotoField
            barId={barId}
            value={item.imageUrl ?? ""}
            onChange={(imageUrl) => onUpdate(item.id, { imageUrl })}
            onFeedback={onFeedback}
          />

          <div className="profile-grid">
            <label>
              <span>{t.timed.start}</span>
              <input
                type="datetime-local"
                value={item.startsAt}
                onChange={(event) =>
                  onUpdate(item.id, getStartPatch(item, event.target.value, isEvent))
                }
                required={isEvent}
              />
            </label>
            <label>
              <span>{t.timed.end}</span>
              <input
                type="datetime-local"
                value={item.endsAt}
                min={item.startsAt || undefined}
                onChange={(event) =>
                  onUpdate(item.id, { endsAt: event.target.value })
                }
              />
            </label>
          </div>

          {isEvent && (
            <label>
              <span>{t.timed.entryPrice}</span>
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
              aria-label={isEvent ? t.timed.eventPublished : t.timed.promoPublished}
              checked={item.isActive}
              onChange={(event) =>
                onUpdate(item.id, { isActive: event.target.checked })
              }
            />
            <span>{isEvent ? t.timed.eventPublished : t.timed.promoPublished}</span>
          </label>
        </section>
      ))}

      <button className="secondary-action timed-item-add" type="button" onClick={onAdd}>
        <Plus size={17} aria-hidden="true" />
        {isEvent ? t.timed.newEvent : t.timed.newPromo}
      </button>
    </div>
  );
}
