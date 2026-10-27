import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer } from "lucide-react";
import { fetchBarById } from "../services/barsService.js";
import { qr as t } from "../texts/misc.js";

// /r/<id>/qr — cartão com QR Code para imprimir e colar na mesa, no balcão ou
// na vitrine. Aponta para a página avulsa /r/<id>. Sem a marca Bora Bar.
export default function QrCodePage({ barId }) {
  const [bar, setBar] = useState(null);
  const [state, setState] = useState("loading");
  const [qrSvg, setQrSvg] = useState("");

  const pageUrl = `${window.location.origin}/r/${encodeURIComponent(barId)}`;
  const shortUrl = pageUrl.replace(/^https?:\/\//, "");

  useEffect(() => {
    let isMounted = true;

    fetchBarById(barId)
      .then((nextBar) => {
        if (isMounted) {
          setBar(nextBar);
          setState(nextBar ? "ready" : "not-found");
        }
      })
      .catch(() => isMounted && setState("error"));

    QRCode.toString(pageUrl, { type: "svg", margin: 0, errorCorrectionLevel: "M" })
      .then((svg) => isMounted && setQrSvg(svg))
      .catch(() => isMounted && setState("error"));

    return () => {
      isMounted = false;
    };
  }, [barId, pageUrl]);

  useEffect(() => {
    if (bar) {
      document.title = t.title(bar.name);
    }
  }, [bar]);

  async function downloadPng() {
    const dataUrl = await QRCode.toDataURL(pageUrl, {
      width: 1200,
      margin: 2,
      errorCorrectionLevel: "M"
    });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `qrcode-${barId}.png`;
    link.click();
  }

  if (state === "loading") {
    return (
      <main className="qr-page">
        <p className="qr-status">{t.generating}</p>
      </main>
    );
  }

  if (state !== "ready") {
    return (
      <main className="qr-page">
        <p className="qr-status">
          {state === "not-found" ? t.notFound : t.error}
        </p>
      </main>
    );
  }

  return (
    <main className="qr-page">
      <div className="qr-toolbar">
        <button className="primary-action" type="button" onClick={() => window.print()}>
          <Printer size={18} aria-hidden="true" />
          {t.print}
        </button>
        <button className="secondary-action" type="button" onClick={downloadPng}>
          <Download size={18} aria-hidden="true" />
          {t.download}
        </button>
      </div>

      <article className="qr-card">
        <p className="qr-card-kicker">{t.kicker}</p>
        <h1>{bar.name}</h1>
        <div
          className="qr-code"
          role="img"
          aria-label={t.qrAria(shortUrl)}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <p className="qr-card-call">{t.call}</p>
        <p className="qr-card-url">{shortUrl}</p>
      </article>

      <p className="qr-hint">{t.hint}</p>
    </main>
  );
}
