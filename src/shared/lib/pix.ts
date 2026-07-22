// Gera o código PIX "copia e cola" (BR Code / EMV) a partir de uma chave PIX
// e um valor. Assim cada pedido tem um QR com o valor exato.

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function field(id: string, value: string): string {
  return id + value.length.toString().padStart(2, "0") + value;
}

function sanitize(s: string, max: number): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .toUpperCase()
    .slice(0, max);
}

interface PixOpts {
  key: string;
  amount?: number;
  name?: string;
  city?: string;
  txid?: string;
}

export function buildPix({
  key,
  amount,
  name = "CT GERMANO SCHAUN",
  city = "SANTO ANTONIO",
  txid = "***",
}: PixOpts): string {
  const mai = field("26", field("00", "br.gov.bcb.pix") + field("01", key));
  let payload =
    field("00", "01") +
    mai +
    field("52", "0000") +
    field("53", "986") +
    (amount && amount > 0 ? field("54", amount.toFixed(2)) : "") +
    field("58", "BR") +
    field("59", sanitize(name, 25)) +
    field("60", sanitize(city, 15)) +
    field("62", field("05", txid));
  payload += "6304";
  return payload + crc16(payload);
}

// Se já for um código copia-e-cola completo, usa como está;
// senão trata como CHAVE PIX e monta o código com o valor.
export function pixForAmount(keyOrCode: string, amount: number): string {
  const k = (keyOrCode || "").trim();
  if (!k) return "";
  if (k.startsWith("0002")) return k;
  return buildPix({ key: k, amount });
}
