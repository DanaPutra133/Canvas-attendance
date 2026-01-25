const Jimp = require("jimp");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");

const attendanceListController = async (req, res) => {
  try {
    const { users, backgroundUrl, blurValue } = req.body;
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
    const headerHeight = 160;
    const rowHeight = 95; // Sedikit lebih tinggi agar tidak sesak
    const footerHeight = 100;
    const canvasHeight =
      headerHeight + attendanceData.length * rowHeight + footerHeight;

    const canvas = createCanvas(width, canvasHeight);
    const ctx = canvas.getContext("2d");

    // 1. Background Logic (Jimp Blur)
    if (backgroundUrl) {
      const bgResponse = await axios.get(backgroundUrl, {
        responseType: "arraybuffer",
      });
      let bgBuffer = Buffer.from(bgResponse.data);
      if (parseInt(blurValue) > 0) {
        const jimpImg = await Jimp.read(bgBuffer);
        jimpImg.blur(parseInt(blurValue));
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
      ctx.drawImage(finalBg, sx, sy, sw, sh, 0, 0, width, canvasHeight);
    } else {
      ctx.fillStyle = "#0f0f0f";
      ctx.fillRect(0, 0, width, canvasHeight);
    }

    // 2. Overlay Utama (Lebih Gelap & Mewah)
    ctx.fillStyle = "rgba(10, 10, 10, 0.82)"; // Sedikit lebih pekat
    ctx.beginPath();
    ctx.roundRect(35, 35, width - 70, canvasHeight - 70, 40);
    ctx.fill();

    // 3. Header
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = 'bold 48px "sans-serif"';
    ctx.fillText("DAFTAR KEHADIRAN", 75, 110);

    // Garis Pemisah Glow
    const gradientLine = ctx.createLinearGradient(75, 0, width - 75, 0);
    gradientLine.addColorStop(0, "rgba(255, 172, 51, 0.8)");

    ctx.strokeStyle = gradientLine;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(75, 145);
    ctx.lineTo(width - 75, 145);
    ctx.stroke();

    // 4. Looping Data
    for (let i = 0; i < attendanceData.length; i++) {
      const user = attendanceData[i];
      const yPos = headerHeight + i * rowHeight + 55;

      // Card Baris (Bukan sekedar Zebra, tapi box transparan)
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.beginPath();
      ctx.roundRect(70, yPos - 55, width - 140, 80, 20);
      ctx.fill();

      // Nomor Urut (Lingkaran Kecil)
      ctx.fillStyle = i < 3 ? "#FFAC33" : "#ffffff";
      ctx.font = 'bold 24px "sans-serif"';
      ctx.textAlign = "center";
      ctx.fillText(`${i + 1}`, 105, yPos - 5);

      // Status Indicator (Dekat nama agar terbaca satu baris)
      ctx.fillStyle = "#43B581";
      ctx.beginPath();
      ctx.arc(width - 110, yPos - 12, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.textAlign = "left";
      ctx.font = 'bold 30px "sans-serif"';
      ctx.fillStyle = i < 3 ? "#FFAC33" : "#ffffff";
      ctx.fillText(user.username.toLowerCase(), 145, yPos - 15);
      ctx.font = '500 19px "sans-serif"';
      ctx.fillStyle = i < 3 ? "#FFAC33" : "#ffffff";
      ctx.fillText(
        `${user.time || "--:--"}    |    🔥 Streak: ${user.streak || 0} hari`,
        145,
        yPos + 15,
      );
    }

    // 5. Footer (Lebih menonjol)
    const footerY = canvasHeight - 80;

    // Background Footer Box
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.roundRect(width / 2 - 160, footerY - 25, 320, 50, 25);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.font = 'bold 24px "sans-serif"';
    ctx.fillStyle = "#FFAC33";
    ctx.fillText(
      `TOTAL HADIR: ${attendanceData.length} ORANG`,
      width / 2,
      footerY + 8,
    );

    // 6. Response
    res.set("Content-Type", "image/png");
    res.send(canvas.toBuffer("image/png"));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal merender daftar kehadiran." });
  }
};

module.exports = {
    attendanceListController
}