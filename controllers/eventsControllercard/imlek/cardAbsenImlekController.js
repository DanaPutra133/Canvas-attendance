const axios = require("axios");
const Jimp = require("jimp");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// Helper untuk URL Discord agar support PNG
const getCompatibleUrl = (url) => {
  if (!url) return url;
  return url.split("?")[0].replace(".webp", ".png") + "?size=256";
};

const absenCardImlekController = async (req, res) => {
  try {
    const {
      avatarUrl,
      username,
      streakCount, 
      lastAbsenDate,
      status = "online",
      backgroundUrl,
      blurValue = 10,
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

    // 2. Load Aset Imlek
    const lanternImg = await loadImage(
      path.join(__dirname, "../../../assets/imlek/imlek1.png"),
    );
    const goldDecorImg = await loadImage(
      path.join(__dirname, "../../../assets/imlek/imlek2.png"),
    );

    // 3. Background Merah Gradasi Dasar
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, "#8B0000"); // Dark Red
    bgGradient.addColorStop(1, "#D40000"); // Red
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 4. Background URL 
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
        console.log("Gagal load backgroundUrl:", e.message);
      }
    }

    // 5. Ornamen & Frame
    ctx.strokeStyle = "#FFD700"; // Emas
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Lampion Besar di Kanan
    ctx.drawImage(lanternImg, width - 220, 10, 170, 150);

    // Watermark Mandarin
    ctx.font = 'bold 80px "sans-serif"';
    ctx.fillStyle = "rgba(255, 215, 0, 0.15)";
    ctx.textAlign = "right";
    ctx.fillText("恭喜发财", width - 60, height - 60);

    // 6. Avatar dengan Border Emas
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

    // 7. Status Circle
    const statusColors = { online: "#43B581", idle: "#FAA61A", dnd: "#F04747" };
    ctx.fillStyle = "#1e1e1e";
    ctx.beginPath();
    ctx.arc(205, 195, 25, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.fillStyle = statusColors[status] || "#747F8D";
    ctx.beginPath();
    ctx.arc(205, 195, 18, 0, Math.PI * 2, true);
    ctx.fill();

    // 8. Teks & Tipografi
    ctx.textAlign = "left";

    // Username
    ctx.font = 'bold 45px "sans-serif"';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(username.toLowerCase(), 270, 100);

    // Status Sukses
    ctx.font = '600 22px "sans-serif"';
    ctx.fillStyle = "#FFD700";
    ctx.fillText("ABSENSI BERHASIL DICATAT!", 270, 140);

    // Garis Pemisah
    ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
    ctx.fillRect(270, 155, 400, 2);

    // Ikon Naga Emas (goldDecorImg)
    ctx.drawImage(goldDecorImg, 240, 150, 100, 100);

    // Teks Streak dengan Gradient Emas
    const goldTextGradient = ctx.createLinearGradient(270, 0, 500, 0);
    goldTextGradient.addColorStop(0, "#FFD700");
    goldTextGradient.addColorStop(1, "#FFFACD");

    ctx.font = 'bold 60px "sans-serif"';
    ctx.fillStyle = goldTextGradient;
    ctx.fillText(`${streakCount || 0} Hari Streak`, 330, 218);

    // Info Terakhir Absen (Jika ada)
    if (lastAbsenDate) {
      ctx.font = '18px "sans-serif"';
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText(`📅  Terakhir: ${lastAbsenDate}`, 330, 245);
    }

    // 9. Kirim Response
    res.set("Content-Type", "image/png");
    res.send(canvas.toBuffer("image/png"));
  } catch (error) {
    console.error("Error Detail Imlek Card:", error);
    res.status(500).json({ message: "Gagal merender kartu Imlek." });
  }
};

module.exports = { absenCardImlekController };
