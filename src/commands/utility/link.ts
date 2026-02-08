import {
  Message,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  TextChannel,
  NewsChannel,
  VoiceChannel,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("link")
  .setDescription("Tạo link mời Discord của server hiện tại (có thời hạn)");

// ===== Slash command =====
export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    if (!interaction.guild || !interaction.channel) {
      await interaction.reply({
        content: "Lệnh này chỉ dùng trong server (guild).",
        ephemeral: true,
      });
      return;
    }

    const channel = interaction.channel;
    if (
      channel instanceof TextChannel ||
      channel instanceof NewsChannel ||
      channel instanceof VoiceChannel
    ) {
      const invite = await channel.createInvite({
        maxAge: 3600, // 1h
        maxUses: 5,   // chỉ cho phép 5 người dùng
        reason: `Tạo bởi ${interaction.user.tag}`,
      });

      await interaction.reply({
        content: `Link mời Discord của server này:\n${invite.url}\n(Hết hạn sau 1 giờ hoặc 5 lần sử dụng)`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "Không thể tạo link trong loại kênh này.",
        ephemeral: true,
      });
    }
  } catch (err) {
    console.error("Lỗi khi tạo link:", err);
    if (interaction.replied || interaction.deferred)
      await interaction.followUp({
        content: "Không thể tạo link — có thể bot thiếu quyền Create Instant Invite.",
        ephemeral: true,
      });
    else
      await interaction.reply({
        content: "Không thể tạo link — có thể bot thiếu quyền Create Instant Invite.",
        ephemeral: true,
      });
  }
}

// ===== Prefix command (!link) =====
export async function executeMessage(msg: Message) {
  try {
    if (!msg.guild) {
      await msg.reply("Lệnh này chỉ dùng trong server (guild).");
      return;
    }

    const channel = msg.channel;
    if (
      channel instanceof TextChannel ||
      channel instanceof NewsChannel ||
      channel instanceof VoiceChannel
    ) {
      const invite = await channel.createInvite({
        maxAge: 3600, // 1h
        maxUses: 5,   // 5 lần sử dụng
        reason: `Tạo bởi ${msg.author.tag}`,
      });

      const replyMsg = await msg.reply(
        `Link mời Discord của server này:\n${invite.url}\n(Hết hạn sau 1 giờ hoặc 5 lần sử dụng)`
      );

      // Xóa tin nhắn sau 20 giây
      setTimeout(() => {
        replyMsg.delete().catch(() => {});
        msg.delete().catch(() => {});
      }, 20_000);
    } else {
      await msg.reply("Không thể tạo link trong loại kênh này.");
    }
  } catch (err) {
    console.error("Lỗi khi tạo link:", err);
    const errorMsg = await msg.reply(
      "Không thể tạo link — có thể bot thiếu quyền Create Instant Invite."
    );
    setTimeout(() => errorMsg.delete().catch(() => {}), 10_000);
  }
}

export default { data, execute, executeMessage };
