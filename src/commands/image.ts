import { SlashCommandBuilder, ChatInputCommandInteraction, Message, EmbedBuilder } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

export const data = new SlashCommandBuilder()
  .setName("image")
  .setDescription("Tạo ảnh bằng AI từ mô tả")
  .addStringOption(opt =>
    opt
      .setName("prompt")
      .setDescription("Mô tả nội dung bức ảnh bạn muốn tạo")
      .setRequired(true)
  );

// ===== Slash Command =====
export async function execute(interaction: ChatInputCommandInteraction) {
  const prompt = interaction.options.getString("prompt", true);
  await interaction.deferReply();
  await runImage(prompt, (msg) => interaction.editReply(msg), true);
}

// ===== Prefix Command (!image) =====
export async function executeMessage(message: Message, args: string[]) {
  if (args.length === 0) {
    await message.reply("Vui lòng nhập mô tả bức ảnh. Ví dụ: `!image mèo đeo kính phi hành gia`");
    return;
  }
  const prompt = args.join(" ");
  await runImage(prompt, (msg) => message.reply(msg), false);
}

// ===== Hàm gọi OpenAI trước, fallback Pollinations nếu lỗi =====
async function runImage(
  prompt: string,
  sendReply: (msg: string | object) => Promise<any>,
  slashMode: boolean
) {
  try {
    await sendReply("🖼️ Đang tạo ảnh, vui lòng chờ...");

    // --- Gọi OpenAI ---
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
      }),
    });

    const data = (await response.json()) as any;

    // --- Nếu lỗi billing, quota, hoặc 401 thì fallback Pollinations ---
    if (!response.ok) {
      const errorMsg = data.error?.message || "Không rõ nguyên nhân";
      console.warn("⚠️ Lỗi OpenAI:", errorMsg);

      if (
        errorMsg.includes("Billing hard limit") ||
        errorMsg.includes("insufficient_quota") ||
        errorMsg.includes("Unauthorized")
      ) {
        return await usePollinations(prompt, sendReply);
      }

      await sendReply(`⚠️ Lỗi khi tạo ảnh: ${errorMsg}`);
      return;
    }

    const imageUrl = data.data?.[0]?.url;
    if (!imageUrl) {
      await sendReply("Không thể tạo ảnh từ OpenAI. Thử bảng free...");
      return await usePollinations(prompt, sendReply);
    }

    const embed = new EmbedBuilder()
      .setTitle("🎨 Ảnh AI (OpenAI)")
      .setDescription(`Prompt: \`${prompt}\``)
      .setImage(imageUrl)
      .setColor(0x00aeff);

    await sendReply({ embeds: [embed] });
  } catch (error) {
    console.error("💥 Lỗi khi tạo ảnh (OpenAI):", error);
    await sendReply("⚠️ Lỗi khi kết nối OpenAI, đang thử bảng free...");
    await usePollinations(prompt, sendReply);
  }
}

// ===== API fallback miễn phí Pollinations.ai =====
async function usePollinations(
  prompt: string,
  sendReply: (msg: string | object) => Promise<any>
) {
  try {
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;

    const embed = new EmbedBuilder()
      .setTitle("🎨 Ảnh AI (Pollinations - Free)")
      .setDescription(`Prompt: \`${prompt}\``)
      .setImage(imageUrl)
      .setColor(0x00ff99);

    await sendReply({ embeds: [embed] });
  } catch (err) {
    console.error("💥 Lỗi Pollinations:", err);
    await sendReply("Không thể tạo ảnh bằng bảng free (Pollinations).");
  }
}

export default { data, execute, executeMessage };
