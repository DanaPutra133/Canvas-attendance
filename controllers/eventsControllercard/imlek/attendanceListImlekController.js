const Jimp = require("jimp");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const path = require("path");

const attendanceListImlekController = async (req, res) => {
  try {
    const { users, backgroundUrl, blurValue = 10 } = req.body;
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

    // Load Aset Imlek
    const lanternImg = await loadImage(
      path.join(__dirname, "../../../assets/imlek/imlek1.png"),
    );
    const goldDecorImg = await loadImage(
      path.join(__dirname, "../../../assets/imlek/imlek2.png"),
    );

    // 1. Background Merah Gradasi Dasar
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
        if (parseInt(blurValue) > 0) {
          const jimpImg = await Jimp.read(bgBuffer);
          jimpImg.blur(Math.min(parseInt(blurValue), 50));
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
        console.log("BG Error:", e.message);
      }
    }

    // 2. Frame Emas Utama
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, width - 40, canvasHeight - 40);

    // 3. Watermark Mandarin di tengah (Background Layer)
    ctx.textAlign = "center";
    ctx.font = 'bold 120px "sans-serif"';
    ctx.fillStyle = "rgba(255, 215, 0, 0.05)";
    ctx.fillText("恭喜发财", width / 2, canvasHeight / 2);

    // 4. Header Teks (Digambar di bawah layer lampion nanti)
    ctx.fillStyle = "#FFD700";
    ctx.font = 'bold 52px "sans-serif"';
    ctx.fillText("DAFTAR KEHADIRAN", width / 2, 110);

    // 5. Looping Data User
    for (let i = 0; i < attendanceData.length; i++) {
      const user = attendanceData[i];
      const yPos = headerHeight + i * rowHeight + 50;
      const isTop3 = i < 3; // Cek apakah ranking 1, 2, atau 3

      // Baris Box
      ctx.fillStyle = isTop3
        ? "rgba(255, 215, 0, 0.2)"
        : "rgba(255, 255, 255, 0.05)";
      ctx.beginPath();
      ctx.roundRect(60, yPos - 50, width - 120, 85, 15);
      ctx.fill();

      // Border Baris 
      ctx.strokeStyle = isTop3 ? "#FFD700" : "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = isTop3 ? 3 : 1;
      ctx.stroke();

      // Ikon Naga (Hanya Top 3 yang berwarna emas pekat)
      ctx.globalAlpha = isTop3 ? 1.0 : 0.4;
      ctx.drawImage(goldDecorImg, 80, yPos - 40, 60, 60);
      ctx.globalAlpha = 1.0;

      // Info User
      ctx.textAlign = "left";
      // Nama: Emas untuk Top 3, Putih untuk lainnya
      ctx.fillStyle = isTop3 ? "#FFD700" : "#ffffff";
      ctx.font = 'bold 30px "sans-serif"';
      ctx.fillText(user.username.toLowerCase(), 160, yPos - 15);

      // Sub-info (Waktu & Streak)
      ctx.font = '500 20px "sans-serif"';
      // Streak: Emas untuk Top 3, Putih tulang untuk lainnya
      ctx.fillStyle = isTop3 ? "#FFFACD" : "#dddddd";
      ctx.fillText(
        `📅  ${user.time || "--:--"}   |   🔥 Streak: ${user.streak || 0} hari`,
        160,
        yPos + 20,
      );

      // Status Dot (Top 3 Emas, lainnya putih)
      ctx.fillStyle = isTop3 ? "#FFD700" : "#ffffff";
      ctx.beginPath();
      ctx.arc(width - 100, yPos - 10, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Footer
    const footerY = canvasHeight - 75;
    ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
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

    // 7. LAYER TERATAS: Lampion 
   
    ctx.drawImage(lanternImg, 40, -17, 110, 160); // Lampion Kiri
    ctx.drawImage(lanternImg, width - 150, -17, 110, 160); // Lampion Kanan

    // 8. Response
    res.set("Content-Type", "image/png");
    res.send(canvas.toBuffer("image/png"));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal merender daftar imlek." });
  }
};

module.exports = { attendanceListImlekController };
