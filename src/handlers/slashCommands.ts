import { ChatInputCommandInteraction, Interaction } from "discord.js";
import { slashCommands } from "../config/commandRegistry";
import { handleSlashError } from "../utils/errorHandler";

/**
 * Xử lý các lệnh slash (/)
 */
export async function handleSlashCommand(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const commandName = interaction.commandName;
  const command = slashCommands.get(commandName);

  if (command) {
    try {
      await command.handler(interaction);
    } catch (err) {
      await handleSlashError(interaction, err, commandName);
    }
  } else {
    await interaction.reply({
      content: "Lệnh không hợp lệ.",
      ephemeral: true,
    });
  }
}

