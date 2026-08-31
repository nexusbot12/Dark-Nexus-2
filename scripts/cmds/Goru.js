const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

// 👑 বসের ইউজার আইডি
const BOSS_ID = "61592251274295";

// সেফ বাফার ডাউনলোডার
const fetchBuffer = async (url) => {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    maxRedirects: 10,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
    },
    timeout: 10000
  });
  return Buffer.from(res.data, "binary");
};

// মাল্টি-ব্যাকআপ অবতার ডাউনলোডার (Fixes Blank/Private Avatar)
const fetchAvatar = async (uid, api, usersData) => {
  let token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
  if (api && typeof api.getAccessToken === "function") {
    try {
      const botToken = api.getAccessToken();
      if (botToken) token = botToken;
    } catch (e) {}
  }

  const urls = [
    `https://graph.facebook.com/v18.0/${uid}/picture?height=720&width=720&access_token=${token}`,
    `https://graph.facebook.com/${uid}/picture?height=720&width=720&access_token=${token}`,
    `https://graph.facebook.com/${uid}/picture?type=large&redirect=true`,
    `https://graph.facebook.com/${uid}/picture?width=500&height=500`
  ];

  for (const url of urls) {
    try {
      const buf = await fetchBuffer(url);
      if (buf && buf.length > 3000) return buf;
    } catch (err) {
      continue;
    }
  }

  // ফলব্যাক হিসেবে ইউজার ডেটা সার্ভিস চেক
  if (usersData && typeof usersData.getAvatarUrl === "function") {
    try {
      const fallbackUrl = await usersData.getAvatarUrl(uid);
      if (fallbackUrl) return await fetchBuffer(fallbackUrl);
    } catch (e) {}
  }

  return await fetchBuffer("https://i.imgur.com/2z8P61i.png");
};

module.exports = {
  config: {
    name: "goru",
    version: "2.4",
    author: "ARIJIT × Ere'rious", // Don't change author name
    countDown: 5,
    role: 0,
    usePrefix: true,
    shortDescription: "Expose someone as a Goru!",
    longDescription: "Puts the tagged/replied/UID user's face on a cow's body (fun meme) with Boss Protection",
    category: "fun",
    guide: {
      en: "{pn} @mention / reply / UID / Profile link to make them a cow 😂",
    },
  },

  onStart: async function ({ event, message, api, args, usersData }) {
    const { messageID } = event;

    try {
      let targetID;
      const mentions = Object.keys(event.mentions || {});

      // ১. টার্গেট নির্বাচন (Tag / Reply / UID / Profile Link)
      if (mentions.length > 0) {
        targetID = mentions[0];
      } else if (event.type === "message_reply" || event.messageReply) {
        targetID = event.messageReply.senderID;
      } else if (args && args[0]) {
        const regexMatch = args[0].match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:profile\.php\?id=)?(\d+)/i) || args[0].match(/(\d+)/);
        if (regexMatch) {
          targetID = regexMatch[1];
        } else {
          targetID = args[0];
        }
      }

      if (!targetID) {
        if (api && typeof api.setMessageReaction === "function") {
          api.setMessageReaction("❌", messageID, () => {}, true);
        }
        return message.reply("❗ যাকে গরু বানাতে চান তাকে mention, reply বা UID/Profile Link দিন!");
      }

      if (targetID === event.senderID) {
        if (api && typeof api.setMessageReaction === "function") {
          api.setMessageReaction("❌", messageID, () => {}, true);
        }
        return message.reply("❗ ব্রো, নিজেকে গরু বানানো নিষেধ! 😂");
      }

      // 👑 ২. বস প্রোটেকশন ফিল্টার (Boss Protection Check)
      if (targetID === BOSS_ID) {
        if (api && typeof api.setMessageReaction === "function") {
          api.setMessageReaction("👑", messageID, () => {}, true);
        }
        return message.reply("🛑 থামেন ভাই! ইনি আমার বস 🙇‍♂️\nবসকে গরু বানানোর স্পর্ধা কার? বসকে সম্মান দিয়ে চলেন! 👑✨");
      }

      // প্রসেসিং রিয়েকশন (🐮)
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("🐮", messageID, () => {}, true);
      }

      // ৩. ব্যাকগ্রাউন্ড ইমেজ লোড
      const cacheDir = path.join(__dirname, "goru_cache");
      await fs.ensureDir(cacheDir);
      const bgPath = path.join(cacheDir, "cow_bg.jpg");

      let bgImage;
      if (fs.existsSync(bgPath)) {
        const bgBuffer = await fs.readFile(bgPath);
        bgImage = await loadImage(bgBuffer);
      } else {
        const cowImgUrl = "https://files.catbox.moe/ecebko.jpg";
        const bgData = await fetchBuffer(cowImgUrl);
        await fs.writeFile(bgPath, bgData);
        bgImage = await loadImage(bgData);
      }

      // ৪. অবতার লোড
      const avatarBuffer = await fetchAvatar(targetID, api, usersData);
      const avatarImage = await loadImage(avatarBuffer);

      // ৫. ক্যানভাস দিয়ে ছবি ড্র করা
      const canvas = createCanvas(bgImage.width, bgImage.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bgImage, 0, 0);

      const avatarSize = 135;
      const headCenterX = 80 + avatarSize / 2;
      const headCenterY = 60 + avatarSize / 2;

      const avatarX = headCenterX - avatarSize / 2;
      const avatarY = headCenterY - avatarSize / 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(headCenterX, headCenterY, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;

      ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(headCenterX, headCenterY, avatarSize / 2 + 1, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = "bold 20px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "left";
      ctx.shadowColor = "black";
      ctx.shadowBlur = 5;
      ctx.fillText("Kire chdna", 40, 50);

      // ৬. সেভ ও সেন্ড
      const outputPath = path.join(
        cacheDir,
        `goru_${targetID}_${Date.now()}.png`
      );
      const buffer = canvas.toBuffer("image/png");
      await fs.writeFile(outputPath, buffer);

      // ইউজার নেম সেফ ফেচ
      let tagName = "Someone";
      if (usersData && typeof usersData.getName === "function") {
        try { tagName = await usersData.getName(targetID); } catch (e) {}
      } else if (api && typeof api.getUserInfo === "function") {
        try {
          const userInfo = await api.getUserInfo(targetID);
          if (userInfo[targetID]?.name) tagName = userInfo[targetID].name;
        } catch (e) {}
      }

      await message.reply({
        body: `@🤣${tagName} 100%🐮`,
        mentions: [{ tag: tagName, id: targetID }],
        attachment: fs.createReadStream(outputPath),
      });

      // সাকসেস রিয়েকশন (✅)
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("✅", messageID, () => {}, true);
      }

      // ক্লিনআপ
      setTimeout(() => fs.unlink(outputPath).catch(() => {}), 5000);

    } catch (err) {
      console.error("❌ Goru Command Error:", err);
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
      }
      message.reply("❌ Something went wrong while making goru 😭");
    }
  }
};
