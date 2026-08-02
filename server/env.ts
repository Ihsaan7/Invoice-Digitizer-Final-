import fs from "fs";

if (fs.existsSync(".env")) {
  try {
    process.loadEnvFile();
  } catch {
    // ignore if process.loadEnvFile isn't supported
  }
}
