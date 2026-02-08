import puppeteer, { Browser } from "puppeteer";

export interface LoLStats {
  name: string;
  rank: string;
  rankIcon: string;
  tier: string;
  lp: string;
  winrate: string;
  wins: string;
  losses: string;
  kda: string;
  kills: string;
  deaths: string;
  assists: string;
  recentMatches: {
    champion: string;
    championIcon: string;
    result: string;
    kills: number;
    deaths: number;
    assists: number;
    kda: string;
    duration: string;
    date: string;
  }[];
}

export async function getLoLStats(name: string, tag: string): Promise<LoLStats> {
  const encoded = encodeURIComponent(`${name}#${tag}`);
  const profileURL = `https://api.tracker.gg/api/v2/league-of-legends/standard/profile/riot/${encoded}`;
  const matchesURL = `https://api.tracker.gg/api/v2/league-of-legends/standard/matches/riot/${encoded}`;

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
    const kda = stats.kDARatio?.displayValue || "-";
    const kills = stats.kills?.displayValue || "-";
    const deaths = stats.deaths?.displayValue || "-";
    const assists = stats.assists?.displayValue || "-";

    // === 2️⃣ Lấy lịch sử 10 trận gần nhất ===
    await page.goto(matchesURL, { waitUntil: "networkidle2", timeout: 20000 });
    const preTextMatches = await page.$eval("pre", (el: any) => el.textContent?.trim() || "");
    const matchData = JSON.parse(preTextMatches);
    const matches = matchData.data?.matches || [];

    const recentMatches = matches.slice(0, 10).map((m: any) => {
      const meta = m.metadata || {};
      const s = m.segments?.[0]?.stats || {};
      const segMeta = m.segments?.[0]?.metadata || {};

      const champion = segMeta.championName || meta.championName || "Unknown";
      const championIcon =
        segMeta.championImageUrl ||
        segMeta.championIconUrl ||
        meta.championImageUrl ||
        meta.championIconUrl ||
        "";
      const result = meta.result || "-";
      const kills = s.kills?.value ?? 0;
      const deaths = s.deaths?.value ?? 0;
      const assists = s.assists?.value ?? 0;
      const kda = deaths > 0 ? ((kills + assists) / deaths).toFixed(2) : (kills + assists).toString();
      const duration = meta.duration?.displayValue || "-";
      const date = meta.dateStarted || "-";

      return {
        champion,
        championIcon,
        result,
        kills,
        deaths,
        assists,
        kda,
        duration,
        date,
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
      kda,
      kills,
      deaths,
      assists,
      recentMatches,
    };
  } catch (err: any) {
    console.error("Lỗi khi lấy Tracker.gg LoL:", err);
    throw new Error(err.message || "Không thể lấy dữ liệu Tracker.gg LoL");
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

