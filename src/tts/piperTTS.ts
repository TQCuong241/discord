import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export async function piperTTS(text: string, outputFile: string) {
  const modelPath = path.join(__dirname, "models", "vi_VN-25hours_single-low.onnx");
  const jsonPath = modelPath + ".json";
  const piperExe = path.join(__dirname, "piper.exe");

  return new Promise((resolve, reject) => {
    const piper = spawn(piperExe, [
      "-m", modelPath,
      "-c", jsonPath,
      "-f", outputFile
    ]);

    piper.stdin.write(text);
    piper.stdin.end();

    piper.on("close", (code) => {
      if (code === 0) resolve(true);
      else reject("Piper exit code: " + code);
    });
  });
}
