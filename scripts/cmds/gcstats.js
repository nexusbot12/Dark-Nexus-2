const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// 🔑 Graph API Access Token
const ACCESS_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

module.exports = {
  config: {
    name: "gcstats",
    aliases: ["groupstats", "groupinfo2", "gcinfo2"],
    version: "3.5.0",
    author: "Rasel Mahmud",
    countDown: 10,
    role: 0,
    shortDescription: "Shows group stats & sorted member collage",
    longDescription: "Displays group logo, stats, and member collage where admins appear first with red borders and members with green borders.",
    category: "group"
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;
    const tempPath = path.join(__dirname, `temp_gcstats_${Date.now()}.png`);
    let processingMsg = null;

    try {
      // ⏳ ১. প্রসেসিং নোটিফিকেশন পাঠানো
      processingMsg = await api.sendMessage(
        "⏳ **প্রসেসিং হচ্ছে...** মেম্বারদের প্রোফাইল লোড ও কোলাজ তৈরি করা হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন...",
        threadID,
        messageID
      );

      // 📌 Fetch Group Info
      const threadInfo = await api.getThreadInfo(threadID);
      const groupName = threadInfo.threadName || "Unnamed Group";
      const groupImage = threadInfo.imageSrc || null;

      // 🛡️ Admin & Member Sorting Setup
      const rawAdmins = threadInfo.adminIDs || [];
      const adminIDsSet = new Set(rawAdmins.map(a => String(typeof a === "object" ? (a.id || a.userID) : a)));

      const allParticipants = threadInfo.participantIDs || [];

      // এডমিনদের আগে এবং সাধারণ মেম্বারদের পরে আলাদা করা
      const adminList = allParticipants.filter(id => adminIDsSet.has(String(id)));
      const regularList = allParticipants.filter(id => !adminIDsSet.has(String(id)));
      const sortedMembers = [...adminList, ...regularList];

      const adminCount = adminList.length;
      const memberCount = allParticipants.length;

      // 📏 Dynamic Grid Setup
      const width = 1280;
      const cols = 12;
      const thumbSize = 72;
      const gap = 18;

      const rows = Math.ceil(memberCount / cols);
      const headerHeight = 280;
      const gridHeight = rows * (thumbSize + gap) + 40;
      const footerHeight = 80;
      const height = Math.max(620, headerHeight + gridHeight + footerHeight);

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // ===== 🌌 1. PREMIUM SPACE GRADIENT BACKGROUND =====
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, "#080b1a");
      bgGradient.addColorStop(0.3, "#12182e");
      bgGradient.addColorStop(0.7, "#1a0f2e");
      bgGradient.addColorStop(1, "#050814");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // ===== 🌟 2. STARFIELD EFFECT =====
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      for (let i = 0; i < 180; i++) {
        const sx = Math.random() * width;
        const sy = Math.random() * height;
        const sRadius = Math.random() * 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ===== 🔮 3. GLOWING AMBIENT ORBS =====
      const orbColors = [
        "rgba(0, 200, 255, 0.12)",
        "rgba(255, 0, 128, 0.10)",
        "rgba(150, 0, 255, 0.12)",
        "rgba(0, 255, 170, 0.08)"
      ];
      for (let i = 0; i < 10; i++) {
        const ox = Math.random() * width;
        const oy = Math.random() * height;
        const oRadius = 80 + Math.random() * 140;
        ctx.shadowColor = orbColors[i % orbColors.length].replace("0.1", "0.3");
        ctx.shadowBlur = 50;
        ctx.fillStyle = orbColors[i % orbColors.length];
        ctx.beginPath();
        ctx.arc(ox, oy, oRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // ===== 🛡️ 4. MAIN CARD CONTAINER =====
      const cardX = 40;
      const cardY = 40;
      const cardWidth = width - 80;
      const cardHeight = height - 80;

      ctx.shadowColor = "rgba(0, 180, 255, 0.35)";
      ctx.shadowBlur = 25;
      ctx.fillStyle = "rgba(12, 20, 38, 0.88)";
      ctx.beginPath();
      roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 25);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#00d2ff";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 25);
      ctx.stroke();

      // ===== 🖼️ 5. GROUP LOGO & HEADER =====
      const logoX = cardX + 50;
      const logoY = cardY + 45;
      const logoRadius = 60;

      // Group Logo Frame
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "rgba(0, 240, 255, 0.15)";
      ctx.beginPath();
      ctx.arc(logoX + logoRadius, logoY + logoRadius, logoRadius + 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Load Group Image
      let loadedGroupLogo = null;
      if (groupImage) {
        try {
          const res = await axios.get(groupImage, { responseType: "arraybuffer", timeout: 8000 });
          loadedGroupLogo = await loadImage(Buffer.from(res.data, "binary"));
        } catch (_) {}
      }

      ctx.shadowBlur = 10;
      if (loadedGroupLogo) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(logoX + logoRadius, logoY + logoRadius, logoRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(loadedGroupLogo, logoX, logoY, logoRadius * 2, logoRadius * 2);
        ctx.restore();
      } else {
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.arc(logoX + logoRadius, logoY + logoRadius, logoRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 50px Arial";
        ctx.textAlign = "center";
        ctx.fillText("👥", logoX + logoRadius, logoY + logoRadius + 18);
      }
      ctx.shadowBlur = 0;

      // Group Name Text
      const textX = logoX + logoRadius * 2 + 35;
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 38px 'Segoe UI', Arial, sans-serif";
      
      let displayGroupName = groupName;
      if (displayGroupName.length > 32) {
        displayGroupName = displayGroupName.substring(0, 30) + "...";
      }
      ctx.fillText(displayGroupName, textX, logoY + 45);

      // ===== 📊 6. STATS BADGES =====
      const badgeY = logoY + 70;

      // Admins Badge
      ctx.fillStyle = "rgba(255, 71, 87, 0.2)";
      ctx.beginPath();
      roundRect(ctx, textX, badgeY, 175, 42, 10);
      ctx.fill();
      ctx.strokeStyle = "#ff4757";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#ff6b81";
      ctx.font = "bold 20px 'Segoe UI', Arial";
      ctx.fillText(`🛡️ Admins: ${adminCount}`, textX + 15, badgeY + 28);

      // Members Badge
      const memberBadgeX = textX + 195;
      ctx.fillStyle = "rgba(46, 213, 115, 0.2)";
      ctx.beginPath();
      roundRect(ctx, memberBadgeX, badgeY, 195, 42, 10);
      ctx.fill();
      ctx.strokeStyle = "#2ed573";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#7bed9f";
      ctx.font = "bold 20px 'Segoe UI', Arial";
      ctx.fillText(`👥 Members: ${memberCount}`, memberBadgeX + 15, badgeY + 28);

      // Divider Line
      const dividerY = cardY + 190;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cardX + 40, dividerY);
      ctx.lineTo(cardX + cardWidth - 40, dividerY);
      ctx.stroke();

      // Section Title & Legend
      ctx.fillStyle = "#00d2ff";
      ctx.font = "bold 22px 'Segoe UI', Arial";
      ctx.fillText("👥 MEMBER COLLAGE", cardX + 40, dividerY + 35);

      ctx.font = "16px 'Segoe UI', Arial";
      ctx.fillStyle = "#ff4757";
      ctx.fillText("🔴 Admins (First)", cardX + 320, dividerY + 35);

      ctx.fillStyle = "#2ed573";
      ctx.fillText("🟢 Members", cardX + 480, dividerY + 35);

      // ===== 👥 7. PARALLEL AVATAR FETCHING & RENDERING =====
      const gridAreaWidth = cols * thumbSize + (cols - 1) * gap;
      const startX = cardX + (cardWidth - gridAreaWidth) / 2;
      const startY = dividerY + 60;

      // সর্টেড মেম্বারদের ছবি সমান্তরালে ডাউনলোড করা
      const avatarImages = await fetchAvatarsInBatches(sortedMembers, 15);

      for (let i = 0; i < sortedMembers.length; i++) {
        const userID = sortedMembers[i];
        const isAdmin = adminIDsSet.has(String(userID));

        const col = i % cols;
        const row = Math.floor(i / cols);

        const x = startX + col * (thumbSize + gap);
        const y = startY + row * (thumbSize + gap);
        const avatarImg = avatarImages[i];

        // Background Ring Light Fill
        ctx.fillStyle = isAdmin ? "rgba(255, 71, 87, 0.15)" : "rgba(46, 213, 115, 0.15)";
        ctx.beginPath();
        ctx.arc(x + thumbSize / 2, y + thumbSize / 2, thumbSize / 2, 0, Math.PI * 2);
        ctx.fill();

        if (avatarImg) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(x + thumbSize / 2, y + thumbSize / 2, thumbSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(avatarImg, x, y, thumbSize, thumbSize);
          ctx.restore();
        } else {
          // Fallback Silhouette
          ctx.fillStyle = "#1e293b";
          ctx.beginPath();
          ctx.arc(x + thumbSize / 2, y + thumbSize / 2, thumbSize / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#94a3b8";
          ctx.font = "bold 30px Arial";
          ctx.textAlign = "center";
          ctx.fillText("👤", x + thumbSize / 2, y + thumbSize / 2 + 10);
        }

        // 🔴 এডমিনের জন্য লাল বর্ডার, 🟢 মেম্বারের জন্য সবুজ বর্ডার
        ctx.strokeStyle = isAdmin ? "#ff4757" : "#2ed573";
        ctx.lineWidth = isAdmin ? 3 : 2; // এডমিন বর্ডার কিছুটা মোটা
        ctx.beginPath();
        ctx.arc(x + thumbSize / 2, y + thumbSize / 2, thumbSize / 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ===== 💎 8. FOOTER & CORNER ACCENTS =====
      const footerY = cardY + cardHeight - 45;

      ctx.fillStyle = "#ff55aa";
      ctx.font = "bold 18px 'Segoe UI', Arial";
      ctx.textAlign = "right";
      ctx.fillText("💎 Heli•LUMO | Rasel Mahmud 💎", cardX + cardWidth - 40, footerY + 20);

      // Corner Accents
      ctx.strokeStyle = "#ff55aa";
      ctx.lineWidth = 2;
      const cornerLength = 25;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(cardX + 15, cardY + 15);
      ctx.lineTo(cardX + 15 + cornerLength, cardY + 15);
      ctx.moveTo(cardX + 15, cardY + 15);
      ctx.lineTo(cardX + 15, cardY + 15 + cornerLength);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(cardX + cardWidth - 15, cardY + cardHeight - 15);
      ctx.lineTo(cardX + cardWidth - 15 - cornerLength, cardY + cardHeight - 15);
      ctx.moveTo(cardX + cardWidth - 15, cardY + cardHeight - 15);
      ctx.lineTo(cardX + cardWidth - 15, cardY + cardHeight - 15 - cornerLength);
      ctx.stroke();

      // Save Image Buffer
      const buffer = canvas.toBuffer("image/png");
      await fs.writeFile(tempPath, buffer);

      // ✅ ২. সফলভাবে মেসেজ সেন্ড ও প্রসেসিং মেসেজ আনসেন্ড করা
      await api.sendMessage(
        {
          body: `✅ **${groupName}** Stats & Collage Ready!\n─────────────────────────\n🔴 Admins:${adminCount} \n🟢 Members: ${memberCount - adminCount} \n📊 **Total Members:** ${memberCount}`,
          attachment: fs.createReadStream(tempPath)
        },
        threadID,
        () => {
          if (processingMsg && processingMsg.messageID) {
            try { api.unsendMessage(processingMsg.messageID); } catch (_) {}
          }
          if (fs.existsSync(tempPath)) {
            try { fs.unlinkSync(tempPath); } catch (_) {}
          }
        },
        messageID
      );

    } catch (error) {
      console.error("GCStats Command Error:", error);
      // ❌ ৩. এরর হলে মেসেজ
      if (processingMsg && processingMsg.messageID) {
        try { api.unsendMessage(processingMsg.messageID); } catch (_) {}
      }
      api.sendMessage(`❌ Error occurred: ${error.message}`, threadID, messageID);
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (_) {}
      }
    }
  }
};

// 🛠️ Batch Downloader Function
async function fetchAvatarsInBatches(memberIDs, batchSize = 15) {
  const results = [];
  for (let i = 0; i < memberIDs.length; i += batchSize) {
    const batch = memberIDs.slice(i, i + batchSize);
    const promises = batch.map(id => downloadSingleAvatar(id));
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
  }
  return results;
}

// 🛠️ Single Avatar Download Handler
async function downloadSingleAvatar(userID) {
  try {
    const url = `https://graph.facebook.com/${userID}/picture?width=180&height=180&access_token=${ACCESS_TOKEN}`;
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 6000 });
    return await loadImage(Buffer.from(res.data, "binary"));
  } catch (_) {
    return null;
  }
}

// 🛠️ Helper Function: Rounded Rectangle
function roundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  return ctx;
                }
