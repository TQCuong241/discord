import {
  Message,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("linkbot")
  .setDescription("Tạo link mời bot Discord vào server khác");

// ===== Slash command =====
export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) {
      await interaction.reply({
        content: "Thiếu CLIENT_ID trong file .env.",
        ephemeral: true,
      });
      return;
    }

    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&integration_type=0&scope=bot%20applications.commands`;

    await interaction.reply({
      content: `Link mời bot: ${inviteUrl}`,
      ephemeral: true,
    });
  } catch (err) {
    console.error("Lỗi khi tạo link mời bot:", err);
    if (interaction.replied || interaction.deferred)
      await interaction.followUp({
        content: "Không thể tạo link mời bot.",
        ephemeral: true,
      });
    else
      await interaction.reply({
        content: "Không thể tạo link mời bot.",
        ephemeral: true,
      });
  }
}

// ===== Prefix command (!linkbot) =====
export async function executeMessage(msg: Message) {
  try {
    const clientId = process.env.DISCORD_CLIENT_ID;

    if (!clientId) {
      await msg.reply("Thiếu CLIENT_ID trong file .env.");
      return;
    }

    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&integration_type=0&scope=bot%20applications.commands`;

    const replyMsg = await msg.reply(`Link mời bot: ${inviteUrl}`);

    // Tự xóa sau 5 phút
    setTimeout(() => {
      replyMsg.delete().catch(() => {});
      msg.delete().catch(() => {});
    }, 300_000);
  } catch (err) {
    console.error("Lỗi khi tạo link mời bot:", err);
    const errorMsg = await msg.reply("Không thể tạo link mời bot.");
    setTimeout(() => errorMsg.delete().catch(() => {}), 10_000);
  }
}

export default { data, execute, executeMessage };
