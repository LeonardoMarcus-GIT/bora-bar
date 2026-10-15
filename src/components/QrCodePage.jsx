import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer } from "lucide-react";
import { fetchBarById } from "../services/barsService.js";

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
      document.title = `QR Code — ${bar.name}`;
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
        <p className="qr-status">Gerando QR Code…</p>
      </main>
    );
  }

  if (state !== "ready") {
    return (
      <main className="qr-page">
        <p className="qr-status">
          {state === "not-found"
            ? "Estabelecimento não encontrado. Confira o link."
            : "Não foi possível gerar o QR Code agora. Tente de novo."}
        </p>
      </main>
    );
  }

  return (
    <main className="qr-page">
      <div className="qr-toolbar">
        <button className="primary-action" type="button" onClick={() => window.print()}>
          <Printer size={18} aria-hidden="true" />
          Imprimir
        </button>
        <button className="secondary-action" type="button" onClick={downloadPng}>
          <Download size={18} aria-hidden="true" />
          Baixar imagem do QR Code
        </button>
      </div>

      <article className="qr-card">
        <p className="qr-card-kicker">Cardápio digital</p>
        <h1>{bar.name}</h1>
        <div
          className="qr-code"
          role="img"
          aria-label={`QR Code para ${shortUrl}`}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <p className="qr-card-call">Aponte a câmera do celular para ver o cardápio, os preços e falar com a gente.</p>
        <p className="qr-card-url">{shortUrl}</p>
      </article>

      <p className="qr-hint">
        Dica: imprima em papel mais grosso ou plastifique. Teste com a câmera do
        celular antes de colar.
      </p>
    </main>
  );
}
