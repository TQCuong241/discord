import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  Message,
  GuildMember,
} from "discord.js";

/**
 * Lệnh xóa thành viên không hoạt động quá X tháng
 * - Hỗ trợ cả !deleteTV và /deleteTV
 * - Chỉ admin mới được dùng
 */
export const data = new SlashCommandBuilder()
  .setName("deletetv")
  .setDescription("Xóa các thành viên không hoạt động quá X tháng (Admin only)")
  .addIntegerOption(opt =>
    opt
      .setName("thang")
      .setDescription("Số tháng không hoạt động (ví dụ: 6)")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

async function handleDelete(guild: any, months: number, replyFn: (msg: string) => Promise<any>) {
  try {
    const now = Date.now();
    const cutoff = now - months * 30 * 24 * 60 * 60 * 1000;

    await replyFn(`🔍 Đang kiểm tra các thành viên không hoạt động trong ${months} tháng...`);
    const members = await guild.members.fetch({ time: 60_000 });

    const inactiveMembers: GuildMember[] = [];

    members.forEach((member: GuildMember) => {
    if (member.user.bot) return;
    const joinedAt = member.joinedTimestamp || 0;
    const lastActive = member.presence ? now : joinedAt;
    if (!member.presence && lastActive < cutoff) inactiveMembers.push(member);
    });


    if (inactiveMembers.length === 0) {
      await replyFn(`✅ Không có thành viên nào cần xóa (tất cả đều hoạt động trong ${months} tháng qua).`);
      return;
    }

    // Xóa các thành viên
    let success = 0, fail = 0;
    for (const m of inactiveMembers) {
      try {
        await m.kick(`Không hoạt động quá ${months} tháng`);
        success++;
      } catch {
        fail++;
      }
    }

    await replyFn(
      `🧹 Đã xóa ${success} thành viên không hoạt động (${fail} thất bại).`
    );
  } catch (err) {
    console.error("Lỗi khi xóa TV:", err);
    await replyFn("Đã xảy ra lỗi khi xóa thành viên.");
  }
}

/** Slash command (/deleteTV) */
export async function execute(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  const months = interaction.options.getInteger("thang", true);
  if (!guild) {
    await interaction.reply({ content: "Lệnh này chỉ dùng trong server.", ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });
  const replyFn = (msg: string) =>
    interaction.followUp({ content: msg, ephemeral: true });
  await handleDelete(guild, months, replyFn);
}

/** Prefix command (!deleteTV) */
export async function executeMessage(msg: Message) {
  const args = msg.content.trim().split(/\s+/);
  const guild = msg.guild;
  if (!guild) {
    await msg.reply("Lệnh này chỉ dùng trong server.");
    return;
  }

  const months = parseInt(args[1] ?? "0", 10);
  if (isNaN(months) || months < 1) {
    const reply = await msg.reply("Gõ `!deleteTV [số tháng]`. Ví dụ: `!deleteTV 6`");
    setTimeout(() => reply.delete().catch(() => {}), 10_000);
    setTimeout(() => msg.delete().catch(() => {}), 20_000);
    return;
  }

    const replyFn = async (text: string) => {
    const r = await msg.reply(text); // ✅ msg là Message gốc
    setTimeout(() => r.delete().catch(() => {}), 15_000);
    return r;
    };


  await handleDelete(guild, months, replyFn);
}

export default { data, execute, executeMessage };
