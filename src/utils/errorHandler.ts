import { Message, ChatInputCommandInteraction } from "discord.js";

/**
 * Xử lý lỗi cho prefix commands
 */
export async function handlePrefixError(msg: Message, error: unknown, commandName: string): Promise<void> {
  console.error(`Lỗi khi xử lý prefix command "${commandName}":`, error);
  try {
    const errorMsg = await msg.reply("Đã xảy ra lỗi khi xử lý lệnh này.");
    setTimeout(() => errorMsg.delete().catch(() => {}), 10_000);
  } catch {
    // Ignore nếu không thể reply
  }
}

/**
 * Xử lý lỗi cho slash commands
 */
export async function handleSlashError(
  interaction: ChatInputCommandInteraction,
  error: unknown,
  commandName: string
): Promise<void> {
  console.error(`Lỗi khi xử lý slash command "${commandName}":`, error);

  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "Đã xảy ra lỗi khi xử lý lệnh này.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "Đã xảy ra lỗi khi xử lý lệnh này.",
        ephemeral: true,
      });
    }
  } catch {
    // Ignore nếu không thể reply
  }
}

