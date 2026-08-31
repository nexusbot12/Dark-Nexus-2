module.exports.config = {
    name: "propose",
    aliases: ["প্রপোজ", "lovepropose"],
    version: "1.0.0",
    role: 0,
    author: "Rasel Mahmud",
    description: "Propose to someone with a custom canvas background",
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
    console.log("[ PROPOSE CMD ] -> Loaded successfully by: Rasel Mahmud");
};

module.exports.onStart = async function ({ api, event, args, Users }) {
    const axios = require("axios");
    const fs = require("fs-extra");
    const path = require("path");
    const { createCanvas, loadImage } = require("canvas");

    // ১. লোডিং ইমোজি রিঅ্যাক্ট (⌛)
    try {
        await api.setMessageReaction("⌛", event.messageID, (err) => {}, true);
    } catch (e) {}

    try {
        let senderID = event.senderID;
        let mentionID = null;

        // Mention
        if (event.mentions && Object.keys(event.mentions).length > 0) {
            mentionID = Object.keys(event.mentions)[0];
        } 
        // Reply
        else if (event.type === "message_reply") {
            mentionID = event.messageReply.senderID;
        } 
        // UID / Link
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
            await api.setMessageReaction("❌", event.messageID, (err) => {}, true);
            return api.sendMessage("দয়া করে কাকে প্রপোজ করতে চান তাকে মেনশন, রিপ্লাই, UID অথবা প্রোফাইল লিঙ্ক দিন।", event.threadID, event.messageID);
        }

        // Gender Check Logic
        let senderGender = 2; // Default Male
        try {
            let senderInfo = await Users.getInfo(senderID);
            if (senderInfo && senderInfo.gender) {
                senderGender = senderInfo.gender;
            }
        } catch (e) {}

        let boyID, girlID;
        if (senderGender === 1 || senderGender === "FEMALE") { 
            girlID = senderID;
            boyID = mentionID;
        } else { 
            boyID = senderID;
            girlID = mentionID;
        }

        const bgUrl = "https://i.imgur.com/aDFnNFk.jpeg";
        const boyAvatarUrl = `https://graph.facebook.com/${boyID}/picture?width=500&height=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const girlAvatarUrl = `https://graph.facebook.com/${girlID}/picture?width=500&height=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const defaultAvatar = "https://i.imgur.com/6V3Z1oM.png";

        let bgImg, boyImg, girlImg;
        try {
            bgImg = await loadImage(bgUrl);
        } catch (e) {
            await api.setMessageReaction("❌", event.messageID, (err) => {}, true);
            return api.sendMessage("ব্যাকগ্রাউন্ড ইমেজ লোড করতে সমস্যা হয়েছে।", event.threadID, event.messageID);
        }

        try { boyImg = await loadImage(boyAvatarUrl); } catch (e) { boyImg = await loadImage(defaultAvatar); }
        try { girlImg = await loadImage(girlAvatarUrl); } catch (e) { girlImg = await loadImage(defaultAvatar); }

        const canvas = createCanvas(bgImg.width, bgImg.height);
        const ctx = canvas.getContext("2d");

        // ব্যাকগ্রাউন্ড ড্র
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

        // গোলাকার অবতার ড্র ফাংশন
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

        // ছেলে ও মেয়ের মাথার পজিশন ও সাইজ
        const boyX = canvas.width * 0.28;
        const boyY = canvas.height * 0.22;
        const boyRadius = canvas.width * 0.10;

        const girlX = canvas.width * 0.77;
        const girlY = canvas.height * 0.17;
        const girlRadius = canvas.width * 0.09;

        // সার্কেল রেন্ডারিং
        drawCircularAvatar(boyImg, boyX, boyY, boyRadius, 3, "#FFFFFF");
        drawCircularAvatar(girlImg, girlX, girlY, girlRadius, 3, "#FFFFFF");

        const cacheDir = path.join(__dirname, "cache");
        fs.ensureDirSync(cacheDir);
        const cachePath = path.join(cacheDir, `propose_${senderID}_${mentionID}.png`);

        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(cachePath, buffer);

        // ২. সফল হলে সাকসেস ইমোজি রিঅ্যাক্ট (✅)
        await api.setMessageReaction("✅", event.messageID, (err) => {}, true);

        return api.sendMessage(
            {
                body: "💍 তুমি কি আমার ভালোবাসার অংশ হবে? 💍\n\n- Rasel Mahmud",
                attachment: fs.createReadStream(cachePath)
            },
            event.threadID,
            () => {
                if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
            },
            event.messageID
        );

    } catch (error) {
        console.error("[PROPOSE ERROR]:", error);
        // ৩. ব্যর্থ হলে ক্রস ইমোজি রিঅ্যাক্ট (❌)
        await api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage("কমান্ডটি প্রসেস করতে সমস্যা হয়েছে।", event.threadID, event.messageID);
    }
};
