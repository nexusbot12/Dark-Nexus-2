const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// 👑 বসের ইউজার আইডি
const BOSS_ID = "61591685889830";
const BG_URL = "https://i.imgur.com/nNf50SF.jpeg";

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

  if (usersData && typeof usersData.getAvatarUrl === "function") {
    try {
      const fallbackUrl = await usersData.getAvatarUrl(uid);
      if (fallbackUrl) return await fetchBuffer(fallbackUrl);
    } catch (e) {}
  }

  return await fetchBuffer("https://i.imgur.com/6V3Z1oM.png");
};

module.exports = {
  config: {
    name: "cow",
    aliases: ["goru", "গরু"],
    version: "1.1.0",
    role: 0,
    author: "Rasel Mahmud",
    description: "Make a meme image with cow face frame with Boss protection",
    category: "funny",
    guide: {
      bn: "[mention / reply / UID / profile link]"
    },
    countDowns: 5
  },

  onLoad: async function () {
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    console.log("[ COW CMD ] -> Loaded successfully by: Rasel Mahmud");
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const cachePath = path.join(cacheDir, `cow_${senderID}_${Date.now()}.png`);

    try {
      let targetID = null;

      // ১. টার্গেট নির্বাচন (Mention / Reply / UID / Profile Link)
      if (mentions && Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
      } else if (event.type === "message_reply" || messageReply) {
        targetID = messageReply.senderID;
      } else if (args && args.length > 0) {
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
        return api.sendMessage("⚠️ কাকে গরু বানাতে চান তাকে মেনশন, রিপ্লাই বা তার ইউআইডি/লিংক দিন!", threadID, messageID);
      }

      if (targetID === senderID) {
        if (api && typeof api.setMessageReaction === "function") {
          api.setMessageReaction("❌", messageID, () => {}, true);
        }
        return api.sendMessage("😂 নিজেকে গরু বানানো নিষেধ!", threadID, messageID);
      }

      // 👑 ২. বস প্রোটেকশন ফিল্টার (Boss Protection Check)
      if (targetID === BOSS_ID) {
        if (api && typeof api.setMessageReaction === "function") {
          api.setMessageReaction("👑", messageID, () => {}, true);
        }
        return api.sendMessage(
          "🛑 থামেন ভাই! ইনি আমার বস 🙇‍♂️\nবসকে গরু বানানোর স্পর্ধা কার? বসকে সম্মান দিয়ে চলেন! 👑✨",
          threadID,
          messageID
        );
      }

      // 🐮 ৩. প্রসেসিং রিয়েকশন (🐮)
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("🐮", messageID, () => {}, true);
      }

      // ৪. ব্যাকগ্রাউন্ড এবং ইউজার পিকচার ডাউনলোড
      const bgBuffer = await fetchBuffer(BG_URL);
      const avatarBuffer = await fetchAvatar(targetID, api, usersData);

      const bgImg = await loadImage(bgBuffer);
      const userImg = await loadImage(avatarBuffer);

      // ৫. ক্যানভাস ড্র
      const canvas = createCanvas(bgImg.width, bgImg.height);
      const ctx = canvas.getContext("2d");

      // ব্যাকগ্রাউন্ড ড্র
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      // নির্দিষ্ট পজিশনে প্রোফাইল পিকচার বসানো
      const x = canvas.width * 0.50;
      const y = canvas.height * 0.32;
      const radius = canvas.width * 0.18;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius + 4, 0, Math.PI * 2, true);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(userImg, x - radius, y - radius, radius * 2, radius * 2);
      ctx.restore();

      const buffer = canvas.toBuffer("image/png");
      await fs.writeFile(cachePath, buffer);

      // ৬. ইউজার নেম ফেচ
      let targetName = "গরু";
      if (usersData && typeof usersData.getName === "function") {
        try { targetName = await usersData.getName(targetID); } catch (e) {}
      } else if (api && typeof api.getUserInfo === "function") {
        try {
          const userInfo = await api.getUserInfo(targetID);
          if (userInfo[targetID]?.name) targetName = userInfo[targetID].name;
        } catch (e) {}
      }

      // ৭. রিপ্লাই ও রিয়েকশন
      await api.sendMessage(
        {
          body: `🐮 এই নাও ${targetName}! 🐮\n\n- Rasel Mahmud`,
          mentions: [{ tag: targetName, id: targetID }],
          attachment: fs.createReadStream(cachePath)
        },
        threadID,
        () => {
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
          if (api && typeof api.setMessageReaction === "function") {
            api.setMessageReaction("✅", messageID, () => {}, true);
          }
        },
        messageID
      );

    } catch (error) {
      console.error("[COW ERROR]:", error);
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("❌", messageID, () => {}, true);
      }
      return api.sendMessage("❌ কমান্ডটি প্রসেস করতে সমস্যা হয়েছে।", threadID, messageID);
    }
  }
};
