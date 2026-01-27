const axios = require("axios");
const Jimp = require("jimp");
const path = require("path");
const { createCanvas, loadImage} = require("canvas");

const attendanceSuccesController = async (req, res) => {
  try {
    const {
      avatarUrl,
      username,
      newStreak,
      status = "online",
      primaryColor = "43B581", 
      backgroundUrl,
      blurValue,
    } = req.body;

    // Validasi input
    const requiredFields = { avatarUrl, username, newStreak };
    const missingFields = Object.keys(requiredFields).filter(key => !requiredFields[key]);
    if (missingFields.length > 0) {
      return res.status(400).json({ message: `Missing: [${missingFields.join(", ")}]` });
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
      let bgBuffer = Buffer.from(bgResponse.data);
      
      const jimpImg = await Jimp.read(bgBuffer);
      if (parseInt(blurValue) > 0) jimpImg.blur(parseInt(blurValue));
      bgBuffer = await jimpImg.getBufferAsync(Jimp.MIME_PNG);
      
      const finalBg = await loadImage(bgBuffer);
      const imgRatio = finalBg.width / finalBg.height;
      const canvasRatio = width / height;
      let sx = 0, sy = 0, sw = finalBg.width, sh = finalBg.height;
      
      if (imgRatio > canvasRatio) {
        sw = sh * canvasRatio;
        sx = (finalBg.width - sw) / 2;
      } else {
        sh = sw / canvasRatio;
        sy = (finalBg.height - sh) / 2;
      }
      ctx.drawImage(finalBg, sx, sy, sw, sh, 0, 0, width, height);
    }

    ctx.fillStyle = "rgba(15, 15, 15, 0.75)";
    ctx.beginPath();
    ctx.roundRect(40, 40, width - 80, height - 80, 40);
    ctx.fill();
    const avatarResponse = await axios.get(avatarUrl, { responseType: "arraybuffer" });
    const avatarImg = await loadImage(avatarResponse.data);
    
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 15;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(150, 141, 80, 0, Math.PI * 2, true);
    ctx.clip();
    ctx.drawImage(avatarImg, 70, 61, 160, 160);
    ctx.restore();
    
    ctx.shadowBlur = 0; 

    // Lingkaran Status
    const statusColors = { online: "#43B581", idle: "#FAA61A", dnd: "#F04747" };
    ctx.fillStyle = "#0f0f0f";
    ctx.beginPath();
    ctx.arc(205, 195, 26, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.fillStyle = statusColors[status] || "#747F8D";
    ctx.beginPath();
    ctx.arc(205, 195, 18, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.textAlign = "left";

    ctx.font = 'bold 50px "sans-serif"';
    ctx.fillStyle = "#ffffff";
    ctx.fillText(username.toLowerCase(), 275, 105);

    ctx.font = '600 20px "sans-serif"';
    ctx.fillStyle = `#${primaryColor}`;
    ctx.fillText("ABSENSI BERHASIL DICATAT!", 275, 140);
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(275, 155, 450, 1.5);

   ctx.drawImage(iconsFire, 280, 165, 55, 60);
    const streakText = `${newStreak} Hari Streak`;
   
   ctx.font = 'bold 60px "sans-serif"';
    
    const gradient = ctx.createLinearGradient(260, 0, 600, 0);
    gradient.addColorStop(1, "#ffffff");
    
    ctx.fillStyle = "#FFAC33";
    ctx.fillText(`${streakText}`, 345, 220);
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.font = 'bold 100px "sans-serif"';
    ctx.fillStyle = `#${primaryColor}`;
    ctx.textAlign = "right";
    ctx.fillText("✓", width - 80, 160);
    ctx.restore();

    res.set("Content-Type", "image/png");
    res.send(canvas.toBuffer("image/png"));

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  attendanceSuccesController
}