const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// 🔑 Access Token & Images
const ACCESS_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
const BACKGROUND_URL = "https://i.imgur.com/DrRCWjc.jpeg";

module.exports = {
  config: {
    name: "cup",
    aliases: ["choke", "gola", "chope"],
    version: "2.0.3",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: "Funny choking meme command",
    longDescription: "Creates a funny choking meme image using sender and target profile pictures.",
    category: "fun"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const tempPath = path.join(__dirname, `temp_choke_${Date.now()}.png`);
    let processingMsg = null;

    try {
      // 🎯 ১. টার্গেট ইউজার আইডি বের করা (Reply / Mention / UID / Link)
      let targetID = null;

      if (event.type === "message_reply") {
        targetID = event.messageReply.senderID;
      } else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } else if (args[0]) {
        if (/^\d+$/.test(args[0])) {
          targetID = args[0];
        } else {
          const match = args[0].match(/(?:id=|\/|^)(\d{6,})/);
          if (match) targetID = match[1];
        }
      }

      if (!targetID) {
        return api.sendMessage("❌ কাকে গলার চিপা দিতে চান তাকে মেনশন, রিপ্লাই বা তার আইডি/লিংক দিন!", threadID, messageID);
      }

      // ⏳ ২. প্রসেসিং মেসেজ পাঠানো
      processingMsg = await api.sendMessage("⏳ **মেমে তৈরি হচ্ছে...** একটু অপেক্ষা করুন!", threadID, messageID);

      // 🖼️ ৩. ব্যাকগ্রাউন্ড ডাউনলোড
      const bgBuffer = await downloadBuffer(BACKGROUND_URL);
      if (!bgBuffer) {
        throw new Error("ব্যাকগ্রাউন্ড পিকচার ডাউনলোড করতে সমস্যা হয়েছে!");
      }

      // 🖼️ ৪. প্রোফাইল পিকচার ডাউনলোড
      const senderAvatarBuffer = await downloadAvatar(senderID);
      const targetAvatarBuffer = await downloadAvatar(targetID);

      const bgImg = await loadImage(bgBuffer);
      const senderAvatar = senderAvatarBuffer ? await loadImage(senderAvatarBuffer) : null;
      const targetAvatar = targetAvatarBuffer ? await loadImage(targetAvatarBuffer) : null;

      // 🎨 ৫. ক্যানভাস সেটআপ
      const width = bgImg.width;
      const height = bgImg.height;

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // ব্যাকগ্রাউন্ড আঁকা
      ctx.drawImage(bgImg, 0, 0, width, height);

      // 📍 ৬. সঠিক পজিশনে প্রোফাইল পিক বসানো
      
      // ⬅️ বাম পাশ (Victim / যে চিপা খাচ্ছে) = TARGET
      const leftX = width * 0.31;
      const leftY = height * 0.27;
      const leftRadius = width * 0.14;
      drawCircularAvatar(ctx, targetAvatar, leftX, leftY, leftRadius, "#ff4757");

      // ➡️ ডান পাশ (Choker / যে চিপা দিচ্ছে) = SENDER (কমান্ডদাতা)
      const rightX = width * 0.76;
      const rightY = height * 0.51;
      const rightRadius = width * 0.15;
      drawCircularAvatar(ctx, senderAvatar, rightX, rightY, rightRadius, "#2ed573");

      // 💾 ৭. ছবি সেভ করা
      const buffer = canvas.toBuffer("image/png");
      await fs.writeFile(tempPath, buffer);

      // ✅ ৮. মেসেজ সেন্ড ও প্রসেসিং মেসেজ আনসেন্ড
      await api.sendMessage(
        {
          body: "✅ ধর চিপা! 😼🔥",
          attachment: fs.createReadStream(tempPath)
        },
        threadID,
        () => {
          if (processingMsg && processingMsg.messageID) {
            try { api.unsendMessage(processingMsg.messageID); } catch (_) {}
          }
          if (fs.existsSync(tempPath)) {
            try { fs.unlinkSync(tempPath); } catch (_) {}
          }
        },
        messageID
      );

    } catch (error) {
      console.error("Cup Command Error:", error);
      if (processingMsg && processingMsg.messageID) {
        try { api.unsendMessage(processingMsg.messageID); } catch (_) {}
      }
      api.sendMessage(`❌ এরর হয়েছে: ${error.message}`, threadID, messageID);
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (_) {}
      }
    }
  }
};

// 🛠️ সার্কুলার পিকচার ড্রয়ার
function drawCircularAvatar(ctx, img, x, y, radius, borderColor) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (img) {
    ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
  } else {
    ctx.fillStyle = "#2b2d42";
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${radius}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("👤", x, y + radius * 0.3);
  }

  ctx.restore();

  // বর্ডার রিং
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

// 🛠️ সেফ প্রোফাইল ডাউনলোডার
async function downloadAvatar(userID) {
  const urls = [
    `https://graph.facebook.com/${userID}/picture?width=500&height=500&access_token=${ACCESS_TOKEN}`,
    `https://graph.facebook.com/${userID}/picture?type=large`
  ];

  for (const url of urls) {
    try {
      const res = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 6000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });
      return Buffer.from(res.data, "binary");
    } catch (e) {}
  }
  return null;
}

// 🛠️ বাফার ডাউনলোডার
async function downloadBuffer(url) {
  try {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    return Buffer.from(res.data, "binary");
  } catch (error) {
    return null;
  }
}
