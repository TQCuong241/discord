declare module "yt-dlp-exec" {
  import { ChildProcess } from "child_process";

  interface YtDlpExec {
    (url: string, flags?: Record<string, any>): Promise<any>;
    raw(url: string, flags?: Record<string, any>): ChildProcess;
  }

  const ytdlp: YtDlpExec;
  export default ytdlp;
}
