import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { QueueManager } from "../queue";

/**
 *Bộ nút điều khiển (Pause / Resume / Skip / Stop / List / Delete)
 */
export function createMusicControls(isPaused = false, guildId?: string) {
  const row = new ActionRowBuilder<ButtonBuilder>();
  const queue = guildId ? QueueManager.getQueue(guildId) : null;
  const hasNext = queue ? queue.songs.length > 0 : false;

  const baseButtons = [
    new ButtonBuilder()
      .setCustomId(isPaused ? "resume" : "pause")
      .setLabel(isPaused ? "▶️ Tiếp tục" : "⏸️ Tạm dừng")
      .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Secondary),

    ...(hasNext
      ? [
          new ButtonBuilder()
            .setCustomId("skip")
            .setLabel("⏭️ Bỏ qua")
            .setStyle(ButtonStyle.Primary),
        ]
      : []),

    new ButtonBuilder()
      .setCustomId("list")
      .setLabel("📜 Danh sách")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("delete")
      .setLabel("🗑️ Xóa bài")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("stop")
      .setLabel("🛑 Dừng")
      .setStyle(ButtonStyle.Danger),
  ];

  row.addComponents(baseButtons);
  return row;
}
