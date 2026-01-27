const Jimp = require("jimp");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const path = require("path");

const attendanceListRamadhanController = async (req, res) => {
  try {
    const { users } = req.body;
    let attendanceData = [];
    try {
      attendanceData = typeof users === "string" ? JSON.parse(users) : users;
    } catch (e) {
      return res
        .status(400)
        .json({ message: "Format data users tidak valid." });
    }

    if (!attendanceData || !Array.isArray(attendanceData)) {
      return res
        .status(400)
        .json({ message: "Data users diperlukan dalam format array." });
    }

    const width = 850;
    const headerHeight = 180;
    const rowHeight = 95;
    const footerHeight = 110;
    const canvasHeight =
      headerHeight + attendanceData.length * rowHeight + footerHeight;

    const canvas = createCanvas(width, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Load Aset Ramadhan
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

    // 3. Frame Emas Mewah (Double Line)
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, width - 40, canvasHeight - 40);
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 30, width - 60, canvasHeight - 60);

    // 4. Header Teks
    ctx.textAlign = "center";
    ctx.fillStyle = "#D4AF37";
    ctx.font = 'bold 48px "sans-serif"';
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;
    ctx.fillText("DAFTAR KEHADIRAN", width / 2, 110);
    ctx.shadowBlur = 0;

    // 5. Looping Data User
    for (let i = 0; i < attendanceData.length; i++) {
      const user = attendanceData[i];
      const yPos = headerHeight + i * rowHeight + 50;
      const isTop3 = i < 3;

      // Baris Box (Emas Transparan)
      ctx.fillStyle = isTop3
        ? "rgba(212, 175, 55, 0.15)"
        : "rgba(255, 255, 255, 0.05)";
      ctx.beginPath();
      ctx.roundRect(60, yPos - 50, width - 120, 85, 15);
      ctx.fill();

      // Border Baris khusus Top 3
      if (isTop3) {
        ctx.strokeStyle = "#D4AF37";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Ikon Bulan Sabit Kecil (Indikator baris)
      ctx.globalAlpha = isTop3 ? 1.0 : 0.4;
      ctx.drawImage(crescentStarImg, 85, yPos - 38, 55, 55);
      ctx.globalAlpha = 1.0;

      // Info User
      ctx.textAlign = "left";
      ctx.fillStyle = isTop3 ? "#D4AF37" : "#ffffff";
      ctx.font = 'bold 30px "sans-serif"';
      ctx.fillText(user.username.toLowerCase(), 160, yPos - 15);

      // Sub-info (Waktu & Streak)
      ctx.font = '500 20px "sans-serif"';
      ctx.fillStyle = isTop3 ? "#F9E076" : "#cccccc";
      ctx.fillText(
        `🌙 ${user.time || "--:--"}   |   🔥 Streak: ${user.streak || 0} hari`,
        160,
        yPos + 20,
      );

      // Status Dot
      ctx.fillStyle = isTop3 ? "#D4AF37" : "#43B581";
      ctx.beginPath();
      ctx.arc(width - 100, yPos - 10, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Footer
    const footerY = canvasHeight - 75;
    ctx.fillStyle = "rgba(212, 175, 55, 0.2)";
    ctx.beginPath();
    ctx.roundRect(width / 2 - 180, footerY - 30, 360, 60, 30);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.font = 'bold 24px "sans-serif"';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(
      `TOTAL HADIR: ${attendanceData.length} PESERTA`,
      width / 2,
      footerY + 10,
    );

    // 7. LAYER TERATAS: Lampion Simetris 
    ctx.drawImage(fanousLanternImg, 45, -5, 115, 160); // Kiri
    ctx.drawImage(fanousLanternImg, width - 170, -5, 115, 160); // Kanan

    // 8. Response
    res.set("Content-Type", "image/png");
    res.send(canvas.toBuffer("image/png"));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal merender daftar Ramadhan." });
  }
};

module.exports = { attendanceListRamadhanController };
