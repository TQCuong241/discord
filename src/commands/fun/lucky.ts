import {
  Message,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

// ===== Đăng ký Slash Command =====
export const data = new SlashCommandBuilder()
  .setName("lucky")
  .setDescription("Xem số may mắn của bạn hôm nay");

// ===== Slash command =====
export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const number = Math.floor(Math.random() * 6) + 1;
    await interaction.reply({
      content: `Số may mắn hôm nay của bạn là: ${number}`,
      ephemeral: true,
    });
  } catch (err) {
    console.error("Lỗi khi xử lý /lucky:", err);
    if (interaction.replied || interaction.deferred)
      await interaction.followUp({
        content: "Đã xảy ra lỗi khi xử lý lệnh.",
        ephemeral: true,
      });
    else
      await interaction.reply({
        content: "Đã xảy ra lỗi khi xử lý lệnh.",
        ephemeral: true,
      });
  }
}

// ===== Prefix command (!lucky) =====
export async function executeMessage(msg: Message) {
  try {
    const number = Math.floor(Math.random() * 6) + 1;
    const reply = await msg.reply(`Số may mắn hôm nay của bạn là: ${number}`);
    setTimeout(() => reply.delete().catch(() => {}), 10_000);
  } catch (err) {
    console.error("Lỗi khi xử lý !lucky:", err);
    const errorMsg = await msg.reply("Đã xảy ra lỗi khi xử lý lệnh.");
    setTimeout(() => errorMsg.delete().catch(() => {}), 10_000);
  }
}

export default { data, execute, executeMessage };
