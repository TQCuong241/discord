import { ChatInputCommandInteraction } from "discord.js";

/**
 * Helper để defer reply cho các commands cần thời gian xử lý
 */
export async function deferIfNeeded(
  interaction: ChatInputCommandInteraction,
  requiresDefer: boolean
): Promise<void> {
  if (requiresDefer && !interaction.deferred && !interaction.replied) {
    await interaction.deferReply();
  }
}

