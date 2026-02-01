const axios = require("axios");
const Jimp = require("jimp");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");

const getCompatibleUrl = (url) => {
  if (!url) return url;
  return url.split("?")[0].replace(".webp", ".png") + "?size=256";
};

const cardSuccesImlek = async (req, res) => {
  try {
    const { avatarUrl, username, newStreak, backgroundUrl, blurValue = 10} =
    req.body;

    const width = 934;
    const height = 282;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const lanternImg = await loadImage(
      path.join(__dirname, "../../../assets/imlek/imlek1.png"),
    );
    const goldDecorImg = await loadImage(
      path.join(__dirname, "../../../assets/imlek/kudaemas.png"),
    );
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, "#8B0000");
    bgGradient.addColorStop(1, "#D40000");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    if (backgroundUrl) {
      try {
        const bgResp = await axios.get(backgroundUrl, {
          responseType: "arraybuffer",
        });
        let bgBuffer = Buffer.from(bgResp.data);
        const blurAmount = parseInt(blurValue);
        if (blurAmount > 0) {
          const jimpImg = await Jimp.read(bgBuffer);
          jimpImg.blur(Math.min(blurAmount, 50));
          bgBuffer = await jimpImg.getBufferAsync(Jimp.MIME_PNG);
        }

        const bgImg = await loadImage(bgBuffer);

        // Logika "Cover" agar gambar tidak gepeng
        const imgRatio = bgImg.width / bgImg.height;
        const canvasRatio = width / height;
        let sx, sy, sw, sh;

        if (imgRatio > canvasRatio) {
          sh = bgImg.height;
          sw = sh * canvasRatio;
          sx = (bgImg.width - sw) / 2;
          sy = 0;
        } else {
          sw = bgImg.width;
          sh = sw / canvasRatio;
          sx = 0;
          sy = (bgImg.height - sh) / 2;
        }

        ctx.globalAlpha = 0.5;
        ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, height);
        ctx.globalAlpha = 1.0;
      } catch (e) {
        console.log("Gagal load/blur backgroundUrl:", e.message);
      }
    }
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, width - 40, height - 40);
    ctx.drawImage(lanternImg, width - 220, 10, 170, 150);

    ctx.font = 'bold 80px "sans-serif"';
    ctx.fillStyle = "rgba(255, 215, 0, 0.15)";
    ctx.textAlign = "right";
    ctx.fillText("恭喜发财", width - 60, height - 60);
    if (avatarUrl) {
      const avatarResp = await axios.get(getCompatibleUrl(avatarUrl), {
        responseType: "arraybuffer",
      });
      const avatarImg = await loadImage(Buffer.from(avatarResp.data));

      ctx.save();
      ctx.beginPath();
      ctx.arc(150, 141, 80, 0, Math.PI * 2, true);
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#FFD700";
      ctx.stroke();
      ctx.clip();
      ctx.drawImage(avatarImg, 70, 61, 160, 160);
      ctx.restore();
    }
    ctx.textAlign = "left";
    ctx.font = 'bold 45px "sans-serif"';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(username ? username.toLowerCase() : "user", 270, 100);

    ctx.font = '600 22px "sans-serif"';
    ctx.fillStyle = "#FFD700";
    ctx.fillText("ABSENSI BERHASIL DICATAT!", 270, 140);

    ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
    ctx.fillRect(270, 155, 400, 2);

    const goldTextGradient = ctx.createLinearGradient(270, 0, 500, 0);
    goldTextGradient.addColorStop(0, "#FFD700");
    goldTextGradient.addColorStop(1, "#FFFACD");
    ctx.drawImage(goldDecorImg, 240, 160, 80, 80);

    ctx.font = 'bold 60px "sans-serif"';
    ctx.fillStyle = goldTextGradient;
    ctx.fillText(`${newStreak || 0} Hari Streak`, 330, 218);

    res.set("Content-Type", "image/png");
    res.send(canvas.toBuffer("image/png"));
  } catch (error) {
    console.error("Error Detail:", error);
    res
      .status(500)
      .json({ message: "Gagal merender kartu Imlek.", error: error.message });
  }
};

module.exports = { cardSuccesImlek };
