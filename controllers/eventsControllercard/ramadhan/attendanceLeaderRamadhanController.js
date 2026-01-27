const Jimp = require("jimp");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const path = require("path");

const attendanceLeaderRamadhanController = async (req, res) => {
  try {
    const { users } = req.body;

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

    // Load Aset Ramadhan
    const crescentStarImg = await loadImage(
      path.join(
        __dirname,
        "../../../assets/ramadhan/vecteezy_rectangle-golden-frame-border_48404304.png",
      ),
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

    // 1. Background Dasar (Teal Ramadhan)
    ctx.fillStyle = "#01261a";
    ctx.fillRect(0, 0, width, canvasHeight);

    // 2. Overlay Pattern Islami (Anti-Gepeng)
    ctx.globalAlpha = 0.08;
    const patternRatio = islamicPatternImg.width / islamicPatternImg.height;
    const canvasRatio = width / canvasHeight;
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
    ctx.drawImage(islamicPatternImg, px, py, pw, ph, 0, 0, width, canvasHeight);
    ctx.globalAlpha = 1.0;

    // 3. Frame Emas Mewah
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, width - 40, canvasHeight - 40);

    // 4. Header Teks (Akan ditimpa lampion)
    ctx.textAlign = "center";
    ctx.font = 'bold 44px "sans-serif"';
    ctx.fillStyle = "#D4AF37";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;
    ctx.fillText("🏆 LEADERBOARD 🏆", width / 2, 100);
    ctx.shadowBlur = 0;

    // Garis Pemisah
    ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, 135);
    ctx.lineTo(width - 60, 135);
    ctx.stroke();

    // 5. Looping Baris Leaderboard
    const margin = 30;
    for (let i = 0; i < limitedUsers.length; i++) {
      const user = limitedUsers[i];
      const yPos = headerHeight + i * rowHeight + 40;
      const isTop3 = i < 3;

      // Card Baris (Emas transparan untuk Top 3)
      ctx.fillStyle = isTop3
        ? "rgba(212, 175, 55, 0.15)"
        : "rgba(255, 255, 255, 0.05)";
      ctx.beginPath();
      ctx.roundRect(margin + 20, yPos - 50, width - margin * 2 - 40, 65, 15);
      ctx.fill();

      if (isTop3) {
        ctx.strokeStyle = "#D4AF37";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Ranking & Username
      ctx.textAlign = "left";
      ctx.font = 'bold 30px "sans-serif"';
      ctx.fillStyle = isTop3 ? "#D4AF37" : "#ffffff";
      ctx.fillText(`${i + 1}.`, margin + 50, yPos - 8);

      ctx.font = '500 30px "sans-serif"';
      ctx.fillText(user.username.toLowerCase(), margin + 110, yPos - 8);

      // Info Streak
      ctx.textAlign = "right";
      ctx.font = 'bold 28px "sans-serif"';
      ctx.fillStyle = isTop3 ? "#F9E076" : "#ffffff";
      ctx.fillText(`🌙 ${user.streak} hari`, width - margin - 60, yPos - 8);
    }

    // 6. Footer Info
    ctx.textAlign = "center";
    ctx.font = 'bold 20px "sans-serif"';
    ctx.fillStyle = "rgba(212, 175, 55, 0.6)";
    ctx.fillText(
      `Total Peserta: ${leaderboardData.length} User`,
      width / 2,
      canvasHeight - 45,
    );

    // 7. LAYER TERATAS: Lampion Simetris (Menimpa Header)
    ctx.drawImage(fanousLanternImg, 40, -5, 115, 160); // Kiri
    ctx.drawImage(fanousLanternImg, width - 165, -5, 115, 160); // Kanan

    // 8. Response
    res.set("Content-Type", "image/png");
    res.send(canvas.toBuffer("image/png"));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal memproses leaderboard Ramadhan." });
  }
};

module.exports = { attendanceLeaderRamadhanController };
