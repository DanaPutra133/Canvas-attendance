const axios = require("axios");
const Jimp = require("jimp");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

const getCompatibleUrl = (url) => {
  if (!url) return url;
  return url.split("?")[0].replace(".webp", ".png") + "?size=256";
};

const absenCardRamadhanController = async (req, res) => {
  try {
    const {
      avatarUrl,
      username,
      streakCount,
      lastAbsenDate,
      status = "online",
    } = req.body;

    // 1. Validasi Input
    const missingBody = { avatarUrl, username, streakCount };
    const missingFields = Object.keys(missingBody).filter(
      (key) => !missingBody[key],
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Gagal: Parameter ${missingFields.join(", ")} diperlukan.`,
      });
    }

    const width = 934;
    const height = 282;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 2. Load Aset Ramadhan
     const crescentStarImg = await loadImage(
          path.join(__dirname, "../../../assets/ramadhan/vecteezy_rectangle-golden-frame-border_48404304.png"),
        );
        const fanousLanternImg = await loadImage(
          path.join(__dirname, "../../../assets/ramadhan/123.png"),
        );
        const islamicPatternImg = await loadImage(
          path.join(
            __dirname,
            "../../../assets/ramadhan/vecteezy_elegant-islamic-geometric-pattern-design-with-golden-frame_60578891.png",
          ),
        );

    // 3. Background Dasar (Teal Ramadhan)
    ctx.fillStyle = "#01261a";
    ctx.fillRect(0, 0, width, height);


    // 5. Overlay Pattern Islami
    ctx.globalAlpha = 0.08;
    const patternRatio = islamicPatternImg.width / islamicPatternImg.height;
    const canvasRatio = width / height;
    let pw, ph, px, py;
    if (patternRatio > canvasRatio) {
      ph = islamicPatternImg.height;
      pw = ph * canvasRatio;
      px = (islamicPatternImg.width - pw) / 2;
      py = 0;
    } else {
      pw = islamicPatternImg.width;
      ph = pw / canvasRatio;
      px = 0;
      py = (islamicPatternImg.height - ph) / 2;
    }
    ctx.drawImage(islamicPatternImg, px, py, pw, ph, 0, 0, width, height);
    ctx.globalAlpha = 1.0;

    // 6. Frame Emas Mewah
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // 7. Render Avatar & Status
    if (avatarUrl) {
      const avatarResp = await axios.get(getCompatibleUrl(avatarUrl), {
        responseType: "arraybuffer",
      });
      const avatarImg = await loadImage(Buffer.from(avatarResp.data));

      ctx.save();
      ctx.shadowColor = "rgba(212, 175, 55, 0.5)";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(150, 141, 80, 0, Math.PI * 2, true);
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#D4AF37";
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.clip();
      ctx.drawImage(avatarImg, 70, 61, 160, 160);
      ctx.restore();
    }

    // Status Circle (Online/Idle/DnD)
    const statusColors = { online: "#43B581", idle: "#FAA61A", dnd: "#F04747", offline: "#747F8D" };
    ctx.fillStyle = "#1e1e1e";
    ctx.beginPath();
    ctx.arc(205, 195, 25, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.fillStyle = statusColors[status] || "#747F8D";
    ctx.beginPath();
    ctx.arc(205, 195, 18, 0, Math.PI * 2, true);
    ctx.fill();

    // 8. Tipografi Teks
    ctx.textAlign = "left";

    // Username
    ctx.font = 'bold 45px "sans-serif"';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(username.toLowerCase(), 280, 100);

    // Subtitle
    ctx.font = '600 22px "sans-serif"';
    ctx.fillStyle = "#D4AF37";
    ctx.fillText("ABSENSI BERHASIL DICATAT!", 280, 140);

    // Garis Pemisah Gradient
    const lineGradient = ctx.createLinearGradient(280, 0, 730, 0);
    lineGradient.addColorStop(0, "rgba(212, 175, 55, 0.8)");
    lineGradient.addColorStop(1, "rgba(212, 175, 55, 0)");
    ctx.fillStyle = lineGradient;
    ctx.fillRect(280, 155, 450, 2);

    // Ikon Crescent & Streak
    ctx.drawImage(crescentStarImg, 280, 180, 55, 55);
    const goldTextGradient = ctx.createLinearGradient(355, 0, 650, 0);
    goldTextGradient.addColorStop(0, "#D4AF37");
    goldTextGradient.addColorStop(1, "#F9E076");

    ctx.font = 'bold 60px "sans-serif"';
    ctx.fillStyle = goldTextGradient;
    ctx.fillText(`${streakCount} Hari Streak`, 355, 225);

    // Info Terakhir
    if (lastAbsenDate) {
      ctx.font = '10px "sans-serif"';
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fillText(`🌙 Terakhir: ${lastAbsenDate}`, 360, 245);
    }

    // 9. LAYER TERATAS: Lampion & Watermark
    ctx.drawImage(fanousLanternImg, width - 180, -5, 140, 200);

    ctx.globalAlpha = 0.1;
    ctx.drawImage(crescentStarImg, width - 150, height - 150, 200, 200);
    ctx.globalAlpha = 1.0;

    res.set("Content-Type", "image/png");
    res.send(canvas.toBuffer("image/png"));
  } catch (error) {
    console.error("Error Detail Ramadhan Card:", error);
    res.status(500).json({ message: "Gagal merender kartu Ramadhan." });
  }
};

module.exports = { absenCardRamadhanController };
