const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// 🔑 Facebook Access Token & Background URL
const ACCESS_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
const BG_URL = "https://i.imgur.com/jWloHze.jpeg";

const config = {
  name: "vag",
  version: "2.5.0",
  hasPermssion: 0,
  credits: "Rasel Mahmud",
  description: "Create a funny running couple meme",
  commandCategory: "fun",
  usages: "[mention/reply/UID/link]",
  cooldowns: 5
};

async function handleCommand({ api, event, args }) {
  const { threadID, senderID, messageReply, mentions, messageID } = event;
  const tempPath = path.join(__dirname, `temp_vag_${Date.now()}.png`);
  let processingMsg = null;

  try {
    // 🎯 ১. টার্গেট মেয়ে (Girl ID) বের করা (Mention/Reply/UID/Link)
    let girlID = null;
    if (mentions && Object.keys(mentions).length > 0) {
      girlID = Object.keys(mentions)[0];
    } else if (messageReply) {
      girlID = messageReply.senderID;
    } else if (args[0]) {
      if (/^\d+$/.test(args[0])) {
        girlID = args[0];
      } else {
        const match = args[0].match(/(?:id=|\/|^)(\d{6,})/);
        if (match) girlID = match[1];
      }
    }

    if (!girlID) {
      return api.sendMessage("⚠️ কাকে ভাগাইতে চান তাকে মেনশন, রিপ্লাই বা তার ইউআইডি/লিংক দিন!", threadID, messageID);
    }

    const boyID = senderID; // কমান্ড যে দিচ্ছে সে ছেলে

    // ⏳ ২. প্রসেসিং মেসেজ/রিয়েকশন
    api.setMessageReaction("⏳", messageID, () => {}, true);

    // 🖼️ ৩. ছবি ও অ্যাভাটার ডাউনলোড
    const bgBuffer = await downloadBuffer(BG_URL);
    const girlAvatarBuffer = await downloadAvatar(girlID);
    const boyAvatarBuffer = await downloadAvatar(boyID);

    if (!bgBuffer) throw new Error("ব্যাকগ্রাউন্ড ডাউনলোড করা সম্ভব হয়নি!");

    const bgImg = await loadImage(bgBuffer);
    const girlImg = girlAvatarBuffer ? await loadImage(girlAvatarBuffer) : null;
    const boyImg = boyAvatarBuffer ? await loadImage(boyAvatarBuffer) : null;

    // 🎨 ৪. ক্যানভাস সেটআপ
    const canvas = createCanvas(bgImg.width, bgImg.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height);

    // 📍 5. মেয়ের প্রোফাইল পিকচার (পিছনের মেয়ের মাথার উপর)
    if (girlImg) {
      const girlX = bgImg.width * 0.22;
      const girlY = bgImg.height * 0.17;
      const girlRadius = bgImg.width * 0.08;

      ctx.save();
      ctx.beginPath();
      ctx.arc(girlX, girlY, girlRadius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(girlImg, girlX - girlRadius, girlY - girlRadius, girlRadius * 2, girlRadius * 2);
      ctx.restore();
    }

    // 📍 6. ছেলের প্রোফাইল পিকচার (সামনের ছেলের মাথার উপর)
    if (boyImg) {
      const boyX = bgImg.width * 0.54;
      const boyY = bgImg.height * 0.40;
      const boyRadius = bgImg.width * 0.09;

      ctx.save();
      ctx.beginPath();
      ctx.arc(boyX, boyY, boyRadius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(boyImg, boyX - boyRadius, boyY - boyRadius, boyRadius * 2, boyRadius * 2);
      ctx.restore();
    }

    // 💾 ৭. ফাইনাল ইমেজ সেভ
    const buffer = canvas.toBuffer("image/png");
    await fs.writeFile(tempPath, buffer);

    // 🔤 ইউজারদের নামের আদ্যক্ষর সংগ্রহ
    let boyName = "B", girlName = "G";
    try {
      const usersInfo = await api.getUserInfo([boyID, girlID]);
      boyName = usersInfo[boyID]?.name || "B";
      girlName = usersInfo[girlID]?.name || "G";
    } catch (_) {}

    const boyInitial = boyName.charAt(0).toUpperCase();
    const girlInitial = girlName.charAt(0).toUpperCase();

    // 📤 ৮. মেসেজ পাঠানো
    await api.sendMessage(
      { 
        body: `😰 লুচ্চা আসতেছে পালাও 🏃‍♂️ ${boyInitial} + ${girlInitial}`, 
        attachment: fs.createReadStream(tempPath) 
      },
      threadID,
      () => {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        api.setMessageReaction("✅", messageID, () => {}, true);
      },
      messageID
    );

  } catch (e) {
    console.error("Vag Command Error:", e);
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage("❌ ছবি তৈরি করতে সমস্যা হয়েছে!", threadID, messageID);
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

// 🛠️ দুই ধরণের ফ্রেমওয়ার্ক সাপোর্ট করার জন্য Export
module.exports = {
  config,
  onStart: handleCommand,
  run: handleCommand,
  onLoad: async () => {
    const dir = path.join(__dirname, "cache");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
};

// 🛠️ Helpers
async function downloadAvatar(userID) {
  try {
    const url = `https://graph.facebook.com/${userID}/picture?width=500&height=500&access_token=${ACCESS_TOKEN}`;
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 6000, headers: { "User-Agent": "Mozilla/5.0" } });
    return Buffer.from(res.data, "binary");
  } catch (_) { return null; }
}

async function downloadBuffer(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 10000, headers: { "User-Agent": "Mozilla/5.0" } });
    return Buffer.from(res.data, "binary");
  } catch (_) { return null; }
  }
