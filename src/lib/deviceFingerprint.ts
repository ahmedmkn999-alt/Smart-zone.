// بصمة جهاز حقيقية بدل معرّف عشوائي متخزن — بتتحسب من جديد كل مرة من خصائص
// الجهاز والمتصفح نفسه، فمش بتتأثر بمسح الكاش أو الكوكيز أو الـ localStorage.
// ملحوظة صادقة: أي بصمة متصفح (browser fingerprint) مش مضمونة 100% — تحديث
// المتصفح أو تغيير إعدادات معيّنة ممكن يغيّرها شوية. عشان كده بنجمع أكتر من
// إشارة مع بعض (مش إشارة واحدة بس) عشان نقلل احتمالية إن جهازين مختلفين
// يطلعوا بنفس البصمة، وده أقوى بكتير من مجرد UUID عشوائي في localStorage
// (اللي أي حد يقدر يمسحه أو يزوّره بسطر واحد في الـ console).

function getCanvasSignal(): string {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    canvas.width = 220;
    canvas.height = 30;
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(0, 0, 220, 30);
    ctx.fillStyle = "#069";
    ctx.fillText("SMART-ZONE-fingerprint-🔒", 2, 2);
    return canvas.toDataURL();
  } catch {
    return "";
  }
}

function getWebglSignal(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return "";
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    if (!info) return "";
    return String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
  } catch {
    return "";
  }
}

export function computeDeviceFingerprint(): string {
  if (typeof window === "undefined") return "";

  const signals = [
    navigator.userAgent,
    navigator.language,
    String(navigator.hardwareConcurrency || ""),
    navigator.platform,
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    String(new Date().getTimezoneOffset()),
    Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    getCanvasSignal(),
    getWebglSignal()
  ];

  return signals.join("###");
}
