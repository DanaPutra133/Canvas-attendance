const axios = require("axios");
const Jimp = require("jimp");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");


const absenCardControler = async (req, res) => {
  try {
    const {
      avatarUrl,
      username,
      streakCount,
      lastAbsenDate,
      status = "online",
      primaryColor = "FFAC33",
      backgroundUrl,
      blurValue = 0,
    } = req.body;

    const missingBody = {avatarUrl, username, streakCount};
    const missingFields = [];

    for (const [key, value] of Object.entries(missingBody)) {
      if (value === undefined || value === null || value === "") {
        missingFields.push(key);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Gagal: Parameter ${missingFields.join(", ")} diperlukan.` 
      });
    }

    if (streakCount > 31){
        return res.status(400).json({message: "Streak tidak boleh lewat dari 32 hari!"})
    }

    const width = 934;
    const height = 282;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

       const iconsFire = await loadImage(
           path.join(__dirname, "../../assets/clear/fire.png"),
         );

    if (backgroundUrl) {
      const bgResponse = await axios.get(backgroundUrl, { responseType: "arraybuffer" });
      let backgroundBuffer = Buffer.from(bgResponse.data);

      const blurAmount = parseInt(blurValue);
      if (blurAmount > 0) {
        const jimpImage = await Jimp.read(backgroundBuffer);
        jimpImage.blur(Math.min(blurAmount, 100)); // Limit maksimal 100 agar tidak crash
        backgroundBuffer = await jimpImage.getBufferAsync(Jimp.MIME_PNG);
      }

      const finalBgImage = await loadImage(backgroundBuffer);
      
      const imgRatio = finalBgImage.width / finalBgImage.height;
      const canvasRatio = width / height;
      let sx, sy, sWidth, sHeight;

      if (imgRatio > canvasRatio) {
        sHeight = finalBgImage.height;
        sWidth = sHeight * canvasRatio;
        sx = (finalBgImage.width - sWidth) / 2;
        sy = 0;
      } else {
        sWidth = finalBgImage.width;
        sHeight = sWidth / canvasRatio;
        sx = 0;
        sy = (finalBgImage.height - sHeight) / 2;
      }

      ctx.drawImage(finalBgImage, sx, sy, sWidth, sHeight, 0, 0, width, height);
    } else {
      ctx.fillStyle = "#1a1c1e";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    const drawRoundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
    };
    drawRoundRect(25, 25, width - 50, height - 50, 30);

    const avatarResponse = await axios.get(avatarUrl, { responseType: "arraybuffer" });
    const avatarImage = await loadImage(avatarResponse.data);
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(140, 141, 85, 0, Math.PI * 2, true);
    ctx.clip();
    ctx.drawImage(avatarImage, 55, 56, 170, 170);
    ctx.restore();

    const statusColors = { online: "#43B581", idle: "#FAA61A", dnd: "#F04747" };
    ctx.fillStyle = "#1e1e1e";
    ctx.beginPath();
    ctx.arc(195, 195, 25, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.fillStyle = statusColors[status] || "#747F8D";
    ctx.beginPath();
    ctx.arc(195, 195, 18, 0, Math.PI * 2, true);
    ctx.fill();

   ctx.textAlign = "left";

ctx.font = 'bold 44px "sans-serif"';
ctx.fillStyle = "#ffffff";
ctx.fillText(username.toLowerCase(), 270, 90); 
ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
ctx.fillRect(270, 110, 400, 2);
ctx.font = '500 22px "sans-serif"';
ctx.fillStyle = "#cccccc";
ctx.fillText("STREAK ABSENSI SAAT INI", 270, 140); 

ctx.drawImage(iconsFire, 270, 155, 55, 60);

// --- Rendering Teks Jumlah Streak ---
const streakCountText = `${streakCount} Hari`;
ctx.font = 'bold 62px "sans-serif"';
ctx.fillStyle = `#${primaryColor}`;
ctx.fillText(`${streakCountText}`, 340, 210);
if (lastAbsenDate) {
  ctx.font = '18px "sans-serif"';
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.fillText(`📅 Terakhir: ${lastAbsenDate}`, 270, 244); 
}

    res.set("Content-Type", "image/png");
    res.send(canvas.toBuffer("image/png"));

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal memproses kartu absensi." });
  }
};

module.exports = {
    absenCardControler
}

