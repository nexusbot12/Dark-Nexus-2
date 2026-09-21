/**
 * @file autoreadd.js
 * @description Auto Re-Add left users, dynamic custom kick picture/video setter & canvas kick meme
 * @author Rasel Mahmud
 * @version 8.1
 */

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

const file = path.join(__dirname, "autoreadd.json");
if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({}));

// ডেটা লোড করার হেল্পার ফাংশন
function load() {
  try {
    return JSON.parse(fs.readFileSync(file));
  } catch (e) {
    return {};
  }
}

// ডেটা সেভ করার হেল্পার ফাংশন
function save(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// থ্রেড কনফিগারেশন গেট ফাংশন
function getThreadData(data, tid) {
  if (data[tid] === undefined) {
    return { enabled: true, customMedia: null };
  }
  if (typeof data[tid] === "boolean") {
    return { enabled: data[tid], customMedia: null };
  }
  return data[tid];
}

// ডিফল্ট কিক মিম ইমেজ জেনারেটর (Canvas)
async function makeKickImage(adminUID, targetUID) {
  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);
  const cachePath = path.join(cacheDir, `kick_${Date.now()}_${targetUID}.png`);

  const bgUrl = "https://i.imgur.com/R9WjP2O.jpeg";
  const adminAvatarUrl = `https://graph.facebook.com/${adminUID}/picture?height=500&width=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const targetAvatarUrl = `https://graph.facebook.com/${targetUID}/picture?height=500&width=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

  const [bgImage, adminAvatar, targetAvatar] = await Promise.all([
    loadImage(bgUrl),
    loadImage(adminAvatarUrl).catch(() => loadImage("https://i.imgur.com/2wd292m.png")),
    loadImage(targetAvatarUrl).catch(() => loadImage("https://i.imgur.com/2wd292m.png"))
  ]);

  const canvas = createCanvas(bgImage.width, bgImage.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

  // ১. অ্যাডমিনের প্রোফাইল পিকচার
  const adminX = canvas.width * 0.340; 
  const adminY = canvas.height * 0.465; 
  const adminRadius = 26; 

  ctx.save();
  ctx.beginPath();
  ctx.arc(adminX, adminY, adminRadius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(adminAvatar, adminX - adminRadius, adminY - adminRadius, adminRadius * 2, adminRadius * 2);
  ctx.restore();

  // ২. কিক খাওয়া ইউজারের প্রোফাইল পিকচার
  const targetX = canvas.width * 0.730; 
  const targetY = canvas.height * 0.655; 
  const targetRadius = 22; 

  ctx.save();
  ctx.beginPath();
  ctx.arc(targetX, targetY, targetRadius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(targetAvatar, targetX - targetRadius, targetY - targetRadius, targetRadius * 2, targetRadius * 2);
  ctx.restore();

  const buffer = canvas.toBuffer("image/png");
  await fs.writeFile(cachePath, buffer);
  return cachePath;
}

// ইউআরএল থেকে মিডিয়া ফাইল ডাউনলোড করার হেল্পার
async function downloadMedia(url, ext) {
  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);
  const filePath = path.join(cacheDir, `custom_kick_${Date.now()}.${ext}`);

  const response = await axios({
    method: "GET",
    url: url,
    responseType: "stream"
  });

  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(filePath));
    writer.on("error", reject);
  });
}

