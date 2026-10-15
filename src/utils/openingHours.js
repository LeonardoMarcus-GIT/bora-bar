// Calcula se o estabelecimento está aberto a partir do texto de horário que o
// dono cadastra (ex.: "Seg a qui: 17h-00h | Sex e sab: 17h-02h | Dom: 16h-23h").
// O horário é sempre avaliado no fuso de Brasília, não no fuso do aparelho.

const TIME_ZONE = "America/Sao_Paulo";
const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY;

// Índices iguais ao Date.getDay(): 0 = domingo.
const DAY_INDEX = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };
const DAY_SHORT_LABELS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const TIME_RANGE_PATTERN =
  /(\d{1,2})(?:\s*[h:]\s*(\d{2}))?\s*h?\s*(?:-|–|—|\bate\b|\bas\b|\ba\b)\s*(\d{1,2})(?:\s*[h:]\s*(\d{2}))?\s*h?/g;

function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function dayFromWord(word) {
  return DAY_INDEX[normalize(word).slice(0, 3)];
}

// Lê o trecho de dias ("Ter a dom", "Seg, Qua e Sex", "Todos os dias") e
// devolve índices no padrão Date.getDay() (0 = domingo).
export function parseOpeningDays(dayText) {
  return parseDays(dayText);
}

function parseDays(dayText) {
  const text = normalize(dayText);

  if (!text || /todos|todo dia|diariamente|diario/.test(text)) {
    return ALL_DAYS;
  }

  const days = new Set();

  text
    .split(/,|\be\b|\//)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const range = part.match(/^([a-z]+)\s*(?:\ba\b|-|–|ate)\s*([a-z]+)$/);

      if (range) {
        const start = dayFromWord(range[1]);
        const end = dayFromWord(range[2]);

        if (start === undefined || end === undefined) {
          return;
        }

        for (let day = start; ; day = (day + 1) % 7) {
          days.add(day);

          if (day === end) {
            break;
          }
        }

        return;
      }

      const day = dayFromWord(part);

      if (day !== undefined) {
        days.add(day);
      }
    });

  return [...days].sort();
}

function toMinutes(hours, minutes) {
  const hourValue = Number(hours);
  const minuteValue = Number(minutes ?? 0);

  if (hourValue > 24 || minuteValue > 59) {
    return null;
  }

  return (hourValue % 24) * 60 + minuteValue;
}

function parseTimeRanges(timeText) {
  const ranges = [];

  for (const match of normalize(timeText).matchAll(TIME_RANGE_PATTERN)) {
    const opens = toMinutes(match[1], match[2]);
    let closes = toMinutes(match[3], match[4]);

    if (opens === null || closes === null) {
      continue;
    }

    // Fecha depois da meia-noite (ex.: 18h-02h) ou funciona 24h (ex.: 0h-24h).
    if (closes <= opens) {
      closes += MINUTES_PER_DAY;
    }

    ranges.push({ opens, closes });
  }

  return ranges;
}

// Converte o texto em uma lista de janelas { day, opens, closes } em minutos.
// Retorna lista vazia quando o texto não pode ser interpretado.
export function parseOpeningHours(hoursText) {
  const windows = [];

  normalize(hoursText)
    .split(/\||;|\n/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .forEach((segment) => {
      const firstDigit = segment.search(/\d/);

      if (firstDigit === -1) {
        return;
      }

      const dayText = segment.slice(0, firstDigit).replace(/[:\s]+$/, "");
      const timeText = segment.slice(firstDigit);
      const days = parseDays(dayText);
      const ranges = parseTimeRanges(timeText);

      days.forEach((day) => {
        ranges.forEach((range) => {
          windows.push({ day, opens: range.opens, closes: range.closes });
        });
      });
    });

  return windows;
}

function getLocalWeekMinute(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  );
  const weekday = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].indexOf(
    parts.weekday.toLowerCase()
  );

  return weekday * MINUTES_PER_DAY + Number(parts.hour) * 60 + Number(parts.minute);
}

export function formatClock(minutes) {
  const dayMinutes = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = String(Math.floor(dayMinutes / 60)).padStart(2, "0");
  const mins = dayMinutes % 60;
  return mins ? `${hours}h${String(mins).padStart(2, "0")}` : `${hours}h`;
}

function describeOpening(startWeekMinute, nowWeekMinute) {
  const startDay = Math.floor(startWeekMinute / MINUTES_PER_DAY) % 7;
  const nowDay = Math.floor(nowWeekMinute / MINUTES_PER_DAY) % 7;
  const dayDistance = (startDay - nowDay + 7) % 7;
  const clock = formatClock(startWeekMinute);

  if (dayDistance === 0 && startWeekMinute - nowWeekMinute < MINUTES_PER_DAY) {
    return `Abre hoje às ${clock}`;
  }

  if (dayDistance === 1) {
    return `Abre amanhã às ${clock}`;
  }

  return `Abre ${DAY_SHORT_LABELS[startDay]} às ${clock}`;
}

/**
 * Status de funcionamento do estabelecimento.
 * - Se o horário puder ser lido, o status é automático (isAutomatic: true).
 * - Se não, usa o valor manual salvo no painel (is_open).
 */
export function getOpenStatus(hoursText, manualIsOpen = false, now = new Date()) {
  const windows = parseOpeningHours(hoursText);

  if (!windows.length) {
    return {
      isOpen: Boolean(manualIsOpen),
      isAutomatic: false,
      detail: ""
    };
  }

  const nowMinute = getLocalWeekMinute(now);
  let closingAt = null;
  let nextOpeningAt = null;

  windows.forEach((window) => {
    const start = window.day * MINUTES_PER_DAY + window.opens;
    const end = window.day * MINUTES_PER_DAY + window.closes;

    // Testa a semana atual e a anterior (janela de sábado que vira domingo).
    [start, start - MINUTES_PER_WEEK].forEach((windowStart, index) => {
      const windowEnd = index === 0 ? end : end - MINUTES_PER_WEEK;

      if (nowMinute >= windowStart && nowMinute < windowEnd) {
        closingAt = Math.max(closingAt ?? windowEnd, windowEnd);
      }
    });

    const upcomingStart = start > nowMinute ? start : start + MINUTES_PER_WEEK;

    if (nextOpeningAt === null || upcomingStart < nextOpeningAt) {
      nextOpeningAt = upcomingStart;
    }
  });

  if (closingAt !== null) {
    return {
      isOpen: true,
      isAutomatic: true,
      detail: `Fecha às ${formatClock(closingAt)}`
    };
  }

  return {
    isOpen: false,
    isAutomatic: true,
    detail: describeOpening(nextOpeningAt, nowMinute)
  };
}
