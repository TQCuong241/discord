import puppeteer, { Browser } from "puppeteer";

export interface MTCResult {
  text: string;
  nextPage: string | null;
}

// 🟦 LẤY 1 TRANG (RAW TEXT)
export async function getApiTangThuVien(
  slugTruyen: string,
  chuong: string
): Promise<MTCResult> {
  const url = `https://tangthuvien.net/doc-truyen/${slugTruyen}/${chuong}`;
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

    // ⭐ Selector mới của TTV
    await page.waitForSelector('div[class*="box-chap"]', { timeout: 20000 });

    // Lấy text từ div có class box-chap
    const text = await page.$eval(
      'div[class*="box-chap"]',
      (el) => el.textContent || ""
    );

    // ⭐ Lấy link chương tiếp theo
    const nextPage = await page.evaluate(() => {
      const a =
        document.querySelector("a.chap-nav-next") ||
        document.querySelector(".btn-chap-next");

      return a ? (a as HTMLAnchorElement).href : null;
    });

    return {
      text,
      nextPage,
    };
  } catch (err: any) {
    console.error("Lỗi TangThuVien:", err);
    return { text: "", nextPage: null };
  } finally {
    if (browser) await browser.close();
  }
}

// 🟦 AUTO NEXT CHAPTER — LẤY TẤT CẢ TRANG
export async function getFullChapter(slug: string, chapter: string) {
  let fullText = "";
  let current: string = chapter;

  while (true) {
    const data = await getApiTangThuVien(slug, current);
    fullText += "\n" + data.text;

    if (!data.nextPage) break;

    const parts = data.nextPage.split("/");
    const nextSlug = parts[parts.length - 1]; // lấy "chuong-123"

    if (!nextSlug) break;

    current = nextSlug;
  }

  return fullText.trim();
}
