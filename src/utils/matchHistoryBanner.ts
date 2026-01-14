import { createCanvas, loadImage } from "canvas";

export async function createMatchHistoryBanner(matches: {
  agent: string;
  agentIcon: string;
  map: string;
  kills: number;
  deaths: number;
  assists: number;
  kd: string;
  hs?: string;
  result: string;
  roundsWon?: number;
  roundsLost?: number;
}[]): Promise<Buffer> {
  const validMatches = matches.filter(Boolean);
  const count = Math.min(validMatches.length, 10);

  const scale = 2;
  const width = 880;
  const rowHeight = 65;
  const headerHeight = 45;
  const padding = 15;

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
  ctx.font = "bold 20px Arial";
  ctx.fillText("🗺️ Map", 90, headerHeight / 2);
  ctx.fillText("🎯 K/D/A", 260, headerHeight / 2);
  ctx.fillText("⚔️ KD", 430, headerHeight / 2);
  ctx.fillText("💥 HS%", 530, headerHeight / 2);
  ctx.fillText("🏆 Round", 640, headerHeight / 2);
  ctx.fillText("🏁 Result", 760, headerHeight / 2);

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
    ctx.fillRect(12, y + 6, 52, 52);

    // ảnh agent
    try {
      if (m.agentIcon && m.agentIcon.startsWith("http")) {
        const img = await loadImage(m.agentIcon);
        ctx.drawImage(img, 13, y + 7, 50, 50);
      } else {
        ctx.fillStyle = "#333";
        ctx.fillRect(13, y + 7, 50, 50);
      }
    } catch {
      ctx.fillStyle = "#333";
      ctx.fillRect(13, y + 7, 50, 50);
    }

    // Map
    ctx.font = "18px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(m.map || "-", 90, y + rowHeight / 2);

    // === 🎯 K/D/A — nổi bật nhất ===
    ctx.font = "bold 22px 'Arial Black'";
    ctx.shadowColor = "rgba(0, 255, 255, 0.6)";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${m.kills}/${m.deaths}/${m.assists}`, 260, y + rowHeight / 2);
    ctx.shadowBlur = 0; // tắt glow sau khi vẽ xong

    // KD
    ctx.font = "18px Arial";
    ctx.fillStyle = "#aaffff";
    ctx.fillText(m.kd, 430, y + rowHeight / 2);

    // HS%
    ctx.fillStyle = "#ffff66";
    ctx.fillText(m.hs ?? "-", 530, y + rowHeight / 2);

    // Round thắng/thua
    const rounds = `${m.roundsWon ?? "-"}-${m.roundsLost ?? "-"}`;
    ctx.fillStyle = "#99ddff";
    ctx.fillText(rounds, 640, y + rowHeight / 2);

    // Kết quả
    const resultColor = m.result === "victory" ? "#00ff88" : "#ff4c4c";
    ctx.fillStyle = resultColor;
    ctx.font = "bold 18px Arial";
    ctx.fillText(m.result === "victory" ? "🟢 Win" : "🔴 Lose", 760, y + rowHeight / 2);
  }

  // === KHUNG NGOÀI ===
  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, width, headerHeight + rowHeight * count + padding * 2);

  return canvas.toBuffer("image/png");
}
