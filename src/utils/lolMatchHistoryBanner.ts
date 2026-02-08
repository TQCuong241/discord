import { createCanvas, loadImage } from "canvas";

export async function createLoLMatchHistoryBanner(matches: {
  champion: string;
  championIcon: string;
  result: string;
  kills: number;
  deaths: number;
  assists: number;
  kda: string;
  duration: string;
}[]): Promise<Buffer> {
  const validMatches = matches.filter(Boolean);
  const count = Math.min(validMatches.length, 10);

  const scale = 2;
  const width = 1200;
  const rowHeight = 75;
  const headerHeight = 50;
  const padding = 20;

  const canvas = createCanvas(width * scale, (headerHeight + rowHeight * count + padding * 2) * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  // === NỀN CHUNG ===
  ctx.fillStyle = "#0e1013";
  ctx.fillRect(0, 0, width, headerHeight + rowHeight * count + padding * 2);
  ctx.textBaseline = "middle";

  // === HEADER ===
  ctx.fillStyle = "#1a1d22";
  ctx.fillRect(0, 0, width, headerHeight);

  ctx.fillStyle = "#00ffff";
  ctx.font = "bold 24px Arial";
  ctx.fillText("👤 Champion", 100, headerHeight / 2);
  ctx.fillText("🎯 K/D/A", 320, headerHeight / 2);
  ctx.fillText("⚔️ KDA", 500, headerHeight / 2);
  ctx.fillText("⏱️ Duration", 650, headerHeight / 2);
  ctx.fillText("🏁 Result", 850, headerHeight / 2);

  // === DỮ LIỆU TỪNG TRẬN ===
  ctx.imageSmoothingEnabled = true;

  for (let i = 0; i < count; i++) {
    const m = validMatches[i];
    if (!m) continue;
    const y = headerHeight + i * rowHeight;

    // nền phân biệt thắng/thua
    const bgColor = m.result === "victory" ? "rgba(0,255,100,0.12)" : "rgba(255,80,80,0.12)";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, y, width, rowHeight);

    // khung nền avatar
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(15, y + 8, 60, 60);

    // ảnh champion
    try {
      if (m.championIcon && m.championIcon.startsWith("http")) {
        const img = await loadImage(m.championIcon);
        ctx.drawImage(img, 16, y + 9, 58, 58);
      } else {
        ctx.fillStyle = "#333";
        ctx.fillRect(16, y + 9, 58, 58);
      }
    } catch {
      ctx.fillStyle = "#333";
      ctx.fillRect(16, y + 9, 58, 58);
    }

    // Champion name
    ctx.font = "20px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(m.champion || "-", 100, y + rowHeight / 2);

    // === 🎯 K/D/A — nổi bật nhất ===
    ctx.font = "bold 26px Arial"; // Sử dụng Arial thay vì Arial Black
    ctx.shadowColor = "rgba(0, 255, 255, 0.6)";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${m.kills}/${m.deaths}/${m.assists}`, 320, y + rowHeight / 2);
    ctx.shadowBlur = 0;

    // KDA
    ctx.font = "20px Arial";
    ctx.fillStyle = "#aaffff";
    ctx.fillText(m.kda, 500, y + rowHeight / 2);

    // Duration
    ctx.fillStyle = "#99ddff";
    ctx.fillText(m.duration || "-", 650, y + rowHeight / 2);

    // Kết quả
    const resultColor = m.result === "victory" ? "#00ff88" : "#ff4c4c";
    ctx.fillStyle = resultColor;
    ctx.font = "bold 22px Arial";
    ctx.fillText(m.result === "victory" ? "🟢 Win" : "🔴 Lose", 850, y + rowHeight / 2);
  }

  // === KHUNG NGOÀI ===
  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, width, headerHeight + rowHeight * count + padding * 2);

  return canvas.toBuffer("image/png");
}

