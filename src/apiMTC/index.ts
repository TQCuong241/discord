import puppeteer, { Browser } from "puppeteer";

export interface MTCResult {
  content: string;
  nextPage: string | null;
}

// 🟦 LẤY 1 TRANG
export async function getApiMeTruyenChu(
  slugTruyen: string,
  chuong: string
): Promise<MTCResult> {
  const url = `https://metruyencv.com/truyen/${slugTruyen}/${chuong}`;
  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    await page.waitForSelector("#chapter-content", { timeout: 20000 });

    let rawHtml = await page.$eval("#chapter-content", (el) => el.innerHTML);

    let text = rawHtml
      .replace(/<canvas[\s\S]*?<\/canvas>/g, "")
      .replace(/<div id="middle-content-[^>]+><\/div>/g, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    let nextPage = await page.evaluate(() => {
      const btn =
        document.querySelector("a.btn-next-chapter") ||
        document.querySelector("a#btn-next");

      return btn ? (btn as HTMLAnchorElement).getAttribute("href") : null;
    });

    return {
      content: text,
      nextPage,
    };
  } catch (err: any) {
    console.error("Lỗi MTC:", err);
    return { content: "", nextPage: null };
  } finally {
    if (browser) await browser.close();
  }
}

// 🟦 AUTO NEXT PAGE — LẤY TẤT CẢ TRANG
export async function getFullChapter(slug: string, chapter: string) {
  let full = "";
  let current: string = chapter;

  while (true) {
    const data = await getApiMeTruyenChu(slug, current);

    full += "\n" + data.content;

    if (!data.nextPage) break;

    // 🛡 Check đầy đủ — TS KHÔNG CÒN LỖI
    const parts = data.nextPage.split("/truyen/");
    if (!parts || parts.length < 2) break;

    const pagePart = parts[1];
    if (!pagePart) break;

    const segments = pagePart.split("/");
    if (!segments || segments.length < 2) break;

    const nextChap = segments[1];
    if (!nextChap) break;

    current = nextChap; // OK 100%
  }

  return full.trim();
}
