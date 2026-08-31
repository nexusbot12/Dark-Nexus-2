const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

// 👑 বসের ইউজার আইডি
const BOSS_ID = "61591685889830";

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
    name: "bonk",
    aliases: ["bari"],
    version: "2.1",
    author: "Aphelion | rewrite by Muzan & Rasel Mahmud",
    shortDescription: "Bonk someone",
    longDescription: "Make a BONK meme using two avatars with UID/Link & Boss protection support",
    category: "fun",
  },

  circleCrop: async function (buffer, size) {
    const img = await loadImage(buffer);
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(img, 0, 0, size, size);
    return canvas;
  },

  makeImage: async function (one, two, api) {
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    const bgURL = "https://i.postimg.cc/KYJ0VnK0/image0.png";
    const bgBuffer = await fetchBuffer(bgURL);
    const bg = await loadImage(bgBuffer);

    const width = 640;
    const height = 480;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(bg, 0, 0, width, height);

    const avtOne = await fetchAvatar(one, api);
    const avtTwo = await fetchAvatar(two, api);

    const circle1 = await this.circleCrop(avtOne, 110); // PFP 1 -> size 110 (Sender)
    const circle2 = await this.circleCrop(avtTwo, 90);  // PFP 2 -> size 90 (Target)

    // Swap positions
    ctx.drawImage(circle1, 60, 150); // Sender goes to hitting position
    ctx.drawImage(circle2, 500, 220);  // Target goes to bonked position

    const outPath = path.join(cacheDir, `bonk_${one}_${two}_${Date.now()}.png`);
    await fs.writeFile(outPath, canvas.toBuffer("image/png"));
    return outPath;
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;

    try {
      let targetID;

      // ১. টার্গেট নির্বাচন (Tag / Reply / UID / Profile Link)
      if (messageReply?.senderID) {
        targetID = messageReply.senderID;
      } else if (mentions && Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
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
        return api.sendMessage("⚠ যাকে বাড়ি দিতে চান তাকে Reply, Mention বা UID/Profile Link দিন।", threadID, messageID);
      }

      if (targetID === senderID) {
        if (api && typeof api.setMessageReaction === "function") {
          api.setMessageReaction("❌", messageID, () => {}, true);
        }
        return api.sendMessage("😂 নিজেকে বাড়ি দেওয়া নিষেধ!", threadID, messageID);
      }

      // 👑 ২. বস প্রোটেকশন ফিল্টার (Boss Protection Check)
      if (targetID === BOSS_ID) {
        if (api && typeof api.setMessageReaction === "function") {
          api.setMessageReaction("👑", messageID, () => {}, true);
        }
        return api.sendMessage(
          "🛑 থামেন ভাই! ইনি আমার বস 🙇‍♂️\nবসকে বাড়ি দেওয়ার স্পর্ধা কার? বসকে সম্মান দিয়ে চলেন! 👑✨",
          threadID,
          messageID
        );
      }

      // প্রসেসিং রিয়েকশন (🔨)
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("🔨", messageID, () => {}, true);
      }

      const one = senderID;
      const two = targetID;

      // টার্গেট আইডির নাম বের করা
      let targetName = "User";
      if (usersData && typeof usersData.getName === "function") {
        try { targetName = await usersData.getName(targetID); } catch (e) {}
      } else if (api && typeof api.getUserInfo === "function") {
        try {
          const userInfo = await api.getUserInfo(targetID);
          if (userInfo[targetID]?.name) targetName = userInfo[targetID].name;
        } catch (e) {}
      }

      if (targetName === "User" && mentions && mentions[targetID]) {
        targetName = mentions[targetID].replace("@", "");
      }

      const file = await this.makeImage(one, two, api);

      // মেসেজ ও ছবি পাঠানো
      api.sendMessage(
        {
          body: `${targetName} bonk 🪓😂`,
          attachment: fs.createReadStream(file),
        },
        threadID,
        () => {
          if (fs.existsSync(file)) fs.unlinkSync(file);
        },
        messageID
      );

      // সাকসেস রিয়েকশন (✅)
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("✅", messageID, () => {}, true);
      }

    } catch (err) {
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("❌", messageID, () => {}, true);
      }
      api.sendMessage("❌ Error: " + (err.message || err), threadID, messageID);
    }
  },
};
