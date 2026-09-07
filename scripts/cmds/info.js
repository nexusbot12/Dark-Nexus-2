const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "info",
    aliases: ["owner", "botadmin", "creator", "dev"],
    version: "2.0",
    author: "Tanbir Hosen",
    countDown: 3,
    role: 0,
    shortDescription: "Show bot owner information",
    longDescription: "Displays detailed information about the bot's creator",
    category: "info",
    guide: {
      en: "{pn} or {pn} owner"
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    
    try {
      // Create beautiful information box
      const message = 
        `═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱════
​◤───── ☆. 👑 .☆ ─────◥
        [    𝐌𝐘 𝐈𝐃𝐄𝐍𝐓𝐈𝐓𝐘   ]
​◢  𝐍𝐚𝐦𝐞 :𝐌𝐃 𝐓𝐚𝐧𝐛𝐢𝐫 𝐇𝐨𝐬𝐞𝐧 😇
◢  𝐁𝐚𝐬𝐚 :  𝐒𝐮𝐧𝐚𝐦𝐠𝐚𝐧𝐣 🛖
◢  𝐀𝐠𝐞   : 𝟏𝟗😉
◢ 𝐑𝐞𝐥𝐢𝐠𝐢𝐨𝐧: 𝐈𝐬𝐥𝐚𝐦 🕋🕌
◢  𝐑𝐥𝐬   : 𝐒𝐢𝐧𝐠𝐥𝐞 𝐩𝐫𝐨 𝐦𝐚𝐱🥱🥹
◢ 𝐁𝐨𝐫𝐭𝐨𝐦𝐚𝐧: 𝐓𝐫𝐚𝐝𝐞𝐫📊🕰️
◢  𝐇𝐨𝐛𝐛𝐲 : 𝐭𝐤💸🕰️
◢  𝐋𝐨𝐯𝐞 : 𝟏𝟎% 😩
◢  𝐑𝐮𝐝𝐞𝐧𝐬𝐬 : 𝐉𝐚𝐫 𝐬𝐚𝐭𝐡𝐞 𝐣𝐞𝐭𝐚 𝐣𝐚𝐲🙂‍↔️🫂
◢  𝐁𝐥𝐨𝐨𝐝 : 𝐁.. 𝐏𝐨𝐬𝐢𝐭𝐢𝐯𝐞 💉
𝐑 𝐤𝐢𝐜𝐡𝐮 𝐣𝐚𝐧𝐭𝐞 𝐜𝐚𝐢𝐥𝐞 𝐛𝐨𝐥𝐛𝐞𝐧🤺
​◤──── ☆. 👑 .☆ ──────◥`;
      
      // Get profile picture
      const imgURL = "https://graph.facebook.com/61592233286410/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
      const path = __dirname + "/cache/owner_info.jpg";
      
      // Create cache directory if not exists
      const cacheDir = __dirname + "/cache";
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      
      // Download profile picture
      try {
        const response = await axios({
          method: "GET",
          url: imgURL,
          responseType: "arraybuffer",
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        });
        
        // Save image to cache
        fs.writeFileSync(path, Buffer.from(response.data, "binary"));
        
        // Send message with image
        await api.sendMessage({
          body: message,
          attachment: fs.createReadStream(path)
        }, threadID, messageID);
        
        // Add reaction
        api.setMessageReaction("✅", messageID, () => {}, true);
        
        // Cleanup after 5 seconds
        setTimeout(() => {
          try {
            if (fs.existsSync(path)) {
              fs.unlinkSync(path);
            }
          } catch (e) {
            console.error("Cleanup error:", e);
          }
        }, 5000);
        
      } catch (imgError) {
        console.error("Image download error:", imgError);
        
        // Send text-only message if image fails
        await api.sendMessage({
          body: message + "\n\n⚠️ Could not load profile picture"
        }, threadID, messageID);
        
        api.setMessageReaction("⚠️", messageID, () => {}, true);
      }
      
    } catch (error) {
      console.error("Info command error:", error);
      
      const errorMessage = 
        `╔════❰ 𝐃𝐀𝐑𝐊•𝐍𝐄𝐗𝐔𝐒 ❱════╗\n` +
        `         ❌ 𝐄𝐑𝐑𝐎𝐑\n\n` +
        `Failed to load owner information.\n\n` +
        `🔄 Please try again\n` +
        `👑 Developer: Tanbir Hosen\n` +
        `🔗 https://www.facebook.com/profile.php?id=61591685889830\n` +
        `╚═══════════════════╝`;
      
      await api.sendMessage(errorMessage, threadID, messageID);
    }
  }
};
