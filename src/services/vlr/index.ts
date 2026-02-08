const puppeteer = require("puppeteer");
import * as path from "path";
import * as fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// Ẩn log .env rác
const oldConsole = console.log;
console.log = (...args) => {
  if (typeof args[0] === "string" && args[0].startsWith("[dotenv@")) return;
  oldConsole(...args);
};
process.on("warning", () => {});

interface MessageData {
  code: string;
  rank: string;
}

class DiscordSender {
  private browser: any = null;
  private page: any = null;
  private channelUrl: string =
    "https://discord.com/channels/653508294962315285/898862043753484289";
  private isReady: boolean = false;
  private userDataDir: string = path.join(__dirname, "..", "..", "..", "discord_session");
  private lastSentAt: number = 0;
  private sending: boolean = false;
  private minIntervalMs: number = 30_000; // 30 giây
  private lastReloadAt: number = 0;
  private reloadTimer: NodeJS.Timeout | null = null;
  private scrollTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (!fs.existsSync(this.userDataDir)) {
      fs.mkdirSync(this.userDataDir, { recursive: true });
    }
  }

  public async initialize(): Promise<void> {
    const showBrowser = process.env.VLR_SHOW_BROWSER === "true";
    console.log(`Khởi động Puppeteer Discord (${showBrowser ? "hiển thị" : "ẩn"})...`);

    this.browser = await puppeteer.launch({
      headless: showBrowser ? false : "new",
      userDataDir: this.userDataDir,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        ...(showBrowser ? ["--start-maximized"] : []),
      ],
    });

    const pages = await this.browser.pages();
    this.page = pages.length ? pages[0] : await this.browser.newPage();

    await this.page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    );

    console.log("Đang mở Discord...");
    await this.page.goto(this.channelUrl, { waitUntil: "networkidle2" });

    const isLoggedIn = await this.checkLoginStatus();

    if (isLoggedIn) {
      console.log("Đã đăng nhập tự động từ session.");
    } else if (showBrowser) {
      console.log("Hãy đăng nhập Discord trong cửa sổ này. Session sẽ được lưu lại.");
      await this.waitForLogin();
    } else {
      console.log("Chưa đăng nhập Discord. Hãy đặt VLR_SHOW_BROWSER=true để đăng nhập thủ công một lần.");
      return;
    }

    this.isReady = true;
    this.lastReloadAt = Date.now();

    // Tắt auto reload và auto scroll
    // this.startAutoReload();
    // this.startAutoScroll();
  }

  private async checkLoginStatus(): Promise<boolean> {
    try {
      const loggedInSelectors = [
        '[data-list-item-id="user-settings-cog"]',
        'div[aria-label="User menu"]',
        '[class*="avatarWrapper"]',
        'button[aria-label="User Settings"]',
      ];

      for (const selector of loggedInSelectors) {
        const element = await this.page.$(selector);
        if (element) return true;
      }

      const currentUrl = this.page.url();
      return !currentUrl.includes("login") && !currentUrl.includes("auth");
    } catch {
      return false;
    }
  }

  private async waitForLogin(): Promise<void> {
    console.log("Đang chờ bạn đăng nhập Discord...");

    let attempts = 0;
    const maxAttempts = 600;
    while (attempts < maxAttempts) {
      const isLoggedIn = await this.checkLoginStatus();
      if (isLoggedIn) {
        console.log("Đăng nhập thành công.");
        return;
      }
      await this.delay(1000);
      attempts++;
      if (attempts % 30 === 0) {
        console.log(`Đã chờ ${attempts} giây...`);
      }
    }
    console.log("Hết thời gian chờ đăng nhập.");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // === Reload Discord ngẫu nhiên từ 1–3 giờ ===
  private startAutoReload(): void {
    if (this.reloadTimer) clearTimeout(this.reloadTimer);

    const scheduleNextReload = async () => {
      const randomHours = Math.floor(Math.random() * 3) + 1; // 1–3 giờ
      const randomMs = randomHours * 60 * 60 * 1000;
      const nextAt = new Date(Date.now() + randomMs);

      console.log(`Lần reload Discord tiếp theo sau ${randomHours} giờ (${nextAt.toLocaleTimeString()})`);

      this.reloadTimer = setTimeout(async () => {
        if (this.sending) {
          console.log("Đang gửi tin nhắn, hoãn reload thêm 1 phút...");
          this.reloadTimer = setTimeout(scheduleNextReload, 60_000);
          return;
        }

        try {
          console.log("Reload Discord (duy trì kết nối)...");
          await this.page.reload({ waitUntil: "networkidle2" });
          this.lastReloadAt = Date.now();
          console.log("Reload hoàn tất.");
        } catch (error) {
          console.error("Lỗi khi reload Discord:", error);
        }

        scheduleNextReload();
      }, randomMs);
    };

    scheduleNextReload();
  }

  // === Lăn chuột ngẫu nhiên 1–3 lần mỗi 30–60 phút ===
  private startAutoScroll(): void {
    if (this.scrollTimer) clearTimeout(this.scrollTimer);

    const scheduleNextScroll = async () => {
      // Thời gian random giữa 30–60 phút
      const randomMinutes = Math.floor(Math.random() * 31) + 30; // 30–60 phút
      const nextScrollMs = randomMinutes * 60 * 1000;
      const nextAt = new Date(Date.now() + nextScrollMs);
      console.log(`Lần auto scroll tiếp theo sau ${randomMinutes} phút (${nextAt.toLocaleTimeString()})`);

      this.scrollTimer = setTimeout(async () => {
        try {
          if (!this.page || !this.isReady) return;

          // Random số lần lăn 1–3
          const scrollTimes = Math.floor(Math.random() * 3) + 1;

          for (let i = 0; i < scrollTimes; i++) {
            await this.page.evaluate(() => {
              (globalThis as any).scrollBy(0, (globalThis as any).innerHeight);
            });

            console.log(`Đã lăn chuột lần ${i + 1}/${scrollTimes}`);
            await this.delay(1000 + Math.random() * 2000); // delay nhỏ giữa các lần
          }

          console.log("Hoàn tất chu kỳ auto scroll.");
        } catch (err) {
          console.error("Lỗi khi auto scroll:", err);
        }

        // Đặt lịch lần tiếp theo
        scheduleNextScroll();
      }, nextScrollMs);
    };

    scheduleNextScroll();
  }

  public async sendMessage(messageData: MessageData): Promise<boolean> {
    if (!this.page || !this.isReady) {
      console.log("Tool chưa sẵn sàng.");
      return false;
    }

    if (this.sending) {
      console.log("Đang có tác vụ gửi khác. Vui lòng chờ.");
      return false;
    }

    const now = Date.now();
    const since = now - this.lastSentAt;
    if (this.lastSentAt !== 0 && since < this.minIntervalMs) {
      const waitMs = this.minIntervalMs - since;
      console.log(`Vui lòng chờ ${Math.ceil(waitMs / 1000)} giây trước khi gửi tiếp.`);
      return false;
    }

    this.sending = true;
    try {
      const chatInput = await this.page.$('div[data-slate-editor="true"]');
      if (!chatInput) {
        console.log("Không tìm thấy ô chat Discord.");
        this.sending = false;
        return false;
      }

      const message = `${messageData.code} + ${messageData.rank}`;
      await chatInput.click();
      await this.page.keyboard.down("Control");
      await this.page.keyboard.press("A");
      await this.page.keyboard.up("Control");
      await this.page.keyboard.press("Backspace");
      await this.page.keyboard.type(message, { delay: 100 });
      await this.page.keyboard.press("Enter");

      this.lastSentAt = Date.now();
      await this.delay(1500);

      console.log(`Đã gửi tin nhắn: ${message}`);
      this.sending = false;
      return true;
    } catch (error) {
      this.sending = false;
      console.error("Lỗi gửi tin nhắn:", error);
      return false;
    }
  }

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log("Đã đóng trình duyệt và lưu session.");
    }
    if (this.reloadTimer) clearTimeout(this.reloadTimer);
    if (this.scrollTimer) clearTimeout(this.scrollTimer);
  }

  public getReadyStatus(): boolean {
    return this.isReady;
  }

  public clearSession(): void {
    if (fs.existsSync(this.userDataDir)) {
      fs.rmSync(this.userDataDir, { recursive: true, force: true });
      console.log("Đã xóa session Discord.");
    }
  }
}

// === Export ===
export const discordSender = new DiscordSender();

export async function initializeVLR(): Promise<void> {
  await discordSender.initialize();
}

export async function sendVLRMessage(code: string, rank: string): Promise<boolean> {
  return await discordSender.sendMessage({ code, rank });
}

export function isVLRReady(): boolean {
  return discordSender.getReadyStatus();
}

export function clearVLRSession(): void {
  discordSender.clearSession();
}

