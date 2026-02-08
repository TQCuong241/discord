import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { QueueManager } from "../queue";

export function createMusicControls(isPaused = false, guildId?: string) {
  const queue = guildId ? QueueManager.getQueue(guildId) : null;
  const hasNext = queue ? queue.songs.length > 0 : false;
  const queueCount = queue ? queue.songs.length : 0;

  const controlRow = new ActionRowBuilder<ButtonBuilder>();

  controlRow.addComponents(
    new ButtonBuilder()
      .setCustomId(isPaused ? "resume" : "pause")
      .setEmoji(isPaused ? "▶️" : "⏸️")
      .setLabel(isPaused ? "Tiếp tục" : "Tạm dừng")
      .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Secondary)
  );

  // Tạm thời tắt nút skip
  // if (hasNext) {
  //   controlRow.addComponents(
  //     new ButtonBuilder()
  //       .setCustomId("skip")
  //       .setEmoji("⏭️")
  //       .setLabel("Bỏ qua")
  //       .setStyle(ButtonStyle.Primary)
  //   );
  // }

  controlRow.addComponents(
    new ButtonBuilder()
      .setCustomId("stop")
      .setEmoji("⏹️")
      .setLabel("Dừng")
      .setStyle(ButtonStyle.Danger)
  );

  const manageRow = new ActionRowBuilder<ButtonBuilder>();

  manageRow.addComponents(
    new ButtonBuilder()
      .setCustomId("list")
      .setEmoji("📋")
      .setLabel(`Danh sách${queueCount > 0 ? ` (${queueCount})` : ""}`)
      .setStyle(ButtonStyle.Secondary)
  );

  manageRow.addComponents(
    new ButtonBuilder()
      .setCustomId("delete")
      .setEmoji("🗑️")
      .setLabel("Xóa bài")
      .setStyle(ButtonStyle.Secondary)
  );

  return [controlRow, manageRow];
}
