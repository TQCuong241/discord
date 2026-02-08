import puppeteer, { Browser } from "puppeteer";

export interface TFTStats {
  name: string;
  rank: string;
  rankIcon: string;
  tier: string;
  lp: string;
  winrate: string;
  wins: string;
  losses: string;
  recentMatches: {
    placement: number;
    result: string;
    duration: string;
    date: string;
    traits: string[];
    units: string[];
  }[];
}

export async function getTFTStats(name: string, tag: string): Promise<TFTStats> {
  const encoded = encodeURIComponent(`${name}#${tag}`);
  const profileURL = `https://api.tracker.gg/api/v2/tft/standard/profile/riot/${encoded}`;
  const matchesURL = `https://api.tracker.gg/api/v2/tft/standard/matches/riot/${encoded}`;

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

    // === 1️⃣ Lấy profile chính ===
    await page.goto(profileURL, { waitUntil: "networkidle2", timeout: 20000 });
    const preTextProfile = await page.$eval("pre", (el: any) => el.textContent?.trim() || "");
    const profile = JSON.parse(preTextProfile);

    const user = profile.data?.userInfo || {};
    const stats = profile.data?.segments?.[0]?.stats || {};
    const platform = profile.data?.platformInfo || {};
    const meta = profile.data?.segments?.[0]?.metadata || {};

    const playerName =
      user.platformUserHandle ||
      user.platformUserIdentifier ||
      platform.platformUserHandle ||
      `${name}#${tag}`;

    const rank = stats.tier?.metadata?.tierName || "Unranked";
    const rankIcon = stats.tier?.metadata?.iconUrl || "";
    const tier = stats.tier?.displayValue || "Unranked";
    const lp = stats.rating?.displayValue || "-";
    const winrate = stats.matchesWinPct?.displayValue || "-";
    const wins = stats.matchesWon?.displayValue || "-";
    const losses = stats.matchesLost?.displayValue || "-";

    // === 2️⃣ Lấy lịch sử 10 trận gần nhất ===
    await page.goto(matchesURL, { waitUntil: "networkidle2", timeout: 20000 });
    const preTextMatches = await page.$eval("pre", (el: any) => el.textContent?.trim() || "");
    const matchData = JSON.parse(preTextMatches);
    const matches = matchData.data?.matches || [];

    const recentMatches = matches.slice(0, 10).map((m: any) => {
      const meta = m.metadata || {};
      const s = m.segments?.[0]?.stats || {};

      const placement = meta.placement ?? s.placement?.value ?? 8;
      const result = placement <= 4 ? "victory" : "defeat";
      const duration = meta.duration?.displayValue || "-";
      const date = meta.dateStarted || "-";

      // Lấy traits và units từ metadata
      const traits: string[] = [];
      const units: string[] = [];

      return {
        placement,
        result,
        duration,
        date,
        traits,
        units,
      };
    });

    return {
      name: playerName,
      rank,
      rankIcon,
      tier,
      lp,
      winrate,
      wins,
      losses,
      recentMatches,
    };
  } catch (err: any) {
    console.error("Lỗi khi lấy Tracker.gg TFT:", err);
    throw new Error(err.message || "Không thể lấy dữ liệu Tracker.gg TFT");
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

