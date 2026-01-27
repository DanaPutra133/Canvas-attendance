const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");

const getCompatibleUrl = (url) => {
  if (!url) return url;
  return url.split("?")[0].replace(".webp", ".png") + "?size=256";
};

const cardSuccesRamadhan = async (req, res) => {
  try {
    const { avatarUrl, username, newStreak } = req.body;

    const width = 934;
    const height = 282;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
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

    ctx.fillStyle = "#01261a";
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 0.08;
    const patternRatio = islamicPatternImg.width / islamicPatternImg.height;
    const canvasRatio = width / height;
    let sw, sh, sx, sy;

    if (patternRatio > canvasRatio) {
      sh = islamicPatternImg.height;
      sw = sh * canvasRatio;
      sx = (islamicPatternImg.width - sw) / 2;
      sy = 0;
    } else {
      sw = islamicPatternImg.width;
      sh = sw / canvasRatio;
      sx = 0;
      sy = (islamicPatternImg.height - sh) / 2;
    }
    ctx.drawImage(islamicPatternImg, sx, sy, sw, sh, 0, 0, width, height);
    ctx.globalAlpha = 1.0;

    // 3. Frame Emas Mewah
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    const lanternWidth = 140;
    const lanternHeight = 200;
    ctx.drawImage(
      fanousLanternImg,
      width - 180,
      -5,
      lanternWidth,
      lanternHeight,
    ); 

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

    ctx.textAlign = "left";

    ctx.font = 'bold 50px "sans-serif"';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(username ? username.toLowerCase() : "user", 280, 105);

    ctx.font = '600 22px "sans-serif"';
    ctx.fillStyle = "#D4AF37";
    ctx.fillText("ABSENSI BERHASIL DICATAT!", 280, 145);

    const lineGradient = ctx.createLinearGradient(280, 0, 730, 0);
    lineGradient.addColorStop(0, "rgba(212, 175, 55, 0.8)");
    lineGradient.addColorStop(1, "rgba(212, 175, 55, 0)");
    ctx.fillStyle = lineGradient;
    ctx.fillRect(280, 160, 450, 2);
    const goldTextGradient = ctx.createLinearGradient(350, 0, 650, 0);
    goldTextGradient.addColorStop(0, "#D4AF37");
    goldTextGradient.addColorStop(1, "#F9E076");
    ctx.drawImage(crescentStarImg, 280, 185, 55, 55);

    ctx.font = 'bold 65px "sans-serif"';
    ctx.fillStyle = goldTextGradient;
    ctx.fillText(`${newStreak || 0} Hari Streak`, 355, 230);
    ctx.globalAlpha = 0.1;
    ctx.drawImage(crescentStarImg, width - 150, height - 150, 200, 200);
    ctx.globalAlpha = 1.0;
    res.set("Content-Type", "image/png");
    res.send(canvas.toBuffer("image/png"));
  } catch (error) {
    console.error("Error Detail Ramadhan Card:", error);
    res
      .status(500)
      .json({ message: "Gagal merender kartu.", error: error.message });
  }
};

module.exports = { cardSuccesRamadhan };
