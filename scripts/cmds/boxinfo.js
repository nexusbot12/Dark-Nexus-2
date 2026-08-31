const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "boxinfo",
    aliases: ["groupinfo", "gcinfo", "infogc", "infobox"],
    version: "3.0.0",
    author: "Rasel Mahmud",
    role: 0,
    shortDescription: "Detailed Group Information",
    category: "box chat",
    guide: {
      en: "{pn} - View detailed group statistics and info"
    }
  },

  onStart: async function ({ api, event }) {
    const cacheDir = path.join(__dirname, "cache");
    const imgPath = path.join(cacheDir, `groupinfo_${event.threadID}.png`);

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    try {
      const info = await api.getThreadInfo(event.threadID);

      // 📊 মেম্বার জেন্ডার ক্যালকুলেশন
      let male = 0, female = 0, unknownGender = 0;
      if (info.userInfo && Array.isArray(info.userInfo)) {
        for (const u of info.userInfo) {
          if (u.gender === "MALE") male++;
          else if (u.gender === "FEMALE") female++;
          else unknownGender++;
        }
      }

      const totalMembers = info.participantIDs ? info.participantIDs.length : 0;
      const totalAdmins = info.adminIDs ? info.adminIDs.length : 0;
      const approvalStatus = info.approvalMode ? "🟢 ON (অন)" : "🔴 OFF (অফ)";
      const formattedMsgCount = info.messageCount ? Number(info.messageCount).toLocaleString() : "N/A";

      // 🎨 ইউনিক ও আকর্ষণীয় ডিজাইন টেক্সট
      const text = 
`╔═════════════════╗  📊 𝗚𝗥𝗢𝗨𝗣 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡 📊
╚═════════════════╝

📌 𝗚𝗲𝗻𝗲𝗿𝗮𝗹 𝗗𝗲𝘁𝗮𝗶𝗹𝘀:
  • 🏷️ Name     : ${info.threadName || "No Name"}
  • 🆔 Group ID : ${info.threadID}
  • 🎭 Emoji    : ${info.emoji || "DEFAULT"}
  • ⚙️ Approval : ${approvalStatus}

👥 𝗠𝗲𝗺𝗯𝗲𝗿 𝗦𝘁𝗮𝘁𝗶𝘀𝘁𝗶𝗰𝘀:
  • 👨‍👩‍👧‍👦 Total    : ${totalMembers} Person
  • 👨 Male     : ${male} Member
  • 👩 Female   : ${female} Member
  • 👤 Hidden   : ${unknownGender} Member

🛡️ 𝗔𝗱𝗺𝗶𝗻 & 𝗔𝗰𝘁𝗶𝘃𝗶𝘁𝘆:
  • 👑 Admins   : ${totalAdmins} Person
  • 💬 Messages : ${formattedMsgCount}

─────────────────────
✨ Developed By: Rasel Mahmud`;

      // 📩 মেসেজ পাঠানোর ফাংশন
      const sendMsg = (attachmentStream = null) => {
        const msgOptions = { body: text };
        if (attachmentStream) msgOptions.attachment = attachmentStream;

        api.sendMessage(
          msgOptions,
          event.threadID,
          () => {
            if (fs.existsSync(imgPath)) {
              try { fs.unlinkSync(imgPath); } catch (_) {}
            }
          },
          event.messageID
        );
      };

      // 🖼️ কভার ফটো প্রসেস করা
      if (info.imageSrc) {
        try {
          const response = await axios({
            method: "GET",
            url: info.imageSrc,
            responseType: "arraybuffer"
          });
          fs.writeFileSync(imgPath, Buffer.from(response.data));
          sendMsg(fs.createReadStream(imgPath));
        } catch (err) {
          sendMsg();
        }
      } else {
        sendMsg();
      }

    } catch (error) {
      console.error("Boxinfo Error:", error);
      api.sendMessage("❌ গ্রুপের তথ্য সংগ্রহ করতে ব্যর্থ হয়েছে!", event.threadID, event.messageID);
    }
  }
};
