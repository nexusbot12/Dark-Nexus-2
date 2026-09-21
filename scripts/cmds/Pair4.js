const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { loadImage, createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "pair4",
    aliases: ["couple", "match5"],
    version: "2.9",
    author: "Tanbir Hosen",
    countDown: 5,
    role: 0,
    shortDescription: "💞 Romantic pairing with love stickers",
    longDescription:
      "ছেলে-মেয়ে অনুযায়ী জোড়া বানায় এবং রোমান্টিক ব্যাকগ্রাউন্ডে লাভ স্টিকার সহ সুন্দর ইমেজ তৈরি করে!",
    category: "love",
  },

  onStart: async function ({ api, event }) {
    try {
      const { threadID, senderID, mentions } = event;
      const threadInfo = await api.getThreadInfo(threadID);
      const members = threadInfo.userInfo;

      if (members.length < 2)
        return api.sendMessage("😢 Pair তৈরি করার জন্য অন্তত ২ জন দরকার!", threadID);

      const senderInfo = members.find((m) => m.id === senderID);
      const senderGender =
        senderInfo?.gender === 2
          ? "male"
          : senderInfo?.gender === 1
          ? "female"
          : "unknown";

      let user1 = senderID;
      let user2;

      if (Object.keys(mentions).length > 0) {
        user2 = Object.keys(mentions)[0];
      } else {
        let candidates;
        if (senderGender === "male") {
          candidates = members.filter((m) => m.id !== senderID && m.gender === 1);
        } else if (senderGender === "female") {
          candidates = members.filter((m) => m.id !== senderID && m.gender === 2);
        } else {
          candidates = members.filter((m) => m.id !== senderID);
        }

        if (candidates.length === 0)
          candidates = members.filter((m) => m.id !== senderID);

        user2 = candidates[Math.floor(Math.random() * candidates.length)].id;
      }

      const info = await api.getUserInfo([user1, user2]);
      const name1 =
        info[user1]?.name || members.find((m) => m.id === user1)?.name || `User ${user1}`;
      const name2 =
        info[user2]?.name || members.find((m) => m.id === user2)?.name || `User ${user2}`;

      const pic1 = (
        await axios.get(
          `https://graph.facebook.com/${user1}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer" }
        )
      ).data;
      const pic2 = (
        await axios.get(
          `https://graph.facebook.com/${user2}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer" }
        )
      ).data;

      const img1 = await loadImage(Buffer.from(pic1));
      const img2 = await loadImage(Buffer.from(pic2));

      const canvas = createCanvas(900, 500);
      const ctx = canvas.getContext("2d");

      const gradient = ctx.createLinearGradient(0, 0, 900, 500);
      gradient.addColorStop(0, "#ff9a9e");
      gradient.addColorStop(0.5, "#fad0c4");
      gradient.addColorStop(1, "#fbc2eb");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 900, 500);

      const heartEmojis = ["💖", "💘", "💞", "💕", "💓"];
      ctx.font = "40px Sans";
      for (let i = 0; i < 25; i++) {
        const x = Math.random() * 850;
        const y = Math.random() * 450;
        const emoji = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
        ctx.globalAlpha = 0.3;
        ctx.fillText(emoji, x, y);
      }
      ctx.globalAlpha = 1.0;

      const lovePercent = Math.floor(Math.random() * 51) + 50;

      ctx.save();
      ctx.beginPath();
      ctx.arc(225, 245, 120, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img1, 105, 125, 240, 240);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(675, 245, 120, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img2, 555, 125, 240, 240);
      ctx.restore();

      ctx.font = "bold 60px Sans";
      const loveText = "LOVE";
      const textWidth = ctx.measureText(loveText).width;
      ctx.shadowColor = "rgba(255,0,100,0.6)";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#ff0040";
      ctx.fillText(loveText, (900 - textWidth) / 2, 260);
      ctx.shadowBlur = 0;

      ctx.font = "26px Sans";
      ctx.fillStyle = "#fff";
      ctx.fillText(name1, 150, 440);
      ctx.fillText(name2, 620, 440);

      ctx.font = "30px Sans";
      ctx.fillStyle = "#ff0040";
      ctx.fillText(`💞 Love Match: ${lovePercent}%`, 340, 480);

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
      const imgPath = path.join(cacheDir, `pair_${Date.now()}.png`);
      fs.writeFileSync(imgPath, canvas.toBuffer());

      await api.sendMessage(
        {
          body: `╔══❰ 𝐃𝐀𝐑𝐊•𝐍𝐄𝐗𝐔𝐒 ❱══╗
\n\n		🤍 𝗟 𝗢 𝗩 𝗘   𝗠 𝗔 𝗧 𝗖 𝗛 🤍 \n\n	
	🎀 ${name1}         \n\n		🎀 ${name2}                     \n\n		💗 Love Match: ${lovePercent}% ❤️‍🔥                    \n\n
🤴🏻𝐂𝐑𝐄𝐀𝐓𝐎𝐑:➤𝐓A̶𝙽𝙱𝕚𝗥_☜۵༎࿐
╚════════════════╝`,
          attachment: fs.createReadStream(imgPath),
        },
        threadID
      );

      setTimeout(() => fs.unlinkSync(imgPath), 10000);
    } catch (e) {
      console.error(e);
      api.sendMessage("❌ কিছু একটা সমস্যা হয়েছে! আবার চেষ্টা করো।", event.threadID);
    }
  },
};

