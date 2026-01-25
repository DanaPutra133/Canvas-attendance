const axios = require("axios");
const Jimp = require("jimp");


const { createCanvas, loadImage} = require("canvas");

const rankCardController = async (req, res) => {
  try {
    const {
      avatarUrl,
      username,
      level,
      rank,
      currentXp,
      requiredXp,
      status = "online",
      primaryColor = "FFFFFF",
      backgroundUrl,
      blurValue,
    } = req.body;
    const requiredParams = {
      avatarUrl,
      username,
      level,
      rank,
      currentXp,
      requiredXp,
    };
    for (const param in requiredParams) {
      if (!requiredParams[param]) {
        return res
          .status(400)
          .json({ message: `Error: Parameter '${param}' diperlukan.` });
      }
    }
    const width = 934;
    const height = 282;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
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
    if (backgroundUrl) {
      const bgResponse = await axios.get(backgroundUrl, {
        responseType: "arraybuffer",
      });
      let backgroundBuffer = Buffer.from(bgResponse.data);
      const blurAmount = parseInt(blurValue);
      if (blurAmount > 0) {
        const jimpImage = await Jimp.read(backgroundBuffer);
        jimpImage.blur(Math.min(blurAmount, 100)); 
        backgroundBuffer = await jimpImage.getBufferAsync(Jimp.MIME_PNG);
      }

      const bgImage = await loadImage(backgroundBuffer);
      const imgRatio = bgImage.width / bgImage.height;
      const canvasRatio = width / height;
      let sx = 0,
        sy = 0,
        sWidth = bgImage.width,
        sHeight = bgImage.height;
      if (imgRatio > canvasRatio) {
        sHeight = bgImage.height;
        sWidth = sHeight * canvasRatio;
        sx = (bgImage.width - sWidth) / 2;
      } else {
        sWidth = bgImage.width;
        sHeight = sWidth / canvasRatio;
        sy = (bgImage.height - sHeight) / 2;
      }
      ctx.drawImage(bgImage, sx, sy, sWidth, sHeight, 0, 0, width, height);
    } else {
      ctx.fillStyle = "#23272A";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    drawRoundRect(0, 0, width, height, 0);
    const avatarResponse = await axios.get(avatarUrl, {
      responseType: "arraybuffer",
    });
    const avatarImage = await loadImage(avatarResponse.data);
    ctx.save();
    ctx.beginPath();
    ctx.arc(130, 141, 90, 0, Math.PI * 2, true); // Avatar besar
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImage, 40, 51, 180, 180);
    ctx.restore();
    const statusColors = { online: "#43B581", idle: "#FAA61A", dnd: "#F04747" };
    ctx.fillStyle = "#23272A"; // Latar belakang status
    ctx.beginPath();
    ctx.arc(190, 201, 30, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = statusColors[status] || "#747F8D"; // Default ke offline/abu-abu
    ctx.beginPath();
    ctx.arc(190, 201, 20, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    ctx.font = 'bold 50px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillStyle = "white";
    ctx.textAlign = "start";
    ctx.fillText(username, 250, 155, 400);

    ctx.textAlign = "right";
    ctx.fillStyle = "#b9bbbe";
    ctx.font = 'bold 30px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillText("RANK", width - 205, 82);
    ctx.fillText("LEVEL", width - 65, 82);

    ctx.font = 'bold 50px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillStyle = `#${primaryColor}`;
    ctx.fillText(`#${rank}`, width - 205, 132);
    ctx.fillStyle = "white"; // Level berwarna putih
    ctx.fillText(level, width - 65, 132);
    const progress = parseInt(currentXp) / parseInt(requiredXp);
    const progressBarWidth = 615;
    const progressX = 250;
    const progressY = 185;
    ctx.fillStyle = "#484b4e";
    drawRoundRect(progressX, progressY, progressBarWidth, 40, 20);

    if (progress > 0) {
      ctx.fillStyle = `#${primaryColor}`;
      drawRoundRect(progressX, progressY, progressBarWidth * progress, 40, 20);
    }
    ctx.font = '24px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${currentXp} / ${requiredXp} XP`,
      progressX + progressBarWidth / 2,
      progressY + 20,
    );
    res.set("Content-Type", "image/png");
    res.send(canvas.toBuffer("image/png"));
  } catch (error) {
    console.error("Gagal membuat kartu Discord:", error);
    res.status(500).json({ message: "Gagal memproses permintaan." });
  }
};

module.exports = {
    rankCardController
}

