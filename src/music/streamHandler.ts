import { Readable } from "stream";
// @ts-ignore
import youtubedl from "youtube-dl-exec";
import { createAudioResource } from "@discordjs/voice";
import { ICON, colorLog } from "../utils";

export async function createStreamResource(url: string) {
  return new Promise<any>((resolve, reject) => {
    let proc: any;
    let hasResolved = false;
    let spawnTimeout: NodeJS.Timeout | undefined;
    const errorChunks: Buffer[] = [];

    const cleanup = () => {
      if (spawnTimeout) {
        clearTimeout(spawnTimeout);
        spawnTimeout = undefined;
      }
    };

    const safeReject = (err: Error | string) => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        const errorMsg = typeof err === "string" ? err : err.message;
        reject(new Error(errorMsg));
      }
    };

    try {
      proc = (youtubedl as any).exec(
        url,
        {
          output: "-",
          quiet: true,
          format: "bestaudio/best",
        },
        { stdio: ["ignore", "pipe", "pipe"] }
      );

      proc.on("error", (err: Error) => {
        console.error(colorLog(`[Music] Lỗi yt-dlp process:`, "red"), err);
        safeReject(`Không thể khởi động yt-dlp: ${err.message}`);
      });

      proc.stderr?.on("data", (data: Buffer) => {
        errorChunks.push(data);
      });
      
      proc.on("close", (code: number, signal: string) => {
        if (code !== 0 && !hasResolved) {
          hasResolved = true;
          cleanup();
          try {
            const errorMsg = errorChunks.length > 0 ? Buffer.concat(errorChunks).toString() : "";
            const cleanError = errorMsg.trim();
            if (cleanError && !cleanError.includes("WARNING") && !cleanError.includes("ERROR")) {
              console.error(colorLog(`[Music] yt-dlp exited with code ${code}:`, "red"), cleanError);
            } else {
              console.error(colorLog(`[Music] yt-dlp exited with code ${code}`, "red"));
            }
            reject(new Error(`Không thể tải video (code ${code})`));
          } catch (rejectErr) {
            reject(new Error(`Không thể tải video (code ${code})`));
          }
        }
      });
      
      proc.on("exit", (code: number, signal: string) => {
        if (code !== 0 && !hasResolved) {
          hasResolved = true;
          cleanup();
          try {
            const errorMsg = errorChunks.length > 0 ? Buffer.concat(errorChunks).toString() : "";
            const cleanError = errorMsg.trim();
            if (cleanError && !cleanError.includes("WARNING") && !cleanError.includes("ERROR")) {
              console.error(colorLog(`[Music] yt-dlp exited with code ${code}:`, "red"), cleanError);
            } else {
              console.error(colorLog(`[Music] yt-dlp exited with code ${code}`, "red"));
            }
            reject(new Error(`Không thể tải video (code ${code})`));
          } catch (rejectErr) {
            reject(new Error(`Không thể tải video (code ${code})`));
          }
        }
      });

      proc.stdout?.on("error", (err: Error) => {
        console.error(colorLog(`[Music] Lỗi stdout stream:`, "red"), err);
        safeReject(`Lỗi stream: ${err.message}`);
      });
      
      proc.on("spawn", () => {
        if (!proc.stdout) {
          safeReject(`${ICON.error} Không lấy được stream từ yt-dlp!`);
          return;
        }

        try {
          const stream = Readable.from(proc.stdout);
          const resource = createAudioResource(stream);
          
          stream.on("error", (err: Error) => {
            console.error(colorLog(`[Music] Lỗi khi đọc stream:`, "red"), err);
            safeReject(`Lỗi đọc stream: ${err.message}`);
          });

          spawnTimeout = setTimeout(() => {
            if (!hasResolved) {
              hasResolved = true;
              cleanup();
              resolve(resource);
            }
          }, 1000);
        } catch (err: any) {
          console.error(colorLog(`[Music] Lỗi khi tạo audio resource:`, "red"), err);
          safeReject(`Lỗi tạo resource: ${err.message}`);
        }
      });

    } catch (err: any) {
      console.error(colorLog(`[Music] Lỗi khi tạo stream resource từ ${url}:`, "red"), err);
      safeReject(`Không thể tải video: ${err.message || "Lỗi không xác định"}`);
    }
  });
}
