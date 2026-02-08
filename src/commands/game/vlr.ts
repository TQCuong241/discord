import { Message, ChatInputCommandInteraction } from "discord.js";
import { sendVLRMessage, isVLRReady } from "../../services/vlr";

export async function vlr(
  ctx: Message | ChatInputCommandInteraction,
  args: string[]
): Promise<void> {
  try {
    // ===== Reply an toàn, tránh lỗi InteractionAlreadyReplied =====
    const safeReply = async (msg: string) => {
      if ("author" in ctx) {
        // Nếu là Message (prefix command)
        await ctx.reply(msg);
      } else {
        // Nếu là Interaction (/command)
        const i = ctx as ChatInputCommandInteraction;
        if (i.replied || i.deferred) await i.followUp(msg);
        else await i.reply(msg);
      }
    };

    // ===== Kiểm tra cú pháp =====
    if (args.length < 3) {
      await safeReply(
        "Sai cú pháp! Dùng: `!vlr <mã_code> <rank> <số_lượng>`\n" +
          "Ví dụ: `!vlr ABC123 Đồng, Bạc 3` hoặc `!vlr ABC123 + 3 Đồng, Bạc`"
      );
      return;
    }

    // ===== Phân tích tham số =====
    const joined = args.join(" ").trim();
    let code = "",
      rank = "",
      countNum = 0;

    const plusMatch = joined.match(/^([A-Za-z0-9]{6})\s*\+\s*(\d+)\s*(.+)$/);
    if (plusMatch) {
      code = plusMatch[1]!;
      countNum = parseInt(plusMatch[2]!, 10);
      rank = plusMatch[3]!.trim();
    } else {
      code = args[0] ?? "";
      rank = args.slice(1, -1).join(" ");
      countNum = parseInt(args[args.length - 1] ?? "0", 10);
    }

    // ===== Kiểm tra dữ liệu =====
    if (code.length !== 6) {
      await safeReply("Mã code phải gồm đúng 6 ký tự (ví dụ: ABC123)");
      return;
    }

    if (isNaN(countNum) || countNum <= 0) {
      await safeReply("Số lượng phải là số nguyên dương.");
      return;
    }

    if (!rank || rank.length < 2) {
      await safeReply("Rank không hợp lệ. Ví dụ: Đồng, Bạc, Vàng...");
      return;
    }

    if (!isVLRReady()) {
      await safeReply("Tool VLR chưa sẵn sàng, vui lòng thử lại sau.");
      return;
    }

    // ===== Gửi tin nhắn tới tool =====
    const messageText = `${code} + ${countNum} ${rank}`;
    const success = await sendVLRMessage(code, `${countNum} ${rank}`);

    if (success) {
      await safeReply(`Đã gửi thành công: **${messageText}**`);
    } else {
      await safeReply(
        "Không thể gửi tin nhắn. Hãy kiểm tra lại việc đăng nhập Discord trong trình duyệt."
      );
    }
  } catch (error) {
    console.error("💀 Lỗi lệnh vlr:", error);
    try {
      if ("author" in ctx) {
        await ctx.reply("Đã xảy ra lỗi khi thực hiện lệnh này.");
      } else {
        const i = ctx as ChatInputCommandInteraction;
        if (i.replied || i.deferred)
          await i.followUp("Đã xảy ra lỗi khi thực hiện lệnh này.");
        else await i.reply("Đã xảy ra lỗi khi thực hiện lệnh này.");
      }
    } catch {
      console.warn("Bỏ qua lỗi follow-up kép (đã reply trước đó)");
    }
  }
}
