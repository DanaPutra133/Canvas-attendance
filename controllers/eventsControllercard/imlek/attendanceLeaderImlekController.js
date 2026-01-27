const Jimp = require("jimp");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const path = require("path");

const attendanceLeaderImlekController = async (req, res) => {
  try {
    const { users, backgroundUrl, blurValue = 10 } = req.body;

    const leaderboardData =
      typeof users === "string" ? JSON.parse(users) : users;

    if (!leaderboardData || !Array.isArray(leaderboardData)) {
      return res
        .status(400)
        .json({ message: "Parameter 'users' (array) diperlukan." });
    }

    const limitedUsers = leaderboardData.slice(0, 15);
    const width = 800;
    const rowHeight = 75; 
    const headerHeight = 150;
    const footerHeight = 80;
    const canvasHeight =
      headerHeight + limitedUsers.length * rowHeight + footerHeight;

    const canvas = createCanvas(width, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Load Aset Imlek
    const lanternImg = await loadImage(
      path.join(__dirname, "../../../assets/imlek/imlek1.png"),
    );
    const goldDecorImg = await loadImage(
      path.join(__dirname, "../../../assets/imlek/imlek2.png"),
    );

    // 1. Background Merah Gradasi 
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    bgGradient.addColorStop(0, "#8B0000");
    bgGradient.addColorStop(1, "#5E0000");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, canvasHeight);

    if (backgroundUrl) {
      try {
        const bgResponse = await axios.get(backgroundUrl, {
          responseType: "arraybuffer",
        });
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
        let sx = 0,
          sy = 0,
          sw = finalBg.width,
          sh = finalBg.height;
        if (imgRatio > canvasRatio) {
          sw = sh * canvasRatio;
          sx = (finalBg.width - sw) / 2;
        } else {
          sh = sw / canvasRatio;
          sy = (finalBg.height - sh) / 2;
        }
        ctx.globalAlpha = 0.4;
        ctx.drawImage(finalBg, sx, sy, sw, sh, 0, 0, width, canvasHeight);
        ctx.globalAlpha = 1.0;
      } catch (e) {
        console.error("BG Error:", e.message);
      }
    }

    // 2. Frame Emas Utama
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, width - 40, canvasHeight - 40);

    // 3. Header Teks 
    ctx.textAlign = "center";
    ctx.font = 'bold 44px "sans-serif"';
    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;
    ctx.fillText("🏆  LEADERBOARD 🏆", width / 2, 100);
    ctx.shadowBlur = 0;

    // Garis Pemisah Mewah
    ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, 135);
    ctx.lineTo(width - 60, 135);
    ctx.stroke();

    // 4. Looping Baris Leaderboard
    const margin = 30;
    for (let i = 0; i < limitedUsers.length; i++) {
      const user = limitedUsers[i];
      const yPos = headerHeight + i * rowHeight + 40;
      const isTop3 = i < 3;

      // Card Baris
      ctx.fillStyle = isTop3
        ? "rgba(255, 215, 0, 0.15)"
        : "rgba(255, 255, 255, 0.05)";
      ctx.beginPath();
      ctx.roundRect(margin + 20, yPos - 50, width - margin * 2 - 40, 65, 15);
      ctx.fill();

      // Border baris khusus Top 3
      if (isTop3) {
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Teks Ranking & Username
      ctx.textAlign = "left";
      ctx.font = 'bold 30px "sans-serif"';
      ctx.fillStyle = isTop3 ? "#FFD700" : "#ffffff";
      ctx.fillText(`${i + 1}.`, margin + 50, yPos - 8);

      ctx.font = '500 30px "sans-serif"';
      ctx.fillText(user.username.toLowerCase(), margin + 110, yPos - 8);

      // Teks Streak 
      ctx.textAlign = "right";
      ctx.font = 'bold 28px "sans-serif"';
      ctx.fillStyle = isTop3 ? "#FFD700" : "#ffffff";
      ctx.fillText(`📅 ${user.streak} hari`, width - margin - 60, yPos - 8);
    }

    // 5. Footer Info
    ctx.textAlign = "center";
    ctx.font = 'bold 20px "sans-serif"';
    ctx.fillStyle = "rgba(255, 215, 0, 0.6)";
    ctx.fillText(
      `Total Peserta: ${leaderboardData.length} User`,
      width / 2,
      canvasHeight - 45,
    );

    // 6. LAYER TERATAS: Lampion
    ctx.drawImage(lanternImg, 35, -17, 100, 150); // Kiri
    ctx.drawImage(lanternImg, width - 135, -17, 100, 150); // Kanan

    // 7. Response
    res.set("Content-Type", "image/png");
    res.send(canvas.toBuffer("image/png"));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal memproses leaderboard Imlek." });
  }
};

module.exports = { attendanceLeaderImlekController };
