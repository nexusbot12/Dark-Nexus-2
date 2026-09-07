module.exports.config = {
    name: "hug",
    version: "1.0.4",
    role: 0,
    author: "Tanbir Hosen",
    description: "Hug two users together using custom image canvas",
    category: "love",
    guide: {
        bn: "[mention / reply / UID / profile link]"
    },
    countDowns: 5
};

module.exports.onLoad = async function () {
    const fs = require("fs-extra");
    const path = require("path");
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }
    console.log("[ HUG CMD ] -> Loaded successfully by Auditor: রাসেল মাহমুদ");
};

module.exports.onStart = async function ({ api, event, args, Users }) {
    const axios = require("axios");
    const fs = require("fs-extra");
    const path = require("path");
    const { createCanvas, loadImage } = require("canvas");

    try {
        let senderID = event.senderID;
        let mentionID = null;

        // ১. Mention
        if (event.mentions && Object.keys(event.mentions).length > 0) {
            mentionID = Object.keys(event.mentions)[0];
        } 
        // ২. Reply
        else if (event.type === "message_reply") {
            mentionID = event.messageReply.senderID;
        } 
        // ৩. UID / Profile Link
        else if (args.length > 0) {
            let input = args[0];
            if (!isNaN(input)) {
                mentionID = input;
            } else if (input.includes("facebook.com") || input.includes("fb.com")) {
                let match = input.match(/(?:(?:http|https):\/\/)?(?:www\.)?(?:facebook\.com|fb\.com)\/(?:profiles\/|profile\.php\?id=|)([\w\.]+)/);
                if (match && match[1]) {
                    mentionID = match[1];
                }
            }
        }

        if (!mentionID) {
            return api.sendMessage("দয়া করে কাকে জড়িয়ে ধরতে চান তাকে মেনশন, রিপ্লাই, UID অথবা প্রোফাইল লিঙ্ক দিন।", event.threadID, event.messageID);
        }

        // Gender Check
        let senderGender = 2; // Default Male
        try {
            let senderInfo = await Users.getInfo(senderID);
            if (senderInfo && senderInfo.gender) {
                senderGender = senderInfo.gender;
            }
        } catch (e) {
            console.log("Gender fetch error, using default.");
        }

        let boyID, girlID;
        if (senderGender === 1 || senderGender === "FEMALE") { 
            girlID = senderID;
            boyID = mentionID;
        } else { 
            boyID = senderID;
            girlID = mentionID;
        }

        // Direct Facebook Avatar Link without token dependency
        const bgUrl = "https://i.imgur.com/bY1EtWL.jpeg";
        const boyAvatarUrl = `https://graph.facebook.com/${boyID}/picture?width=500&height=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const girlAvatarUrl = `https://graph.facebook.com/${girlID}/picture?width=500&height=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

        const defaultAvatar = "https://i.imgur.com/6V3Z1oM.png";

        let bgImg, boyImg, girlImg;
        try {
            bgImg = await loadImage(bgUrl);
        } catch(e) {
            return api.sendMessage("ব্যাকগ্রাউন্ড ইমেজ লোড হতে সমস্যা হয়েছে।", event.threadID, event.messageID);
        }

        try { boyImg = await loadImage(boyAvatarUrl); } catch(e) { boyImg = await loadImage(defaultAvatar); }
        try { girlImg = await loadImage(girlAvatarUrl); } catch(e) { girlImg = await loadImage(defaultAvatar); }

        const canvas = createCanvas(bgImg.width, bgImg.height);
        const ctx = canvas.getContext("2d");

        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

        function drawCircularAvatar(img, x, y, radius, borderWidth, borderColor) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, radius + borderWidth, 0, Math.PI * 2, true);
            ctx.fillStyle = borderColor;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
            ctx.restore();
        }

        const boyX = canvas.width * 0.48;
        const boyY = canvas.height * 0.23;
        const boyRadius = canvas.width * 0.14;

        const girlX = canvas.width * 0.44;
        const girlY = canvas.height * 0.45;
        const girlRadius = canvas.width * 0.11; 

        drawCircularAvatar(boyImg, boyX, boyY, boyRadius, 4, "#FFFFFF");
        drawCircularAvatar(girlImg, girlX, girlY, girlRadius, 4, "#FFFFFF");

        const cacheDir = path.join(__dirname, "cache");
        fs.ensureDirSync(cacheDir);
        const cachePath = path.join(cacheDir, `hug_${senderID}_${mentionID}.png`);
        
        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(cachePath, buffer);

        return api.sendMessage(
            {
                body: "❤️ জাঁকজমকপূর্ণ কোলাকুলি! ❤️\n\n- Owner: 一 ➤𝐓A̶𝙽𝙱𝕚𝗥_☜۵༎࿐",
                attachment: fs.createReadStream(cachePath)
            },
            event.threadID,
            () => {
                if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
            },
            event.messageID
        );

    } catch (error) {
        console.error("[HUG ERROR]:", error);
        return api.sendMessage(`কমান্ড চালাতে সমস্যা হয়েছে: ${error.message || error}`, event.threadID, event.messageID);
    }
};
