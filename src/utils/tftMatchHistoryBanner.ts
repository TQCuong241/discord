import { createCanvas, loadImage } from "canvas";

export async function createTFTMatchHistoryBanner(matches: {
  placement: number;
  result: string;
  duration: string;
  traits: string[];
  units: string[];
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
  ctx.fillText("#", 30, headerHeight / 2);
  ctx.fillText("🏆 Placement", 80, headerHeight / 2);
  ctx.fillText("⏱️ Duration", 280, headerHeight / 2);
  ctx.fillText("🏁 Result", 500, headerHeight / 2);

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

    // STT
    ctx.font = "20px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${i + 1}.`, 30, y + rowHeight / 2);

    // Placement
    ctx.font = "bold 24px Arial";
    const placementColor = m.placement <= 4 ? "#00ff88" : m.placement <= 6 ? "#ffaa00" : "#ff4c4c";
    ctx.fillStyle = placementColor;
    ctx.fillText(`#${m.placement}`, 80, y + rowHeight / 2);

    // Duration
    ctx.font = "20px Arial";
    ctx.fillStyle = "#aaffff";
    ctx.fillText(m.duration || "-", 280, y + rowHeight / 2);

    // Kết quả
    const resultColor = m.result === "victory" ? "#00ff88" : "#ff4c4c";
    ctx.fillStyle = resultColor;
    ctx.font = "bold 22px Arial";
    ctx.fillText(m.result === "victory" ? "🟢 Top 4" : "🔴 Bottom 4", 500, y + rowHeight / 2);
  }

  // === KHUNG NGOÀI ===
  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, width, headerHeight + rowHeight * count + padding * 2);

  return canvas.toBuffer("image/png");
}

