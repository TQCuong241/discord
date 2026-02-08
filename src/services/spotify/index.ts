import puppeteer, { Browser } from "puppeteer";

export interface SpotifyTrack {
  name: string;
  artists: string[];
  album?: string;
  duration?: number;
}

/**
 * Lấy metadata từ Spotify link (track, album, playlist)
 * Sử dụng Puppeteer để lấy metadata chính xác hơn
 */
export async function getSpotifyMetadata(url: string): Promise<SpotifyTrack | null> {
  let browser: Browser | null = null;
  try {
    // Parse Spotify URL
    const trackMatch = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
    const albumMatch = url.match(/spotify\.com\/album\/([a-zA-Z0-9]+)/);
    const playlistMatch = url.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/);

    if (!trackMatch && !albumMatch && !playlistMatch) {
      return null;
    }

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });

    // Đợi content load (thay waitForTimeout bằng setTimeout)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Lấy metadata từ page
    const metadata = await page.evaluate((): { name: string; artists: string[] } | null => {
      // Tìm title
      const titleElement = document.querySelector('meta[property="og:title"]') || 
                          document.querySelector('title');
      const title = titleElement?.getAttribute('content') || titleElement?.textContent || '';

      // Tìm artist từ description hoặc meta tags
      const descElement = document.querySelector('meta[property="og:description"]');
      const description = descElement?.getAttribute('content') || '';

      // Parse title: thường format "Artist - Song Name" hoặc "Song Name - Artist"
      const cleanTitle = title.replace(/\s*-\s*Spotify$/, '').trim();
      const parts = cleanTitle.split(/\s*-\s*/);

      if (parts.length >= 2 && parts[0]) {
        // Format: "Artist - Song Name"
        return {
          name: parts.slice(1).join(' - '),
          artists: [parts[0]],
        };
      }

      // Thử parse từ description
      const artistMatch = description.match(/([^•]+)/);
      if (artistMatch && artistMatch[1] && parts.length === 1 && parts[0]) {
        const artistName = artistMatch[1].trim();
        if (artistName) {
          return {
            name: parts[0],
            artists: [artistName],
          };
        }
      }

      return {
        name: cleanTitle,
        artists: [],
      };
    });

    // Đảm bảo type đúng
    if (metadata && metadata.name) {
      return {
        name: metadata.name,
        artists: metadata.artists.filter(a => typeof a === 'string' && a.length > 0),
      };
    }

    return null;
  } catch (error) {
    console.error("Lỗi khi lấy Spotify metadata:", error);
    // Fallback: Parse từ URL nếu có thể
    return parseFromUrl(url);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

/**
 * Parse cơ bản từ URL (fallback)
 */
function parseFromUrl(url: string): SpotifyTrack | null {
  try {
    // Lấy tên từ URL nếu có thể
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1]?.split('?')[0];
    
    if (lastPart) {
      return {
        name: lastPart,
        artists: [],
      };
    }
  } catch {}
  
  return null;
}

/**
 * Tạo query string để tìm trên YouTube từ Spotify track
 */
export function createYouTubeQuery(track: SpotifyTrack): string {
  if (track.artists.length > 0 && track.name) {
    return `${track.artists.join(' ')} ${track.name}`.trim();
  }
  return track.name || '';
}

