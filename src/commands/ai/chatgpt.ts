import { SlashCommandBuilder, ChatInputCommandInteraction, Message } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

export const data = new SlashCommandBuilder()
  .setName("chatgpt")
  .setDescription("Trò chuyện với ChatGPT")
  .addStringOption(opt =>
    opt
      .setName("message")
      .setDescription("Nhập nội dung bạn muốn hỏi ChatGPT")
      .setRequired(true)
  );

// ===== Slash Command =====
export async function execute(interaction: ChatInputCommandInteraction) {
  const message = interaction.options.getString("message", true);

  try {
    await interaction.deferReply(); // giữ kết nối
    await runChatGPT(message, (msg) => interaction.editReply(msg), true);
  } catch (err) {
    console.error("Lỗi khi xử lý slash /chatgpt:", err);
    if (interaction.replied || interaction.deferred)
      await interaction.followUp({
        content: "Đã xảy ra lỗi khi xử lý lệnh ChatGPT.",
        ephemeral: true,
      });
    else
      await interaction.reply({
        content: "Đã xảy ra lỗi khi xử lý lệnh ChatGPT.",
        ephemeral: true,
      });
  }
}

// ===== Prefix Command (!chatgpt) =====
export async function executeMessage(message: Message, args: string[]) {
  if (args.length === 0) {
    const reply = await message.reply(
      "Vui lòng nhập nội dung. Ví dụ: `!chatgpt ai là bạn của tôi?`"
    );
    setTimeout(() => reply.delete().catch(() => {}), 10_000);
    return;
  }

  const question = args.join(" ");
  await runChatGPT(question, (msg) => message.reply(msg), false);
}

// ===== Hàm xử lý chính =====
async function runChatGPT(
  input: string,
  sendReply: (msg: string) => Promise<any>,
  slashMode: boolean
) {
  try {
    await sendReply("Đang gửi yêu cầu đến ChatGPT...");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: input }],
      }),
    });

    const data = (await response.json()) as any;

    if (!response.ok) {
      console.error("Lỗi API:", data);
      await sendReply(`Lỗi khi gọi ChatGPT: ${data.error?.message || "Không rõ nguyên nhân."}`);
      return;
    }

    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      await sendReply("Không nhận được phản hồi từ ChatGPT.");
      return;
    }

    // Discord giới hạn 2000 ký tự
    await sendReply(reply.slice(0, 1900));
  } catch (error) {
    console.error("Lỗi khi kết nối với ChatGPT:", error);
    await sendReply("Đã xảy ra lỗi khi kết nối với ChatGPT.");
  }
}

export default { data, execute, executeMessage };
