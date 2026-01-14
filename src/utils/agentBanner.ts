import { createCanvas, loadImage } from "canvas";

export async function createAgentBanner(agentIcons: (string | undefined)[]): Promise<Buffer> {
  // Lọc bỏ null / undefined / chuỗi rỗng
  const icons = agentIcons.filter((url): url is string => !!url && url.trim().startsWith("http")).slice(0, 10);

  const size = 80; // kích thước mỗi avatar
  const spacing = 10;
  const totalWidth = icons.length * (size + spacing) - spacing;
  const canvas = createCanvas(totalWidth, size);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0e1013";
  ctx.fillRect(0, 0, totalWidth, size);

  for (let i = 0; i < icons.length; i++) {
    try {
      // Ép chắc chắn về string để loadImage không cảnh báo
      const img = await loadImage(String(icons[i]));
      const x = i * (size + spacing);
      ctx.drawImage(img, x, 0, size, size);
    } catch (err) {
      console.warn(`⚠️ Không tải được ảnh agent: ${icons[i]}`);
    }
  }

  return canvas.toBuffer("image/png");
}