module.exports = {
  config: {
    name: "autoreadd",
    aliases: ["antiout", "setkick"],
    version: "8.1",
    author: "Rasel Mahmud",
    countDown: 3,
    role: 0,
    shortDescription: "Auto Re-Add & Custom Kick Media System",
    longDescription: "কিক দিলে সেট করা কাস্টম পিকচার/ভিডিও অথবা ডিফল্ট ক্যানভাস পিকচার দেখাবে এবং লিভ নিলে অটো রি-অ্যাড করবে",
    category: "system",
    guide: { 
      en: "{pn} on / off\nReply to photo/video with 'setkick add'\nType 'setkick remove' to clear custom media" 
    }
  },

  // ১. কমান্ড ডাইরেক্ট হ্যান্ডলার
  onStart: async function ({ api, event, args }) {
    const tid = event.threadID;
    const sid = event.senderID;

    const info = await api.getThreadInfo(tid);
    const isGroupAdmin = info.adminIDs.some(a => a.id == sid);
    const isBotAdmin = event.role >= 1;

    if (!isGroupAdmin && !isBotAdmin) {
      return api.sendMessage("❌ Only Group Admin can use this command!", tid);
    }

    let data = load();
    let threadConfig = getThreadData(data, tid);

    if (!args[0]) {
      return api.sendMessage(
        "📌 **AutoReAdd & SetKick Usage:**\n\n" +
        "• `autoreadd on` / `off` - Turn auto re-add & kick alert ON/OFF\n" +
        "• Reply to a photo/video with `setkick add` to set custom kick media\n" +
        "• `setkick remove` - Remove custom media and revert to default canvas picture",
        tid
      );
    }

    const command = args[0].toLowerCase();

    if (command === "on") {
      threadConfig.enabled = true;
      data[tid] = threadConfig;
      save(data);
      return api.sendMessage("✅ Auto Re-Add & Kick Alert is now ON!", tid);
    }

    if (command === "off") {
      threadConfig.enabled = false;
      data[tid] = threadConfig;
      save(data);
      return api.sendMessage("❌ Auto Re-Add & Kick Alert is now OFF!", tid);
    }

    if (command === "add") {
      return this.handleSetKickAdd({ api, event, tid, data, threadConfig });
    }

    if (command === "remove") {
      threadConfig.customMedia = null;
      data[tid] = threadConfig;
      save(data);
      return api.sendMessage("✅ Custom kick media removed! Default meme picture will be used now.", tid);
    }
  },

  // ২. কাস্টম পিকচার/ভিডিও সেট করার সাব-ফাংশন
  handleSetKickAdd: async function ({ api, event, tid, data, threadConfig }) {
    const replied = event.messageReply;

    if (!replied || !replied.attachments || replied.attachments.length === 0) {
      return api.sendMessage("❌ Please reply to an image or video with 'setkick add'!", tid);
    }

    const att = replied.attachments[0];
    const isPhoto = att.type === "photo" || att.type === "image";
    const isVideo = att.type === "video" || att.type === "animated_image";

    if (!isPhoto && !isVideo) {
      return api.sendMessage("❌ Please reply only to an image or a video!", tid);
    }

    threadConfig.customMedia = {
      url: att.url,
      type: isVideo ? "video" : "photo",
      ext: isVideo ? "mp4" : "png"
    };

    data[tid] = threadConfig;
    save(data);

    const mediaType = isVideo ? "Video" : "Picture";
    return api.sendMessage(`✅ Custom kick ${mediaType} set successfully!\nFrom now on, this ${mediaType.toLowerCase()} will be sent when someone is kicked.`, tid);
  },

  // ৩. গ্রুপ ইভেন্ট লিসেনার (লিভ ও কিক ডিটেক্টর)
  onEvent: async function ({ api, event }) {
    if (event.logMessageType !== "log:unsubscribe") return;

    const tid = event.threadID;
    const leftUser = event.logMessageData.leftParticipantFbId;
    const authorId = event.author;

    let data = load();
    let threadConfig = getThreadData(data, tid);

    if (!threadConfig.enabled) return;
    if (leftUser === api.getCurrentUserID()) return;

    const isSelfLeave = (authorId === leftUser);

    try {
      const userInfo = await api.getUserInfo(parseInt(leftUser));
      const userName = userInfo[leftUser]?.name || "Someone";

      if (isSelfLeave) {
        const initialMessage = await api.sendMessage(`➤ ${userName} left the group`, tid);
        
        try {
          await api.addUserToGroup(leftUser, tid);
          await api.editMessage(`✅ ${userName} added back automatically!`, initialMessage.messageID, tid);
        } catch (addError) {
          console.error("Auto re-add failed:", addError);
          await api.editMessage(`❌ Failed to re-add ${userName} (blocked or left permanently)`, initialMessage.messageID, tid);
        }
      } else {
        let mediaPath = null;

        try {
          if (threadConfig.customMedia && threadConfig.customMedia.url) {
            mediaPath = await downloadMedia(threadConfig.customMedia.url, threadConfig.customMedia.ext || "png");
          } else {
            mediaPath = await makeKickImage(authorId, leftUser);
          }

          await api.sendMessage({
            body: `➤ ${userName} was kicked out from the group!`,
            attachment: fs.createReadStream(mediaPath)
          }, tid);

        } catch (mediaError) {
          console.error("Kick media sending error:", mediaError);
          await api.sendMessage(`➤ ${userName} was kicked out from the group!`, tid);
        } finally {
          if (mediaPath && fs.existsSync(mediaPath)) {
            fs.unlinkSync(mediaPath);
          }
        }
      }

    } catch (error) {
      console.error("Error in autoreadd event:", error);
      
      if (isSelfLeave) {
        const initialMessage = await api.sendMessage(`➤ Someone left the group`, tid);
        try {
          await api.addUserToGroup(leftUser, tid);
          await api.editMessage(`✅ User added back automatically!`, initialMessage.messageID, tid);
        } catch (addError) {
          await api.editMessage(`❌ Failed to re-add user.`, initialMessage.messageID, tid);
        }
      } else {
        await api.sendMessage(`➤ Someone kicked out from the group`, tid);
      }
    }
  }
};
