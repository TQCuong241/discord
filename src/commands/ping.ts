import {
  Message,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

// ===== Đăng ký Slash Command =====
export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Kiểm tra độ phản hồi của bot");

// ===== Slash command =====
export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const start = Date.now();
    await interaction.reply({ content: "Pong!", ephemeral: true });
    const end = Date.now();
    console.log(`Ping time: ${end - start}ms`);
  } catch (err) {
    console.error("Lỗi khi xử lý /ping:", err);
    if (interaction.replied || interaction.deferred)
      await interaction.followUp({ content: "Đã xảy ra lỗi khi xử lý ping.", ephemeral: true });
    else
      await interaction.reply({ content: "Đã xảy ra lỗi khi xử lý ping.", ephemeral: true });
  }
}

// ===== Prefix command (!ping) =====
export async function executeMessage(msg: Message) {
  try {
    const start = Date.now();
    const reply = await msg.reply("Pong!");
    const end = Date.now();
    console.log(`Ping time: ${end - start}ms`);
    setTimeout(() => reply.delete().catch(() => {}), 10_000);
  } catch (err) {
    console.error("Lỗi khi xử lý !ping:", err);
    const errorMsg = await msg.reply("Đã xảy ra lỗi khi xử lý ping.");
    setTimeout(() => errorMsg.delete().catch(() => {}), 10_000);
  }
}

export default { data, execute, executeMessage };
