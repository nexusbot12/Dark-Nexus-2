const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const Jimp = require("jimp-compact");

module.exports = {
  config: {
    name: "iloveyou",
    version: "1.6",
    author: "Tanbir Hosen",
    countDown: 5,
    role: 0,
    shortDescription: "Create I Love You couple photo",
    category: "love"
  },

  onStart: async function ({ api, event }) {
    try {
      const mentions = event.mentions || {};
      const mentionIds = Object.keys(mentions);

      if (!mentionIds.length && !event.messageReply)
        return api.sendMessage("⚠️ Please tag someone or reply to a message!", event.threadID);

      const boyID = event.senderID;
      const girlID = mentionIds.length ? mentionIds[0] : event.messageReply.senderID;
      const tmpDir = path.join(__dirname, "tmp");
      fs.ensureDirSync(tmpDir);

      const boyPath = path.join(tmpDir, `boy_${boyID}.png`);
      const girlPath = path.join(tmpDir, `girl_${girlID}.png`);
      const finalPath = path.join(tmpDir, `iloveyou_final_${Date.now()}.png`);

      // ---------- Avatar Downloader ----------
      async function downloadAvatar(uid, savePath) {
        try {
          const avatarUrl = `https://graph.facebook.com/${uid}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
          const res = await axios.get(avatarUrl, { responseType: "arraybuffer" });
          fs.writeFileSync(savePath, res.data);
        } catch (e) {
          const blank = await Jimp.create(512, 512, 0xffffffff);
          await blank.writeAsync(savePath);
        }
      }

      await downloadAvatar(boyID, boyPath);
      await downloadAvatar(girlID, girlPath);

      // ---------- Read Background & Avatars ----------
      const bg = await Jimp.read("https://i.imgur.com/yzLaLIO.jpeg");
      let boy = await Jimp.read(boyPath);
      let girl = await Jimp.read(girlPath);

      // ---------- Perfect Alignment ----------
      const profileSize = Math.round(bg.bitmap.width * 0.27);
      boy.resize(profileSize, profileSize).circle();
      girl.resize(profileSize, profileSize).circle();

      // পজিশন আরেকটু ডানে-বাঁয়ে গ্যাপ দিয়ে পারফেক্ট সেন্টারে বসানো হয়েছে
      const boyX = Math.round(bg.bitmap.width * 0.150);
      const girlX = Math.round(bg.bitmap.width * 0.575);
      const finalY = Math.round(bg.bitmap.height * 0.365); 

      bg.composite(boy, boyX, finalY);
      bg.composite(girl, girlX, finalY);

      // ---------- Random Love Percent ----------
      const lovePercent = Math.floor(Math.random() * 101);

      // ---------- Final Text ----------
      const loveText = `╔══❰ 𝐃𝐀𝐑𝐊•𝐍𝐄𝐗𝐔𝐒 ❱══╗
  
🎀${lovePercent}%💞 [🅘︎🅛︎🅞︎🅥︎🅔︎🅨︎🅞︎🅨︎]
  ─━─━─━─━─━─━─━─
┃ ⬤ ছিড়ে যাক সেলোয়ার..🤧
┃ ⬤ উড়ে যাক লুঙ্গি.. 😑
┃ ⬤ তুমি কি হবে.. 🥹
┃ ⬤ আমার ভালোবাসার সঙ্গী🫂
┗─━─━─━─━─━─━─━─
🫅🏻𝐀𝐮𝐭𝐡𝐨𝐫:☜𝐓𝐚𝐧𝐛𝐢𝐫 𝐇𝐨𝐬𝐞𝐧_۵✌︎`;

      await bg.quality(100).writeAsync(finalPath);

      await api.sendMessage(
        { body: loveText, attachment: fs.createReadStream(finalPath) },
        event.threadID,
        () => {
          [girlPath, boyPath, finalPath].forEach(file => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
          });
        }
      );

    } catch (err) {
      console.log(err);
      api.sendMessage("❌ Error while creating I Love You picture!", event.threadID);
    }
  }
};
