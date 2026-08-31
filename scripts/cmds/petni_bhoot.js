const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// 🔑 Access Token & URLs
const ACCESS_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
const PETNI_URL = "https://i.imgur.com/GqUNotu.jpeg"; // মেয়ে
const BHOOT_URL = "https://i.imgur.com/FQtJShZ.jpeg";  // ছেলে

module.exports = {
  config: {
    name: "petni_bhoot",
    aliases: ["petni", "pentni", "bhoot"],
    version: "1.2.0",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: "Funny Ghost Meme",
    longDescription: "Creates a funny ghost meme based on user input (petni/pentni/bhoot).",
    category: "fun",
    usages: "petni [mention/reply] / bhoot [mention/reply]"
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageReply, mentions, messageID } = event;
    const tempPath = path.join(__dirname, `temp_ghost_${Date.now()}.png`);
    let processingMsg = null;

    try {
      // ১. কমান্ডের ধরণ চেক করা (petni/pentni/bhoot)
      const body = event.body.toLowerCase();
      let bgUrl = "";
      let type = "";

      if (body.includes("petni") || body.includes("pentni")) {
        bgUrl = PETNI_URL;
        type = "Petni";
      } else if (body.includes("bhoot")) {
        bgUrl = BHOOT_URL;
        type = "Bhoot";
      } else {
        return api.sendMessage("❌ Please use:\n/petni [mention/reply]\nor\n/bhoot [mention/reply]", threadID, messageID);
      }

      // ২. টার্গেট আইডি বের করা
      let targetID = null;
      if (event.type === "message_reply") {
        targetID = event.messageReply.senderID;
      } else if (mentions && Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
      } else if (args[0]) {
        const match = args[0].match(/(?:id=|\/|^)(\d{6,})/);
        targetID = match ? match[1] : (/^\d+$/.test(args[0]) ? args[0] : null);
      }

      if (!targetID) {
        return api.sendMessage(`⚠️ Who do you want to turn into a ${type}? Tag them or reply!`, threadID, messageID);
      }

      // ৩. প্রসেসিং
      processingMsg = await api.sendMessage("⏳ Generating ghost meme... please wait!", threadID, messageID);

      const bgBuffer = await downloadBuffer(bgUrl);
      const avatarBuffer = await downloadAvatar(targetID);

      if (!bgBuffer) throw new Error("Could not download background!");
      
      const bgImg = await loadImage(bgBuffer);
      const userImg = avatarBuffer ? await loadImage(avatarBuffer) : null;

      // ৪. ক্যানভাস সেটআপ
      const canvas = createCanvas(bgImg.width, bgImg.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height);

      // ৫. প্রোফাইল পিকচার বসানো
      if (userImg) {
        const centerX = bgImg.width * 0.50; 
        const centerY = bgImg.height * 0.25; 
        const radius = bgImg.width * 0.15;

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(userImg, centerX - radius, centerY - radius, radius * 2, radius * 2);
        ctx.restore();
      }

      // ৬. সেভ ও সেন্ড
      const buffer = canvas.toBuffer("image/png");
      await fs.writeFile(tempPath, buffer);

      await api.sendMessage(
        { body: `👻 Watch out! ${type} detected!`, attachment: fs.createReadStream(tempPath) },
        threadID,
        () => {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          if (processingMsg && processingMsg.messageID) api.unsendMessage(processingMsg.messageID);
        },
        messageID
      );

    } catch (e) {
      console.error(e);
      if (processingMsg && processingMsg.messageID) api.unsendMessage(processingMsg.messageID);
      api.sendMessage("❌ Error generating the image!", threadID, messageID);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
  }
};

// 🛠️ Helpers
async function downloadAvatar(userID) {
  try {
    const res = await axios.get(`https://graph.facebook.com/${userID}/picture?width=500&height=500&access_token=${ACCESS_TOKEN}`, { responseType: "arraybuffer", timeout: 6000, headers: { "User-Agent": "Mozilla/5.0" } });
    return Buffer.from(res.data, "binary");
  } catch (_) { return null; }
}

async function downloadBuffer(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 10000, headers: { "User-Agent": "Mozilla/5.0" } });
    return Buffer.from(res.data, "binary");
  } catch (_) { return null; }
}
