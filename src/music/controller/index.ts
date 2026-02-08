export { createMusicControls } from "./musicControls";
export { setupMusicCollector } from "./musicCollector";

import { TextChannel, EmbedBuilder, APIEmbedField, ColorResolvable } from "discord.js";
import { AudioPlayer, VoiceConnection } from "@discordjs/voice";
import { QueueManager } from "../queue";
import { createMusicControls } from "./musicControls";
import { setupMusicCollector } from "./musicCollector";
import { colorLog } from "../../utils";

const EMBED_COLORS: ColorResolvable[] = [
  0x1abc9c, 0xe67e22, 0xe74c3c, 0x9b59b6, 0x3498db, 0x2ecc71, 0xf1c40f,
];

const ANSI_COLORS: string[] = [
  "\u001b[1;31m",
  "\u001b[1;32m",
  "\u001b[1;33m",
  "\u001b[1;34m",
  "\u001b[1;35m",
  "\u001b[1;36m",
];

const TITLES = ["Đang phát", "Now Playing", "Giai điệu đang vang lên"];
const UNKNOWN_SONGS = ["(Không rõ tên bài hát)", "(Bài hát bí ẩn)", "(Chưa xác định)"];
const NEXT_LABELS = ["Bài tiếp theo", "Trong hàng chờ", "Hàng đợi phát nhạc"];

export async function createNewMusicMessage(
  channel: TextChannel,
  player: AudioPlayer,
  connection: VoiceConnection,
  guildId: string,
  songTitle?: string
) {
  try {
    const queue = QueueManager.getQueue(guildId);
    const hasNext = queue ? queue.songs.length > 0 : false;

    const color = (EMBED_COLORS[Math.floor(Math.random() * EMBED_COLORS.length)] ??
      0x5865f2) as ColorResolvable;
    const ansiTitle = ANSI_COLORS[Math.floor(Math.random() * ANSI_COLORS.length)] ?? "\u001b[1;37m";
    const ansiQueue = ANSI_COLORS[Math.floor(Math.random() * ANSI_COLORS.length)] ?? "\u001b[1;37m";
    const title = TITLES[Math.floor(Math.random() * TITLES.length)] ?? " Đang phát";
    const safeSong = (songTitle ?? UNKNOWN_SONGS[Math.floor(Math.random() * UNKNOWN_SONGS.length)]) as string;
    const nextLabel = (NEXT_LABELS[Math.floor(Math.random() * NEXT_LABELS.length)] ?? " Bài tiếp theo") as string;

    const queueText = hasNext
      ? `\`\`\`ansi
${ansiQueue}${queue.songs.length} bài trong hàng đợi\u001b[0m
\`\`\``
      : "Không có bài nào";

    const field: APIEmbedField = {
      name: nextLabel,
      value: queueText,
    };

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title ?? "Đang phát")
      .setDescription(
        `\`\`\`ansi
${ansiTitle}${safeSong}\u001b[0m
\`\`\``
      )
      .addFields(field)
      .setFooter({ text: "🎧 Bot Cường — Music System" });

    const controls = createMusicControls(false, guildId);
    const newMsg = await channel.send({
      embeds: [embed],
      components: controls,
    });

    QueueManager.setControlMessage(guildId, newMsg);
    queue.message = newMsg;
    setupMusicCollector(newMsg, player, connection, guildId, channel);
    return newMsg;
  } catch (err) {}
}

export async function updateMusicControls(guildId: string) {
  try {
    const msg = QueueManager.getControlMessage(guildId);
    if (!msg) return;
    const queue = QueueManager.getQueue(guildId);
    if (!queue) return;

    const hasNext = queue.songs.length > 0;
    const color =
      (msg.embeds[0]?.data?.color as ColorResolvable) ??
      (EMBED_COLORS[Math.floor(Math.random() * EMBED_COLORS.length)] as ColorResolvable);
    const ansiTitle = ANSI_COLORS[Math.floor(Math.random() * ANSI_COLORS.length)] ?? "\u001b[1;37m";
    const ansiQueue = ANSI_COLORS[Math.floor(Math.random() * ANSI_COLORS.length)] ?? "\u001b[1;37m";
    const title = TITLES[Math.floor(Math.random() * TITLES.length)] ?? " Đang phát";
    const safeSong = (queue.currentTitle ?? UNKNOWN_SONGS[Math.floor(Math.random() * UNKNOWN_SONGS.length)]) as string;
    const nextLabel = (NEXT_LABELS[Math.floor(Math.random() * NEXT_LABELS.length)] ?? " Bài tiếp theo") as string;

    const queueText = hasNext
      ? `\`\`\`ansi
${ansiQueue}${queue.songs.length} bài trong hàng đợi\u001b[0m
\`\`\``
      : "Không có bài nào trong hàng đợi";

    const field: APIEmbedField = { name: nextLabel, value: queueText };

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title ?? " Đang phát")
      .setDescription(
        `\`\`\`ansi
${ansiTitle}${safeSong}\u001b[0m
\`\`\``
      )
      .addFields(field)
      .setFooter({ text: "🎧 Bot Cường — Music System" });

    const controls = createMusicControls(false, guildId);
    await msg.edit({
      embeds: [embed],
      components: controls,
    });
  } catch (err) {
    console.error(colorLog("[Music] Không thể cập nhật giao diện điều khiển:", "red"), err);
  }
}
