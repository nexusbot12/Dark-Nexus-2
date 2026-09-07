const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

// 👑 বসের ইউজার আইডি
const BOSS_ID = "61592233286410";

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

// প্রোফাইল পিকচার ফেচিং ফাংশন (Fixes Blank/Private Avatar)
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
    name: 'dim',
    aliases: ['anda'],
    version: '2.2',
    author: 'Tanbir Hosen',
    role: 0,
    category: 'fun',
    shortDescription: 'Turn someone into dim meme',
    longDescription: 'Funny dim meme with avatar on egg head with UID/Link & Boss protection support',
    guide: '{pn} @mention / reply / UID / Profile Link'
  },

  onStart: async function ({ event, api, args, message, usersData }) {
    const { messageID } = event;

    try {
      let targetID;
      const mentions = Object.keys(event.mentions || {});

      // ১. টার্গেট নির্বাচন (Tag / Reply / UID / Profile Link)
      if (mentions.length > 0) {
        targetID = mentions[0];
      } else if (event.messageReply) {
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
        return message.reply('🔹 কাউকে mention, reply অথবা UID/Profile Link দাও!');
      }

      if (targetID === event.senderID) {
        if (api && typeof api.setMessageReaction === "function") {
          api.setMessageReaction("❌", messageID, () => {}, true);
        }
        return message.reply('😂 নিজেকে dim বানানো নিষেধ!');
      }

      // 👑 ২. বস প্রোটেকশন ফিল্টার (Boss Protection Check)
      if (targetID === BOSS_ID) {
        if (api && typeof api.setMessageReaction === "function") {
          api.setMessageReaction("👑", messageID, () => {}, true);
        }
        return message.reply("🛑 বেয়াদব তুই জানোস না এটা আমার বস🫡🙇‍♂️\nবসকে ডিম বানানোর স্পর্ধা কই থেকে আসলো তোর,😾 বসকে সম্মান দিতে হয় বুঝলি বোকা চন্দ্রবিন্দু.!😒😤");
      }

      // প্রসেসিং রিয়েকশন (🥚)
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("🥚", messageID, () => {}, true);
      }

      // ৩. অবতার লোড
      const avatarBuffer = await fetchAvatar(targetID, api);
      const avatar = await loadImage(avatarBuffer);

      // ৪. ব্যাকগ্রাউন্ড লোড
      const cacheDir = path.join(__dirname, 'cache', 'dim');
      await fs.ensureDir(cacheDir);
      const bgPath = path.join(cacheDir, 'bg.jpg');

      let bg;
      if (!fs.existsSync(bgPath)) {
        const bgData = await fetchBuffer('https://i.postimg.cc/Wbt5GLY7/5674fba3a393f7578a73919569b5147f.jpg');
        await fs.writeFile(bgPath, bgData);
        bg = await loadImage(bgData);
      } else {
        bg = await loadImage(await fs.readFile(bgPath));
      }

      // ৫. ক্যানভাসে ছবি ও টেক্সট ড্র করা
      const canvas = createCanvas(bg.width, bg.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bg, 0, 0);

      // ডিমের মাথার ওপর অবতারের পজিশন
      const size = 150;
      const x = 100;  
      const y = 60;   

      // সার্কুলার ক্লিপিং + শ্যাডো + অবতার ড্র
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.clip();
      ctx.drawImage(avatar, x, y, size, size);
      ctx.restore();

      // সাদা বর্ডার
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2 + 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 5;
      ctx.stroke();

      // নিচের ফানি টেক্সট
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;

      const text = 'PURE DIM 😂';
      ctx.strokeText(text, bg.width / 2, bg.height - 40);
      ctx.fillText(text, bg.width / 2, bg.height - 40);

      // ৬. সেভ ইমেজ
      const output = path.join(cacheDir, `${targetID}_${Date.now()}.png`);
      await fs.writeFile(output, canvas.toBuffer());

      // ইউজার নেম ফেচিং
      let name = 'Someone';
      if (usersData && typeof usersData.getName === "function") {
        try { name = await usersData.getName(targetID); } catch (e) {}
      } else if (api && typeof api.getUserInfo === "function") {
        try {
          const info = await api.getUserInfo(targetID);
          if (info[targetID]?.name) name = info[targetID].name;
        } catch (e) {}
      }

      // ৭. মেমে রিপ্লাই পাঠানো
      await message.reply({
        body: `🥚🤣 ${name} এখন একদম DIM LEVEL MAX!`,
        mentions: [{ tag: name, id: targetID }],
        attachment: fs.createReadStream(output)
      });

      // সাকসেস রিয়েকশন (✅)
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("✅", messageID, () => {}, true);
      }

      // ক্লিনআপ
      setTimeout(() => fs.unlink(output).catch(() => {}), 5000);

    } catch (e) {
      console.error(e);
      // এরর রিয়েকশন (❌)
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
      }
      message.reply('❌ Dim বানাতে সমস্যা হয়েছে!');
    }
  }
};
