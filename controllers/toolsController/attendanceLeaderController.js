const axios = require("axios");
const Jimp = require("jimp");
const { createCanvas, loadImage } = require("canvas");

const attendanceLeaderController = async (req, res) => {
  try {
    const { users, backgroundUrl, blurValue = 10 } = req.body;
    
    const leaderboardData = typeof users === 'string' ? JSON.parse(users) : users;

    if (!leaderboardData || !Array.isArray(leaderboardData)) {
      return res.status(400).json({ message: "Parameter 'users' (array) diperlukan." });
    }
    const limitedUsers = leaderboardData.slice(0, 15);
    const width = 800;
    const rowHeight = 70;
    const headerHeight = 120;
    const footerHeight = 60;
    const canvasHeight = headerHeight + (limitedUsers.length * rowHeight) + footerHeight;

    const canvas = createCanvas(width, canvasHeight);
    const ctx = canvas.getContext("2d");

    if (backgroundUrl) {
      const bgResponse = await axios.get(backgroundUrl, { responseType: "arraybuffer" });
      let bgBuffer = Buffer.from(bgResponse.data);
      
      const blurAmt = parseInt(blurValue);
      if (blurAmt > 0) {
        const jimpImg = await Jimp.read(bgBuffer);
        jimpImg.blur(Math.min(blurAmt, 100));
        bgBuffer = await jimpImg.getBufferAsync(Jimp.MIME_PNG);
      }
      
      const finalBg = await loadImage(bgBuffer);
      const imgRatio = finalBg.width / finalBg.height;
      const canvasRatio = width / canvasHeight;
      let sx = 0, sy = 0, sw = finalBg.width, sh = finalBg.height;
      if (imgRatio > canvasRatio) {
        sw = sh * canvasRatio;
        sx = (finalBg.width - sw) / 2;
      } else {
        sh = sw / canvasRatio;
        sy = (finalBg.height - sh) / 2;
      }
      ctx.drawImage(finalBg, sx, sy, sw, sh, 0, 0, width, canvasHeight);
    } else {
      ctx.fillStyle = "#1a1c1e";
      ctx.fillRect(0, 0, width, canvasHeight);
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    const margin = 30;
    ctx.beginPath();
    ctx.roundRect(margin, margin, width - (margin * 2), canvasHeight - (margin * 2), 25);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = 'bold 40px "sans-serif"';
    ctx.fillStyle = "#FFAC33"
    ctx.fillText("🏆 LEADERBOARD STREAK 🏆", width / 2, 90);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin + 40, 115);
    ctx.lineTo(width - margin - 40, 115);
    ctx.stroke();
    for (let i = 0; i < limitedUsers.length; i++) {
      const user = limitedUsers[i];
      const yPos = headerHeight + (i * rowHeight) + 30;
      if (i % 2 === 0) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.beginPath();
        ctx.roundRect(margin + 20, yPos - 45, width - (margin * 2) - 40, 60, 10);
        ctx.fill();
      }
      ctx.textAlign = "left";
      ctx.font = 'bold 28px "sans-serif"';
      ctx.fillStyle = i < 3 ? "#FFAC33" : "#ffffff"; 
      ctx.fillText(`${i + 1}.`, margin + 50, yPos);
      ctx.font = '500 28px "sans-serif"';
      ctx.fillStyle = i < 3 ? "#FFAC33" : "#ffffff";
      ctx.fillText(user.username.toLowerCase(), margin + 110, yPos);
      ctx.textAlign = "right";
      ctx.font = 'bold 28px "sans-serif"';
      ctx.fillStyle = i < 3 ? "#FFAC33": "#ffffff";
      ctx.fillText(`🔥 ${user.streak} hari`, width - margin - 60, yPos);
    }
    ctx.textAlign = "center";
    ctx.font = '18px "sans-serif"';
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText(`Total Peserta: ${leaderboardData.length} User`, width / 2, canvasHeight - 55);
    res.set("Content-Type", "image/png");
    res.send(canvas.toBuffer("image/png"));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal memproses leaderboard." });
  }
};

module.exports = {
    attendanceLeaderController
}

