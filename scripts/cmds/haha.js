const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// 👑 বসের ইউজার আইডি
const BOSS_ID = "61592251274295";
const BACKGROUND_URL = "https://i.imgur.com/kKIft49.jpeg";

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
const fetchAvatar = async (uid, api) => {
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

  return await fetchBuffer("https://i.imgur.com/2z8P61i.png");
};

module.exports = {
  config: {
    name: "haha",
    version: "2.1.0",
    hasPermssion: 0,
    credits: "Rasel Mahmud",
    description: "Funny pic with mentioned/replied user's profile and Boss Protection",
    commandCategory: "fun",
    usages: "[mention/reply/uid/link]",
    cooldowns: 5
  },

  onStart: async ({ api, event, args, usersData }) => {
    const { threadID, messageReply, mentions, messageID, senderID } = event;
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const tempPath = path.join(cacheDir, `temp_haha_${senderID}_${Date.now()}.png`);

    try {
      // 🎯 ১. টার্গেট ইউজার আইডি বের করা
      let userID = null;
      if (mentions && Object.keys(mentions).length > 0) {
        userID = Object.keys(mentions)[0];
      } else if (messageReply) {
        userID = messageReply.senderID;
      } else if (args && args[0]) {
        const regexMatch = args[0].match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:profile\.php\?id=)?(\d+)/i) || args[0].match(/(\d+)/);
        if (regexMatch) {
          userID = regexMatch[1];
        } else {
          userID = args[0];
        }
      }

      if (!userID) {
        if (api && typeof api.setMessageReaction === "function") {
          api.setMessageReaction("❌", messageID, () => {}, true);
        }
        return api.sendMessage("⚠️ কাকে হা হা করতে চান তাকে মেনশন, রিপ্লাই বা তার আইডি/লিংক দিন!", threadID, messageID);
      }

      if (userID === senderID) {
        if (api && typeof api.setMessageReaction === "function") {
          api.setMessageReaction("❌", messageID, () => {}, true);
        }
        return api.sendMessage("😂 নিজেকে হা হা দেওয়া নিষেধ!", threadID, messageID);
      }

      // 👑 ২. বস প্রোটেকশন ফিল্টার (Boss Protection Check)
      if (userID === BOSS_ID) {
        if (api && typeof api.setMessageReaction === "function") {
          api.setMessageReaction("👑", messageID, () => {}, true);
        }
        return api.sendMessage(
          "🛑 থামেন ভাই! ইনি আমার বস 🙇‍♂️\nবসকে হা হা দেওয়ার স্পর্ধা কার? বসকে সম্মান দিয়ে চলেন! 👑✨",
          threadID,
          messageID
        );
      }

      // ⏳ ৩. প্রসেসিং রিয়েকশন (😂)
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("😂", messageID, () => {}, true);
      }

      // 🖼️ ৪. ব্যাকগ্রাউন্ড এবং প্রোফাইল পিকচার ডাউনলোড
      const bgBuffer = await fetchBuffer(BACKGROUND_URL);
      const avatarBuffer = await fetchAvatar(userID, api);

      if (!bgBuffer) throw new Error("ব্যাকগ্রাউন্ড ডাউনলোড করতে সমস্যা হয়েছে!");
      
      const bgImg = await loadImage(bgBuffer);
      const userImg = avatarBuffer ? await loadImage(avatarBuffer) : null;

      // 🎨 ৫. ক্যানভাস সেটআপ
      const canvas = createCanvas(bgImg.width, bgImg.height);
      const ctx = canvas.getContext("2d");

      // ব্যাকগ্রাউন্ড ড্র করা
      ctx.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height);

      // 📍 ৬. প্রোফাইল পিকচার ড্র করা (হেডের পজিশনে)
      if (userImg) {
        const centerX = bgImg.width * 0.77; // ডানে পজিশন
        const centerY = bgImg.height * 0.19; // উপরে পজিশন
        const radius = bgImg.width * 0.13;

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(userImg, centerX - radius, centerY - radius, radius * 2, radius * 2);
        ctx.restore();
      }

      // 💾 ৭. ফাইল সেভ
      const buffer = canvas.toBuffer("image/png");
      await fs.writeFile(tempPath, buffer);

      // ৮. নাম বের করা
      let userName = "Someone";
      if (usersData && typeof usersData.getName === "function") {
        try { userName = await usersData.getName(userID); } catch (e) {}
      } else if (api && typeof api.getUserInfo === "function") {
        try {
          const userInfo = await api.getUserInfo(userID);
          if (userInfo[userID]?.name) userName = userInfo[userID].name;
        } catch (e) {}
      }

      // ✅ ৯. মেসেজ পাঠানো
      await api.sendMessage(
        { 
          body: `😂 হাহাহা ${userName}!!`, 
          mentions: [{ tag: userName, id: userID }],
          attachment: fs.createReadStream(tempPath) 
        },
        threadID,
        () => {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          if (api && typeof api.setMessageReaction === "function") {
            api.setMessageReaction("✅", messageID, () => {}, true);
          }
        },
        messageID
      );

    } catch (e) {
      console.error("Haha Error:", e);
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("❌", messageID, () => {}, true);
      }
      api.sendMessage("❌ এরর হয়েছে: ছবি জেনারেট করা সম্ভব হচ্ছে না!", threadID, messageID);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
  }
};
