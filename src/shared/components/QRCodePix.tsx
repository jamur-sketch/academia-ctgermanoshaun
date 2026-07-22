import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QRCodePix({ value, size = 200 }: { value: string; size?: number }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!value) {
      setUrl("");
      return;
    }
    QRCode.toDataURL(value, { width: size, margin: 1 })
      .then(setUrl)
      .catch(() => setUrl(""));
  }, [value, size]);

  if (!value) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground p-4 text-center"
        style={{ width: size, height: size }}
      >
        QR do PIX ainda não configurado
      </div>
    );
  }
  if (!url) return null;
  return <img src={url} width={size} height={size} alt="QR code PIX" className="rounded-lg" />;
}
