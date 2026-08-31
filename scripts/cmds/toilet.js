const axios = require("axios");
const fs = require("fs");
const path = require("path");

// 👑 বসের ইউজার আইডি
const BOSS_ID = "61591685889830";

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

/**
* @author MahMUD
* @author: do not delete it
*/

module.exports = {
  config: {
    name: "toilet",
    version: "1.8",
    author: "MahMUD",
    role: 0,
    category: "fun",
    cooldown: 10,
    guide: "[mention/reply/UID]",
  },

  onStart: async function({ api, event, args }) {
    const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68); 
    if (module.exports.config.author !== obfuscatedAuthor) {
      return api.sendMessage(
        "You are not authorized to change the author name.\n", 
        event.threadID, 
        event.messageID
      );
    }

    const { senderID, mentions, threadID, messageID, messageReply } = event;
    let id;

    // ১. টার্গেট আইডি নির্বাচন
    if (Object.keys(mentions).length > 0) {
      id = Object.keys(mentions)[0];
    } else if (messageReply) {
      id = messageReply.senderID;
    } else if (args[0]) {
      id = args[0]; 
    } else {
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("❌", messageID, () => {}, true);
      }
      return api.sendMessage(
        "❌ Mention, reply, or give UID to make toilet someone",
        threadID,
        messageID
      );
    }

    // 👑 ২. বস প্রোটেকশন ফিল্টার (Boss Protection Check)
    if (id === BOSS_ID) {
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("👑", messageID, () => {}, true);
      }
      return api.sendMessage(
        "🛑 থামেন ভাই! ইনি আমার বস 🙇‍♂️\nবসের ছবি দিয়ে টয়লেট বানানো নিষেধ, বসকে সম্মান দিয়ে চলেন! 👑✨",
        threadID,
        messageID
      );
    }

    // প্রসেসিং রিয়েকশন (🚽)
    if (api && typeof api.setMessageReaction === "function") {
      api.setMessageReaction("🚽", messageID, () => {}, true);
    }

    try {
      const apiUrl = await baseApiUrl();
      const url = `${apiUrl}/api/toilet?user=${id}`;

      const response = await axios.get(url, { responseType: "arraybuffer" });
      const filePath = path.join(__dirname, `toilet_${id}.png`);
      fs.writeFileSync(filePath, response.data);
      
      api.sendMessage(
        { attachment: fs.createReadStream(filePath), body: "ওয়াক থু 🤮" },
        threadID,
        () => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        },
        messageID
      );

      // সাকসেস রিয়েকশন (✅)
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("✅", messageID, () => {}, true);
      }

    } catch (err) {
      // এরর রিয়েকশন (❌)
      if (api && typeof api.setMessageReaction === "function") {
        api.setMessageReaction("❌", messageID, () => {}, true);
      }
      api.sendMessage(`🥹 error, contact MahMUD.`, threadID, messageID);
    }
  }
};
