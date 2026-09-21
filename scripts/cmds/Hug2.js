module.exports.config = {
    name: "hug2",
    version: "1.0.5",
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
    console.log("[ HUG2 CMD ] -> Loaded successfully");
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

        const bgUrl = "https://i.imgur.com/vJpBbyF.jpeg";

        const getAvatar = async (id) => {
            const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
            const urls = [
                `https://graph.facebook.com/${id}/picture?height=500&width=500&access_token=${token}`,
                `https://graph.facebook.com/${id}/picture?type=large`,
                `https://api.vytal.org/avatar/${id}`
            ];

            for (let url of urls) {
                try {
                    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 7000 });
                    if (res.data && res.data.length > 3000) {
                        return await loadImage(Buffer.from(res.data, "utf-8"));
                    }
                } catch (e) {
                    continue;
                }
            }
            return await loadImage("https://i.imgur.com/6V3Z1oM.png");
        };

        let bgImg;
        try {
            bgImg = await loadImage(bgUrl);
        } catch(e) {
            return api.sendMessage("ব্যাকগ্রাউন্ড ইমেজ লোড হতে সমস্যা হয়েছে।", event.threadID, event.messageID);
        }

        const [boyImg, girlImg] = await Promise.all([
            getAvatar(boyID),
            getAvatar(girlID)
        ]);

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

        // --- সাইজ সামান্য বড় ও আরেকটু উপরে পজিশন অ্যাডজাস্ট করা হয়েছে ---
        
        // ছেলের (নারুতো) মাথার পজিশন
        const boyX = canvas.width * 0.43;    
        const boyY = canvas.height * 0.17;   // আরও উপরে তোলা হয়েছে
        const boyRadius = canvas.width * 0.095; // সাইজ সামান্য বড় করা হয়েছে

        // মেয়ের (হিনাতা) মাথার পজিশন
        const girlX = canvas.width * 0.28;   
        const girlY = canvas.height * 0.27;  // আরও উপরে তোলা হয়েছে
        const girlRadius = canvas.width * 0.09; // সাইজ সামান্য বড় করা হয়েছে

        drawCircularAvatar(boyImg, boyX, boyY, boyRadius, 3, "#FFFFFF");
        drawCircularAvatar(girlImg, girlX, girlY, girlRadius, 3, "#FFFFFF");

        const cacheDir = path.join(__dirname, "cache");
        fs.ensureDirSync(cacheDir);
        const cachePath = path.join(cacheDir, `hug2_${senderID}_${mentionID}.png`);
        
        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(cachePath, buffer);

        return api.sendMessage(
            {
                body: "Warmest Hugs & Infinite Love! ❤️‍🩹🫂",
                attachment: fs.createReadStream(cachePath)
            },
            event.threadID,
            () => {
                if (fs.existsSync(cachePath)) {
                    fs.unlinkSync(cachePath);
                }
            },
            event.messageID
        );

    } catch (error) {
        console.error("Hug2 command error:", error);
        return api.sendMessage("একটি সমস্যা হয়েছে, আবার চেষ্টা করুন।", event.threadID, event.messageID);
    }
};
