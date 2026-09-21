const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

const baseUrl = "https://raw.githubusercontent.com/Saim12678/Saim69/1a8068d7d28396dbecff28f422cb8bc9bf62d85f/font";

module.exports = {
  config: {
    name: "pair5",
    aliases: ["lovepair5", "match5"],
    author: "Tanbir Hosen",
    version: "1.5",
    role: 0,
    category: "love",
    shortDescription: {
      en: "💞 Generate a love match with avatars"
    },
    longDescription: {
      en: "Calculates a love match with custom avatars using high-success rate profile image fetcher."
    },
    guide: {
      en: "{p}{n} — Use this command in a group to find a love match"
    }
  },

  onStart: async function ({ api, event, usersData }) {
    const tempFilePath = path.join(__dirname, `pair_${event.senderID}_${Date.now()}.png`);

    try {
      const senderData = await usersData.get(event.senderID);
      let senderName = senderData?.name || "User";

      const threadData = await api.getThreadInfo(event.threadID);
      const users = threadData.userInfo || [];

      const myData = users.find(user => user.id === event.senderID);
      if (!myData || !myData.gender) {
        return api.sendMessage("⚠️ Could not determine your gender.", event.threadID, event.messageID);
      }

      const myGender = String(myData.gender).toUpperCase();
      let matchCandidates = [];

      if (myGender === "MALE") {
        matchCandidates = users.filter(user => String(user.gender).toUpperCase() === "FEMALE" && user.id !== event.senderID);
      } else if (myGender === "FEMALE") {
        matchCandidates = users.filter(user => String(user.gender).toUpperCase() === "MALE" && user.id !== event.senderID);
      } else {
        return api.sendMessage("⚠️ Your gender is undefined. Cannot find a match.", event.threadID, event.messageID);
      }

      if (matchCandidates.length === 0) {
        return api.sendMessage("❌ No suitable match found in the group.", event.threadID, event.messageID);
      }

      const selectedMatch = matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
      let matchName = selectedMatch.name || "Match";

      // Font Conversion
      let fontMap = {};
      try {
        const { data } = await axios.get(`${baseUrl}/21.json`, { timeout: 5000 });
        fontMap = data || {};
      } catch (e) {
        console.error("Font load error:", e.message);
      }

      const convertFont = (text) =>
        text.split("").map(ch => fontMap[ch] || ch).join("");

      senderName = convertFont(senderName);
      matchName = convertFont(matchName);

      // Advanced Profile Picture Fetcher
      async function getAvatar(uid) {
        // Try getting avatar URL directly from bot's internal usersData first
        try {
          const uData = await usersData.get(uid);
          if (uData && uData.avatarUrl) {
            const res = await axios.get(uData.avatarUrl, { responseType: "arraybuffer", timeout: 5000 });
            return await loadImage(Buffer.from(res.data));
          }
        } catch (e) {}

        // Fallback options
        const endpoints = [
          `https://graph.facebook.com/${uid}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          `https://graph.facebook.com/${uid}/picture?type=large`,
          `https://wsrv.nl/?url=https://graph.facebook.com/${uid}/picture?type=large`
        ];

        for (const url of endpoints) {
          try {
            const res = await axios.get(url, { responseType: "arraybuffer", timeout: 6000 });
            if (res.data && res.data.length > 2500) {
              return await loadImage(Buffer.from(res.data));
            }
          } catch (err) {
            continue;
          }
        }

        // Standard avatar placeholder
        return await loadImage("https://i.ibb.co/C0382M7/avatar-placeholder.png");
      }

      const width = 800;
      const height = 400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const bgUrl = "https://files.catbox.moe/29jl5s.jpg";
      const [background, sIdImage, pairPersonImage] = await Promise.all([
        loadImage(bgUrl),
        getAvatar(event.senderID),
        getAvatar(selectedMatch.id)
      ]);

      ctx.drawImage(background, 0, 0, width, height);

      function drawCircle(ctx, img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      // Draw inside flower frames
      drawCircle(ctx, sIdImage, 385, 40, 170);
      drawCircle(ctx, pairPersonImage, width - 213, 190, 170);

      const buffer = canvas.toBuffer("image/png");
      await fs.promises.writeFile(tempFilePath, buffer);

      const lovePercent = Math.floor(Math.random() * 31) + 70;

      const message = `💞 𝗠𝗮𝘁𝗰𝗵𝗺𝗮𝗸𝗶𝗻𝗴 𝗖𝗼𝗺𝗽𝗹𝗲𝘁𝗲 💞
                                                 ━━━━━━━━━━━━━━━━━
🎀  ${senderName} 👩‍❤️‍👨
🎀  ${matchName} 👫

𝔽𝕚𝕘𝕙𝕥𝕚𝕟𝕘 𝘞𝘪𝘵𝘩 𝗬𝗼𝘂, ʙᴜᴛ S̤ṳr̤v̤i̤v̤i̤n̤g̤ 𝐎𝐧𝐥𝐲 Y̶𝖔ꪊ.. 😌🌷

                💘 𝙲𝚘𝚖𝚙𝚊𝚝𝚒𝚋𝚒𝚕𝚒𝚝𝚢: ${lovePercent}% 💘

🤴🏻𝐂𝐫𝐞𝐚𝐭𝐨𝐫:☜𝐓𝐚𝐧𝐛𝐢𝐫 𝐇𝐨𝐬𝐞𝐧_۵
 ━━━━━━━━━━━━━━━━━`;

      await api.sendMessage(
        {
          body: message,
          attachment: fs.createReadStream(tempFilePath),
        },
        event.threadID,
        event.messageID
      );

    } catch (error) {
      console.error("Pair error:", error);
      api.sendMessage("❌ An error occurred: " + error.message, event.threadID, event.messageID);
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlink(tempFilePath, () => {});
      }
    }
  },
};
