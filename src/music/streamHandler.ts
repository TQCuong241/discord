import { Readable } from "stream";
// @ts-ignore
import youtubedl from "youtube-dl-exec";
import { createAudioResource } from "@discordjs/voice";
import { ICON, colorLog } from "../utils";

export async function createStreamResource(url: string) {
  return new Promise<any>((resolve, reject) => {
    try {
      const proc = (youtubedl as any).exec(
        url,
        {
          output: "-",
          quiet: true,
          format: "bestaudio/best",
        },
        { stdio: ["ignore", "pipe", "pipe"] }
      );

      let hasResolved = false;
      const errorChunks: Buffer[] = [];

      proc.stderr?.on("data", (data: Buffer) => {
        errorChunks.push(data);
      });

      let spawnTimeout: NodeJS.Timeout | undefined;
      
      proc.on("close", (code: number, signal: string) => {
        if (code !== 0 && !hasResolved) {
          hasResolved = true;
          if (spawnTimeout) clearTimeout(spawnTimeout);
          const errorMsg = Buffer.concat(errorChunks).toString();
          const cleanError = errorMsg.trim();
          if (cleanError && !cleanError.includes("WARNING") && !cleanError.includes("ERROR")) {
            console.error(colorLog(`[Music] yt-dlp exited with code ${code}:`, "red"), cleanError);
          } else if (cleanError) {
            console.error(colorLog(`[Music] yt-dlp exited with code ${code}`, "red"));
          }
          reject(new Error(`Không thể tải video (code ${code})`));
        }
      });

      proc.stdout?.on("error", (err: Error) => {
        if (!hasResolved) {
          hasResolved = true;
          if (spawnTimeout) clearTimeout(spawnTimeout);
          console.error(colorLog(`[Music] Lỗi stdout stream:`, "red"), err);
          reject(new Error(`Lỗi stream: ${err.message}`));
        }
      });
      
      proc.on("spawn", () => {
        if (!proc.stdout) {
          if (!hasResolved) {
            hasResolved = true;
            reject(new Error(`${ICON.error} Không lấy được stream từ yt-dlp!`));
          }
          return;
        }

        try {
          const stream = Readable.from(proc.stdout);
          const resource = createAudioResource(stream);
          
          stream.on("error", (err: Error) => {
            if (!hasResolved) {
              hasResolved = true;
              clearTimeout(spawnTimeout);
              console.error(colorLog(`[Music] Lỗi khi đọc stream:`, "red"), err);
              reject(new Error(`Lỗi đọc stream: ${err.message}`));
            }
          });

          spawnTimeout = setTimeout(() => {
            if (!hasResolved) {
              hasResolved = true;
              resolve(resource);
            }
          }, 1000);
        } catch (err: any) {
          if (!hasResolved) {
            hasResolved = true;
            clearTimeout(spawnTimeout);
            console.error(colorLog(`[Music] Lỗi khi tạo audio resource:`, "red"), err);
            reject(new Error(`Lỗi tạo resource: ${err.message}`));
          }
        }
      });
    } catch (err: any) {
      console.error(colorLog(`[Music] Lỗi khi tạo stream resource từ ${url}:`, "red"), err);
      reject(new Error(`Không thể tải video: ${err.message || "Lỗi không xác định"}`));
    }
  });
}
