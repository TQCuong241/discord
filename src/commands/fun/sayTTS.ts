import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  TextChannel,
} from "discord.js";

// ===== Định nghĩa dữ liệu lệnh Slash =====
export const data = new SlashCommandBuilder()
  .setName("saytts")
  .setDescription("Để bot nói bằng giọng nói (Text-to-Speech)")
  .addStringOption(opt =>
    opt
      .setName("message")
      .setDescription("Nội dung mà bot sẽ đọc to bằng TTS")
      .setRequired(true)
  );

// ===== Hàm xử lý dùng chung (cho cả ! và /) =====
async function sendTTS(ctx: Message | ChatInputCommandInteraction, text: string) {
  try {
    let channel: TextChannel | null = null;

    if (ctx instanceof Message) channel = ctx.channel as TextChannel;
    else if (ctx instanceof ChatInputCommandInteraction) channel = ctx.channel as TextChannel;

    if (!channel) {
      if (ctx instanceof Message)
        await ctx.reply("Không tìm thấy kênh để gửi TTS.");
      else
        await ctx.reply({ content: "Không tìm thấy kênh để gửi TTS.", ephemeral: true });
      return;
    }

    // Gửi tin nhắn TTS
    await channel.send({ content: text, tts: true });

    // Phản hồi người gọi
    if (ctx instanceof Message) {
      const reply = await ctx.reply("Bot đã nói bằng TTS.");
      setTimeout(() => reply.delete().catch(() => {}), 60_000);
      setTimeout(() => ctx.delete().catch(() => {}), 60_000);
    } else {
      await ctx.reply({ content: "Bot đã nói bằng TTS.", ephemeral: true });
    }
  } catch (err) {
    console.error("Lỗi khi gửi TTS:", err);

    if (ctx instanceof Message) {
      const reply = await ctx.reply("Không thể gửi tin nhắn TTS.");
      setTimeout(() => reply.delete().catch(() => {}), 60_000);
    } else {
      if (ctx.replied || ctx.deferred)
        await ctx.followUp({ content: "Không thể gửi tin nhắn TTS.", ephemeral: true });
      else
        await ctx.reply({ content: "Không thể gửi tin nhắn TTS.", ephemeral: true });
    }
  }
}

// ===== Slash Command =====
export async function execute(interaction: ChatInputCommandInteraction) {
  const message = interaction.options.getString("message", true);
  await sendTTS(interaction, message);
}

// ===== Prefix Command (!saytts) =====
export async function executeMessage(msg: Message, args: string[]) {
  if (args.length === 0) {
    const reply = await msg.reply("Gõ `!saytts <nội dung>` để bot nói.");
    setTimeout(() => reply.delete().catch(() => {}), 10_000);
    return;
  }

  const text = args.join(" ");
  await sendTTS(msg, text);
}

export default { data, execute, executeMessage };
