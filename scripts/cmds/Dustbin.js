const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

// 👑 বসের ইউজার আইডি
const BOSS_ID = "61592233286410";

module.exports = {
  config: {
    name: "dustbin",
    version: "5.1",
    author: "Tanbir Hosen",
    countDown: 5,
    role: 0,
    shortDescription: "Put someone in the dustbin",
    longDescription: "Funny dustbin meme generator with UID/Link & Boss protection support",
    category: "fun",
    guide: "{pn} @tag | reply | UID | profile link"
  },

  onStart: async function ({ api, event, args, usersData }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const cacheDir = path.join(__dirname, "tmp");

    try {
      // ------ Target user selection (Tag / Reply / UID / Link) ------
      let uid;
      let name = "User";
      const mentions = Object.keys(event.mentions || {});

      if (mentions.length > 0) {
        uid = mentions[0];
        name = (event.mentions[uid] || "").replace("@", "");
      } else if (event.type === "message_reply" || event.messageReply) {
        uid = event.messageReply.senderID;
      } else if (args && args[0]) {
        // UID অথবা প্রোফাইল লিংক থেকে আইডি এক্সট্রাক্ট করা
        const regexMatch = args[0].match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:profile\.php\?id=)?(\d+)/i) || args[0].match(/(\d+)/);
        if (regexMatch) {
          uid = regexMatch[1];
        } else {
          uid = args[0];
        }
      }

      if (!uid) {
        if (api && typeof api.setMessageReaction === "function") {
          api.setMessageReaction("❌", messageID, () => {}, true);
        }
        return api.sendMessage("⚠️ যাকে ডাস্টবিনে ফেলতে চান তাকে ট্যাগ করুন, মেসেজে রিপ্লাই দিন অথবা তার UID/Profile Link দিন!", threadID, messageID);
      }

      // 👑 বস প্রোটেকশন ফিল্টার (Boss Protection Check)
      if (uid === BOSS_ID) {
        if (api && typeof api.setMessageReaction === "function") {
          api.setMessageReaction("👑", messageID, () => {}, true);
        }
        return api.sendMessage(
          "🫨 তোর সাহস তো কম না 🙇‍♂️\nবসকে ডাস্টবিনে ফালাইতে চাস😆😤 কেমন থাপ্পর দিব বিটিভির মত ঝিরঝির করবি.!👋🏻🤬",
          threadID,
          messageID
        );
      }

      // প্রসেসিং রিয়েকশন (🗑️)
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("🗑️", messageID, () => {}, true);
      }

      // ইউজার নেম সেফ ফেচ
      if (usersData && typeof usersData.getName === "function") {
        try { name = await usersData.getName(uid); } catch (e) {}
      } else if (api && typeof api.getUserInfo === "function") {
        try {
          const info = await api.getUserInfo(uid);
          if (info[uid] && info[uid].name) name = info[uid].name;
        } catch (e) {}
      }

      // ------ Safe Buffer Downloader ------
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

      // ------ Download avatar with multi-fallback ------
      async function getAvatarBuffer(targetUid) {
        let token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
        if (api && typeof api.getAccessToken === "function") {
          try {
            const botToken = api.getAccessToken();
            if (botToken) token = botToken;
          } catch (e) {}
        }

        const urls = [
          `https://graph.facebook.com/v18.0/${targetUid}/picture?height=720&width=720&access_token=${token}`,
          `https://graph.facebook.com/${targetUid}/picture?height=720&width=720&access_token=${token}`,
          `https://graph.facebook.com/${targetUid}/picture?type=large&redirect=true`,
          `https://graph.facebook.com/${targetUid}/picture?width=500&height=500`
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
      }

      await fs.ensureDir(cacheDir);
      const avatarBuffer = await getAvatarBuffer(uid);

      // ------ Template check ------
      const templatePath = path.join(cacheDir, "dustbin.png");
      if (!fs.existsSync(templatePath)) {
        if (api && typeof api.setMessageReaction === "function") {
          api.setMessageReaction("❌", messageID, () => {}, true);
        }
        return api.sendMessage(
          "❌ Please put 'dustbin.png' in tmp folder!",
          threadID,
          messageID
        );
      }

      // ------ Canvas Load ------
      const template = await loadImage(templatePath);
      const avatar = await loadImage(avatarBuffer);

      const canvas = createCanvas(template.width, template.height);
      const ctx = canvas.getContext("2d");

      // Draw base template
      ctx.drawImage(template, 0, 0);

      // Draw circular avatar
      const size = 120;
      const x = 162;
      const y = 410;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, x, y, size, size);
      ctx.restore();

      // Export
      const outputPath = path.join(cacheDir, `dustbin_${uid}_${Date.now()}.png`);
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(outputPath, buffer);

      // Send Image
      api.sendMessage(
        {
          body: `😂 ${name} 🚮`,
          attachment: fs.createReadStream(outputPath)
        },
        threadID,
        () => {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
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
      api.sendMessage("⚠️ Error:\n" + (err.message || err), threadID, messageID);
      console.log(err);
    }
  }
};
