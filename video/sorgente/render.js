// Trasforma scena.html in video/nexus.mp4 (1920x1080, 30 fps) e video/nexus-poster.jpg.
//   node video/sorgente/render.js            -> video completo
//   node video/sorgente/render.js 3 7.5 12   -> solo alcuni fotogrammi (png) per controllare
// Serve: Playwright con Chromium e ffmpeg.
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");

const FPS = 30, POSTER = 37.4;
const qui = __dirname, uscita = path.join(qui, "..");

(async () => {
  const browser = await chromium.launch({ args: ["--force-color-profile=srgb"] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error("errore nella scena:", e.message));
  await page.goto("file://" + path.join(qui, "scena.html"));
  await page.evaluate(() => window.pronto);
  const foto = async (t) => { await page.evaluate((t) => window.render(t), t); return page.screenshot({ type: "png" }); };

  const tempi = process.argv.slice(2).map(Number);
  if (tempi.length) {
    for (const t of tempi) require("fs").writeFileSync(path.join(process.env.CARTELLA || ".", `fotogramma-${t}.png`), await foto(t));
    return browser.close();
  }

  const durata = await page.evaluate(() => window.DURATA), totale = Math.round(durata * FPS);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-pix_fmt", "yuv420p", "-tune", "film", "-movflags", "+faststart",
    path.join(uscita, "nexus.mp4")], { stdio: ["pipe", "inherit", "inherit"] });
  const inizio = Date.now();
  for (let i = 0; i < totale; i++) {
    const png = await foto(i / FPS);
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 60 === 0) console.log(`fotogramma ${i}/${totale} · ${((Date.now() - inizio) / 1000).toFixed(0)} s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  // copertina: un fotogramma del finale
  await page.evaluate((t) => window.render(t), POSTER);
  await page.screenshot({ type: "jpeg", quality: 82, path: path.join(uscita, "nexus-poster.jpg") });
  await browser.close();
  console.log("fatto:", path.join(uscita, "nexus.mp4"));
})();
