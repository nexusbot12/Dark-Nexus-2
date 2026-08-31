const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// 👑 বসের ইউজার আইডি
const BOSS_ID = "61592251274295";

module.exports = {
  config: {
    name: "usta",
    aliases: ["lathi", "latti", "ustha", "kick"],
    version: "1.0.8",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Kick/Usta meme generator",
      bn: "উস্তা বা লাথি মারার মিম পিকচার বানান"
    },
    longDescription: {
      en: "Overlays profile pictures of sender and target user onto the kick meme",
      bn: "কমান্ড দাতা এবং যাকে ট্যাগ করা হয়েছে দুজনের প্রোফাইল পিকচার উস্তা মারার ব্যাকগ্রাউন্ডে বসিয়ে দিবে"
    },
    category: "funny",
    guide: {
      en: "{p}usta @mention OR reply to a message",
      bn: "{p}usta @mention করুন অথবা মেসেজে রিপ্লাই দিন"
    }
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    const cacheFolder = path.join(__dirname, "cache");
    let cachePath = "";

    try {
      const { senderID, mentions, messageReply, messageID } = event;
      let targetID;
      let targetName = "User";

      // ১. টার্গেট নির্বাচন (যাকে লাথি মারা হবে)
      if (messageReply) {
        targetID = messageReply.senderID;
      } else if (mentions && Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
        targetName = mentions[targetID].replace("@", "");
      } else if (args && args[0] && !isNaN(args[0])) {
        targetID = args[0];
      }

      if (!targetID) {
        if (api && typeof api.setMessageReaction === "function") {
          api.setMessageReaction("❌", messageID, () => {}, true);
        }
        return message.reply("⚠️ যাকে উস্তা/লাথি মারতে চান তাকে ট্যাগ করুন বা তার মেসেজে রিপ্লাই দিন!");
      }

      // 👑 ২. বস প্রোটেকশন ফিল্টার (Boss Protection Check)
      if (targetID === BOSS_ID) {
        if (api && typeof api.setMessageReaction === "function") {
          api.setMessageReaction("👑", messageID, () => {}, true);
        }
        return message.reply("🛑 থামেন ভাই! ইনি আমার বস 🙇‍♂️\nবসের গায়ে উস্তা মারা নিষেধ, বসকে সম্মান দিয়ে চলেন! 👑✨");
      }

      // প্রসেসিং শুরুর রিয়েকশন (🦶)
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("🦶", messageID, () => {}, true);
      }

      const kickerID = senderID; // কমান্ডদাতা (যে লাথি মারছে)

      if (usersData && typeof usersData.getName === "function") {
        try { targetName = await usersData.getName(targetID); } catch (e) {}
      }

      // ৩. ইমেজ বাফার ডাউনলোডার
      async function fetchBuffer(url) {
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
      }

      // ৪. ফেসবুক রিয়েল প্রোফাইল পিকচার ফেচিং ফাংশন
      async function getAvatarBuffer(uid) {
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
            if (buf && buf.length > 3000) {
              return buf;
            }
          } catch (err) {
            continue;
          }
        }

        return await fetchBuffer("https://i.imgur.com/2z8P61i.png");
      }

      // ৫. ব্যাকগ্রাউন্ড এবং প্রোফাইল পিকচার লোড
      let bgBuffer;
      try {
        bgBuffer = await fetchBuffer("https://i.imgur.com/u59X6K7.jpeg");
      } catch (e) {
        bgBuffer = await fetchBuffer("https://drive.google.com/uc?export=download&id=1DYTuzqh7gv3KOGZWnkBY_dNu2nHnD-Js");
      }

      const [victimAvatarBuffer, kickerAvatarBuffer] = await Promise.all([
        getAvatarBuffer(targetID),
        getAvatarBuffer(kickerID)
      ]);

      // ৬. ক্যানভাস দিয়ে প্রোফাইল পিকচার বসানো
      const bgImg = await loadImage(bgBuffer);
      const victimImg = await loadImage(victimAvatarBuffer);
      const kickerImg = await loadImage(kickerAvatarBuffer);

      const canvas = createCanvas(bgImg.width, bgImg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      const W = bgImg.width;
      const H = bgImg.height;

      // সার্কেল ছবি ড্রয়িং হেলপার
      function drawCircularAvatar(img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();

        // আউটলাইন সাদা বর্ডার
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
        ctx.lineWidth = Math.max(3, Math.floor(size * 0.04));
        ctx.strokeStyle = "#FFFFFF";
        ctx.stroke();
      }

      // 📌 ১. লাথি খাচ্ছে যে (বাম পাশে)
      const victimSize = Math.floor(W * 0.20); 
      const victimX = Math.floor(W * 0.12);
      const victimY = Math.floor(H * 0.28);
      drawCircularAvatar(victimImg, victimX, victimY, victimSize);

      // 📌 ২. লাথি মারছে যে (ডান পাশে)
      const kickerSize = Math.floor(W * 0.19); 
      const kickerX = Math.floor(W * 0.65);
      const kickerY = Math.floor(H * 0.15);
      drawCircularAvatar(kickerImg, kickerX, kickerY, kickerSize);

      // ৭. ফাইল সেভ করা
      await fs.ensureDir(cacheFolder);
      cachePath = path.join(cacheFolder, `usta_${targetID}_${Date.now()}.png`);
      await fs.writeFile(cachePath, canvas.toBuffer("image/png"));

      // ৮. ফাইনাল টেক্সট ও ছবি সেন্ড
      const power = Math.floor(Math.random() * 100) + 1;
      const ustaText = 
`╔═══❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═══╗
🦶 ${targetName} - Usta Power: ${power}%
╚══════════════════╝`;

      await message.reply({
        body: ustaText,
        attachment: fs.createReadStream(cachePath)
      });

      // সাকসেস রিয়েকশন (✅)
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("✅", messageID, () => {}, true);
      }

      // টেম্পোরারি ফাইল রিমুভ
      if (fs.existsSync(cachePath)) {
        fs.unlinkSync(cachePath);
      }

    } catch (error) {
      console.error("[USTA COMMAND ERROR]:", error);

      // এরর রিয়েকশন (❌)
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
      }

      if (cachePath && fs.existsSync(cachePath)) {
        fs.unlinkSync(cachePath);
      }
      return message.reply("❌ পিকচার তৈরি করতে সমস্যা হয়েছে! দয়া করে আবার চেষ্টা করুন।");
    }
  }
};
