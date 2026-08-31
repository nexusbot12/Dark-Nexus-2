const os = require("os");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up", "upt"],
    version: "7.5",
    author: "Rasel Mahmud",
    role: 0,
    shortDescription: "Show bot uptime with animated progress & random image",
    longDescription: "Displays bot uptime stats with editMessage animation and random image",
    category: "system",
    guide: "{p}uptime"
  },

  onStart: async function ({ api, event, usersData, threadsData }) {
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // 🖼️ ইমেজ লিংক অ্যারে
    const imageLinks = [
      "https://files.catbox.moe/wfngzy.jpg",
      "https://files.catbox.moe/1xdv8z.jpg",
      "https://files.catbox.moe/fmn527.jpg",
      "https://files.catbox.moe/et8m45.jpg",
      "https://files.catbox.moe/pjxmue.jpg",
      "https://files.catbox.moe/7kndmf.jpg",
      "https://files.catbox.moe/o8cgcm.jpg",
      "https://files.catbox.moe/2nd2gq.jpg",
      "https://files.catbox.moe/ohqfdz.jpg",
      "https://files.catbox.moe/z129vp.jpg",
      "https://files.catbox.moe/qwtstf.jpg",
      "https://files.catbox.moe/6l8g10.jpg",
      "https://files.catbox.moe/pwj189.jpg",
      "https://files.catbox.moe/fnrdcx.jpg",
      "https://files.catbox.moe/xgtccm.jpg",
      "https://files.catbox.moe/7d5liz.jpg",
      "https://files.catbox.moe/14vljp.jpg",
      "https://files.catbox.moe/9l0u7j.jpg",
      "https://files.catbox.moe/3qz0ze.jpg",
      "https://files.catbox.moe/wq9879.jpg",
      "https://files.catbox.moe/jkivl3.jpg",
      "https://files.catbox.moe/ffsge2.jpg",
      "https://files.catbox.moe/7a4nsg.jpg",
      "https://files.catbox.moe/d34419.jpg",
      "https://files.catbox.moe/de4mz6.jpg",
      "https://files.catbox.moe/pq0tan.jpg",
      "https://files.catbox.moe/t50bm5.jpg",
      "https://files.catbox.moe/0i359f.jpg",
      "https://files.catbox.moe/u7t2tc.jpg",
      "https://files.catbox.moe/bx70ne.jpg",
      "https://files.catbox.moe/8ve59b.jpg",
      "https://files.catbox.moe/q2gtad.jpg",
      "https://files.catbox.moe/1s7ctu.jpg",
      "https://files.catbox.moe/f4kdt2.jpg",
      "https://files.catbox.moe/axh9be.jpg",
      "https://files.catbox.moe/qkpqy8.jpg",
      "https://files.catbox.moe/qbdyrr.jpg",
      "https://files.catbox.moe/rvmbip.jpg",
      "https://files.catbox.moe/37gypi.jpg",
      "https://files.catbox.moe/ohs60q.jpg",
      "https://files.catbox.moe/2czm0r.jpg",
      "https://files.catbox.moe/xj5mmk.jpg",
      "https://files.catbox.moe/mpo552.jpg",
      "https://files.catbox.moe/szmfk6.jpg",
      "https://files.catbox.moe/o7sa1g.jpg",
      "https://files.catbox.moe/7iie36.jpg",
      "https://files.catbox.moe/o3xqgu.jpg",
      "https://files.catbox.moe/8kqkv3.jpg",
      "https://files.catbox.moe/jcuyc9.jpg",
      "https://files.catbox.moe/isx1e1.jpg",
      "https://files.catbox.moe/m2gxmx.jpg",
      "https://files.catbox.moe/t5u0bb.jpg",
      "https://files.catbox.moe/ona5lr.jpg",
      "https://files.catbox.moe/7pyujd.jpg",
      "https://files.catbox.moe/8qs8jo.jpg",
      "https://files.catbox.moe/ow5c73.jpg",
      "https://files.catbox.moe/coc4vt.jpg",
      "https://files.catbox.moe/tzckhc.jpg"
    ];

    // ইমেজ ডাউনলোড করে স্ট্রিম বানানোর ফাংশন
    const downloadImage = async (url) => {
      try {
        const response = await axios({
          url,
          method: 'GET',
          responseType: 'stream'
        });
        return response.data;
      } catch (e) {
        console.error("Image download error:", e.message);
        return null;
      }
    };

    // Smart editMessage handler
    const editMessageSafe = async (content, messageID) => {
      try {
        await api.editMessage(content, messageID);
      } catch (e) {
        console.error("Edit message failed:", e.message);
      }
    };

    let currentMessageID = null;

    try {
      // STEP 1: Send initial message
      const initialMsg = await api.sendMessage(
        `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗
┃  📡 𝐒𝐓𝐀𝐑𝐓𝐈𝐍𝐆 𝐒𝐘𝐒𝐓𝐄𝐌...
┃  ▱▱▱▱▱▱▱▱▱▱ 𝟎%
╚═══════════════════╝`,
        event.threadID
      );
      currentMessageID = initialMsg.messageID;

      await delay(800);

      // STEP 2: Animation steps
      const animationSteps = [
        { percent: "50%", bar: "▰▰▰▰▰▱▱▱▱▱", delay: 800 },
        { percent: "75%", bar: "▰▰▰▰▰▰▰▱▱▱", delay: 800 },
        { percent: "100%", bar: "▰▰▰▰▰▰▰▰▰▰", delay: 800 }
      ];

      for (const step of animationSteps) {
        await editMessageSafe(
          `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗
┃  📡 𝐏𝐑𝐎𝐂𝐄𝐒𝐒𝐈𝐍𝐆 𝐃𝐀𝐓𝐀
┃  ${step.bar} ${step.percent}
╚═══════════════════╝`,
          currentMessageID
        );
        await delay(step.delay);
      }

      // STEP 3: Calculate uptime
      const uptime = process.uptime();
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      const uptimeFormatted = `${days}𝐝 ${hours}𝐡 ${minutes}𝐦 ${seconds}𝐬`;

      const ping = Date.now() - event.timestamp;

      // Bangladesh time
      const now = new Date();
      const bangladeshTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
      const date = bangladeshTime.toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' });
      const time = bangladeshTime.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true });

      // User and thread counts
      let totalUsers = 0;
      let totalThreads = 0;

      try { totalUsers = (await usersData.getAll()).length; } catch {}
      try { totalThreads = (await threadsData.getAll()).length; } catch {}

      // STEP 4: Delete old animation message
      try {
        await api.unsendMessage(currentMessageID);
      } catch(e) {}

      // STEP 5: Send final message with random image attachment
      const finalBody = `
╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗
┃  ⏱️  𝐔𝐏𝐓𝐈𝐌𝐄 : ${uptimeFormatted}
┃  📡 𝐏𝐈𝐍𝐆 : ${ping}𝐦𝐬
┃  📅 𝐃𝐀𝐓𝐄 : ${date}
┃  ⏰ 𝐓𝐈𝐌𝐄 : ${time} (𝐁𝐃𝐓)
┃  👥 𝐔𝐒𝐄𝐑𝐒 : ${totalUsers}
┃  💬 𝐓𝐇𝐑𝐄𝐀𝐃𝐒 : ${totalThreads}
┃  👑 𝐂𝐑𝐄𝐀𝐓𝐎𝐑 : 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐡𝐦𝐮𝐝
┃  ✅ 𝐒𝐓𝐀𝐓𝐔𝐒 : 𝐎𝐏𝐄𝐑𝐀𝐓𝐈𝐎𝐍𝐀𝐋
╚═══════════════════╝
`.trim();

      const randomImage = imageLinks[Math.floor(Math.random() * imageLinks.length)];
      const imageStream = await downloadImage(randomImage);

      if (imageStream) {
        await api.sendMessage(
          {
            body: finalBody,
            attachment: imageStream
          },
          event.threadID
        );
      } else {
        // ইমেজ ডাউনলোড ফেল হলে শুধু টেক্সট পাঠাবে
        await api.sendMessage(finalBody, event.threadID);
      }

    } catch (error) {
      console.error("Uptime command error:", error);

      const errorMessage = `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗
┃  ⚠️  𝐒𝐓𝐀𝐓𝐔𝐒 : 𝐎𝐍𝐋𝐈𝐍𝐄
┃  📊 𝐁𝐨𝐭 𝐢𝐬 𝐫𝐮𝐧𝐧𝐢𝐧𝐠 𝐧𝐨𝐫𝐦𝐚𝐥𝐥𝐲
╚═══════════════════╝`;

      if (currentMessageID) {
        try { await api.unsendMessage(currentMessageID); } catch(e) {}
      }
      await api.sendMessage(errorMessage, event.threadID);
    }
  }
};
