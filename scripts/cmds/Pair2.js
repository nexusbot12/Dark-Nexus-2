const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { loadImage, createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "pair2",
    aliases: ["couple2", "match2"],
    version: "25.0",
    author: "Tanbir Hosen",
    countDown: 5,
    role: 0,
    shortDescription: "💞 Romantic pairing with custom profile positioning",
    longDescription:
      "রোমান্টিক ব্যানারের নির্দিষ্ট ফ্রেমের ভেতরে কাস্টম সাইজ ও পজিশনে প্রোফাইল পিকচার সুন্দরভাবে বসায়।",
    category: "love",
  },

  onStart: async function ({ api, event }) {
    let imgPath = null;

    try {
      const { threadID, senderID, mentions } = event;

      // =========================
      // GROUP MEMBERS
      // =========================
      const threadInfo = await api.getThreadInfo(threadID);
      const members = threadInfo.userInfo || [];

      if (members.length < 2) {
        return api.sendMessage(
          "😢 Pair তৈরি করার জন্য অন্তত ২ জন দরকার!",
          threadID
        );
      }

      // =========================
      // SENDER GENDER
      // =========================
      const senderInfo = members.find(
        (m) => String(m.id) === String(senderID)
      );

      let senderGender = "unknown";

      if (
        senderInfo?.gender === 2 ||
        senderInfo?.gender === "MALE"
      ) {
        senderGender = "male";
      } else if (
        senderInfo?.gender === 1 ||
        senderInfo?.gender === "FEMALE"
      ) {
        senderGender = "female";
      }

      // =========================
      // SELECT USER 1 & USER 2
      // =========================
      const user1 = senderID;
      let user2;

      const mentionIDs = mentions
        ? Object.keys(mentions)
        : [];

      if (mentionIDs.length > 0) {
        user2 = mentionIDs[0];
      } else {
        let candidates = [];

        if (senderGender === "male") {
          candidates = members.filter(
            (m) =>
              String(m.id) !== String(senderID) &&
              (m.gender === 1 || m.gender === "FEMALE")
          );
        } else if (senderGender === "female") {
          candidates = members.filter(
            (m) =>
              String(m.id) !== String(senderID) &&
              (m.gender === 2 || m.gender === "MALE")
          );
        } else {
          candidates = members.filter(
            (m) => String(m.id) !== String(senderID)
          );
        }

        if (candidates.length === 0) {
          candidates = members.filter(
            (m) => String(m.id) !== String(senderID)
          );
        }

        if (candidates.length === 0) {
          return api.sendMessage(
            "⚠️ কোনো পার্টনার পাওয়া যায়নি!",
            threadID
          );
        }

        user2 =
          candidates[
            Math.floor(Math.random() * candidates.length)
          ].id;
      }

      // =========================
      // GET NAMES
      // =========================
      let name1 = "User 1";
      let name2 = "User 2";

      try {
        const info = await api.getUserInfo([user1, user2]);

        name1 =
          info[user1]?.name ||
          members.find((m) => String(m.id) === String(user1))?.name ||
          name1;

        name2 =
          info[user2]?.name ||
          members.find((m) => String(m.id) === String(user2))?.name ||
          name2;
      } catch (err) {
        name1 =
          members.find((m) => String(m.id) === String(user1))?.name ||
          name1;

        name2 =
          members.find((m) => String(m.id) === String(user2))?.name ||
          name2;
      }

      // =========================
      // BACKGROUND BANNER
      // =========================
      const bgImgURL = "https://i.imgur.com/SCq2VNu.jpeg";

      const bgResponse = await axios.get(bgImgURL, {
        responseType: "arraybuffer",
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        timeout: 15000,
      });

      const bgImg = await loadImage(
        Buffer.from(bgResponse.data)
      );

      // =====================================================
      // REFERENCE DESIGN SIZE & YOUR EXACT CUSTOM SIZES
      // =====================================================
      const DESIGN_WIDTH = 900;
      const DESIGN_HEIGHT = 500;

      // আপনার দেওয়া মানসমূহ
      const PROFILE_SIZE = 240;
      const LEFT_X = 65;
      const RIGHT_X = 675;
      const PROFILE_Y = 105;

      // =========================
      // CANVAS = ORIGINAL BANNER
      // =========================
      const canvas = createCanvas(
        bgImg.width,
        bgImg.height
      );

      const ctx = canvas.getContext("2d");

      // Background Draw
      ctx.drawImage(
        bgImg,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // =====================================================
      // AUTO SCALE
      // =====================================================
      const scaleX = canvas.width / DESIGN_WIDTH;
      const scaleY = canvas.height / DESIGN_HEIGHT;

      const scale = Math.min(scaleX, scaleY);

      const picSize = Math.round(PROFILE_SIZE * scale);

      const leftX = Math.round(LEFT_X * scale);
      const rightX = Math.round(RIGHT_X * scale);
      const picY = Math.round(PROFILE_Y * scale);

      // =====================================================
      // PERFECT CROP FUNCTION (NO STRETCH / NO DISTORTION)
      // =====================================================
      function drawCover(image, x, y, size) {
        const minDim = Math.min(image.width, image.height);
        const sourceX = (image.width - minDim) / 2;
        const sourceY = (image.height - minDim) / 2;

        ctx.drawImage(
          image,
          sourceX,
          sourceY,
          minDim,
          minDim,
          x,
          y,
          size,
          size
        );
      }

      // =========================
      // DRAW PROFILE FUNCTION
      // =========================
      function drawProfile(image, x, y, size) {
        ctx.save();

        // Corner radius
        const radius = Math.round(10 * scale);

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + size - radius, y);
        ctx.quadraticCurveTo(
          x + size,
          y,
          x + size,
          y + radius
        );

        ctx.lineTo(
          x + size,
          y + size - radius
        );

        ctx.quadraticCurveTo(
          x + size,
          y + size,
          x + size - radius,
          y + size
        );

        ctx.lineTo(
          x + radius,
          y + size
        );

        ctx.quadraticCurveTo(
          x,
          y + size,
          x,
          y + size - radius
        );

        ctx.lineTo(x, y + radius);

        ctx.quadraticCurveTo(
          x,
          y,
          x + radius,
          y
        );

        ctx.closePath();
        ctx.clip();

        // Profile Image Draw
        drawCover(image, x, y, size);

        ctx.restore();

        // =========================
        // WHITE BORDER
        // =========================
        ctx.save();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(2, Math.round(3.5 * scale));

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + size - radius, y);

        ctx.quadraticCurveTo(
          x + size,
          y,
          x + size,
          y + radius
        );

        ctx.lineTo(
          x + size,
          y + size - radius
        );

        ctx.quadraticCurveTo(
          x + size,
          y + size,
          x + size - radius,
          y + size
        );

        ctx.lineTo(
          x + radius,
          y + size
        );

        ctx.quadraticCurveTo(
          x,
          y + size,
          x,
          y + size - radius
        );

        ctx.lineTo(x, y + radius);

        ctx.quadraticCurveTo(
          x,
          y,
          x + radius,
          y
        );

        ctx.closePath();

        ctx.stroke();

        ctx.restore();
      }

      // =========================
      // AVATAR LOADER
      // =========================
      async function getAvatar(userID) {
        const urls = [
          `https://graph.facebook.com/${userID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,

          `https://graph.facebook.com/${userID}/picture?type=large`,

          `https://graph.facebook.com/${userID}/picture?width=500&height=500`,
        ];

        for (const url of urls) {
          try {
            const response = await axios.get(url, {
              responseType: "arraybuffer",
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
              },
              timeout: 10000,
            });

            if (
              response.data &&
              response.data.byteLength > 1000
            ) {
              return await loadImage(
                Buffer.from(response.data)
              );
            }
          } catch (err) {
            // Try next URL
          }
        }

        throw new Error(
          `Avatar loading failed for ${userID}`
        );
      }

      // =========================
      // LOAD BOTH PROFILE PICS
      // =========================
      const img1 = await getAvatar(user1);
      const img2 = await getAvatar(user2);

      // =========================
      // DRAW PROFILE PICTURES
      // =========================
      drawProfile(
        img1,
        leftX,
        picY,
        picSize
      );

      drawProfile(
        img2,
        rightX,
        picY,
        picSize
      );

      // =========================
      // LOVE PERCENT
      // =========================
      const lovePercent =
        Math.floor(Math.random() * 51) + 50;

      // =========================
      // CACHE
      // =========================
      const cacheDir = path.join(
        __dirname,
        "cache"
      );

      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, {
          recursive: true,
        });
      }

      imgPath = path.join(
        cacheDir,
        `pair2_${Date.now()}.png`
      );

      fs.writeFileSync(
        imgPath,
        canvas.toBuffer("image/png")
      );

      // =========================
      // SEND MESSAGE
      // =========================
      await api.sendMessage(
        {
          body:
`╔══❰ 𝐃𝐀𝐑𝐊•𝐍𝐄𝐗𝐔𝐒 ❱══╗
      💖 𝗟 𝗢 𝗩 𝗘   𝗠 𝗔 𝗧 𝗖 𝗛 💖

🎀 ${name1}
🎀 ${name2}

💗 Love Match: ${lovePercent}% ❤️‍🔥🫰🏻

╚════════════════╝
🤴🏻𝐂𝐑𝐄𝐀𝐓𝐎𝐑:➤𝐓A̶𝙽𝙱𝕚𝗥_☜۵༎࿐`,

          mentions: [
            {
              tag: name1,
              id: user1,
            },
            {
              tag: name2,
              id: user2,
            },
          ],

          attachment: fs.createReadStream(
            imgPath
          ),
        },
        threadID
      );

      // =========================
      // DELETE CACHE
      // =========================
      setTimeout(() => {
        try {
          if (
            imgPath &&
            fs.existsSync(imgPath)
          ) {
            fs.unlinkSync(imgPath);
          }
        } catch (err) {
          console.error(
            "Cache delete error:",
            err
          );
        }
      }, 15000);

    } catch (error) {
      console.error(
        "PAIR2 ERROR:",
        error
      );

      return api.sendMessage(
        "❌ Pair2 চালাতে সমস্যা হয়েছে!\n🔄 আবার চেষ্টা করো।",
        event.threadID
      );
    }
  },
};
