import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";

/**
 * Lệnh xóa tất cả tin nhắn của BOT trong kênh chỉ định.
 * - Hỗ trợ cả /clearbotmsg và !clearbotmsg
 * - Chỉ admin hoặc có quyền ManageMessages
 */

export const data = new SlashCommandBuilder()
  .setName("clearbotmsg")
  .setDescription("Xóa tất cả tin nhắn của bot trong một kênh (Admin only)")
  .addChannelOption(opt =>
    opt
      .setName("kenh")
      .setDescription("Chọn kênh cần xóa tin nhắn bot (nếu không chọn thì dùng kênh hiện tại)")
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

/** Hàm xử lý chính */
async function clearBotMessages(channel: TextChannel, replyFn: (msg: string) => Promise<any>) {
  try {
    const messages = await channel.messages.fetch({ limit: 100 });
    const botMessages = messages.filter(m => m.author.bot);

    if (botMessages.size === 0) {
      await replyFn("Không có tin nhắn bot nào để xóa trong kênh này.");
      return;
    }

    await channel.bulkDelete(botMessages, true);
    await replyFn(`Đã xóa ${botMessages.size} tin nhắn của bot trong kênh ${channel.name}.`);
  } catch (err) {
    console.error("Lỗi khi xóa tin nhắn bot:", err);
    await replyFn("Đã xảy ra lỗi khi xóa tin nhắn bot.");
  }
}

/** Slash command (/clearbotmsg) */
export async function execute(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({ content: "Lệnh này chỉ dùng trong server.", ephemeral: true });
    return;
  }

  const channel = (interaction.options.getChannel("kenh") ||
    interaction.channel) as TextChannel;

  if (!channel || !("bulkDelete" in channel)) {
    await interaction.reply({ content: "Kênh này không hợp lệ hoặc không hỗ trợ bulk delete.", ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });
  const replyFn = (msg: string) =>
    interaction.followUp({ content: msg, ephemeral: true });

  await clearBotMessages(channel, replyFn);
}

/** Prefix command (!clearbotmsg) */
export async function executeMessage(msg: Message) {
  if (!msg.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
    const reply = await msg.reply("Bạn không có quyền xóa tin nhắn.");
    setTimeout(() => reply.delete().catch(() => {}), 10_000);
    return;
  }

  const mentioned = msg.mentions.channels.first();
  const channel = (mentioned || msg.channel) as TextChannel;

  const replyFn = async (text: string) => {
    const r = await msg.reply(text);
    setTimeout(() => r.delete().catch(() => {}), 10_000);
    return r;
  };

  await clearBotMessages(channel, replyFn);

  setTimeout(() => msg.delete().catch(() => {}), 15_000);
}

export default { data, execute, executeMessage };
