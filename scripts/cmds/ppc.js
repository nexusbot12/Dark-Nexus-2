const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports.config = {
    name: "ppc",
    aliases: ["pfpc", "changepp", "setpp"],
    version: "1.0.0",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 2, // Admin Only
    description: "Change the bot's Facebook account profile picture",
    category: "admin",
    guide: {
        en: "{pn} [reply to an image] OR {pn} [Image_URL] OR {pn} (reads from account.txt if no input)"
    }
};

module.exports.onStart = async ({ api, event, args }) => {
    let imageUrl = null;

    try {
        if (event.type === "message_reply" && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
            if (event.messageReply.attachments[0].type === "photo") {
                imageUrl = event.messageReply.attachments[0].url;
            }
        } 
        else if (args[0] && args[0].startsWith("http")) {
            imageUrl = args[0];
        } 
        else {
            const txtPath = path.join(process.cwd(), 'account.txt');
            if (fs.existsSync(txtPath)) {
                const content = fs.readFileSync(txtPath, 'utf-8');
                const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                
                const link = lines.find(l => l.startsWith('http://') || l.startsWith('https://'));
                if (link) {
                    imageUrl = link;
                }
            }
        }

        if (!imageUrl) {
            return api.sendMessage(
                "❌ কোনো ছবি বা ইমেজ লিংক পাওয়া যায়নি!\n\n" +
                "👉 যেকোনো একটি ছবির ওপর রিপ্লাই করে `/ppc` লিখুন\n" +
                "👉 অথবা ছবির লিংক দিন: `/ppc https://...`",
                event.threadID,
                event.messageID
            );
        }

        api.sendMessage("⏳ প্রোফাইল পিকচার আপডেট করা হচ্ছে, একটু অপেক্ষা করুন...", event.threadID, event.messageID);

        const response = await axios.get(imageUrl, { responseType: 'stream' });

        if (typeof api.changeAvatar === 'function') {
            api.changeAvatar(response.data, "Updated by Rasel Mahmud", null, (err) => {
                if (err) {
                    console.error(err);
                    return api.sendMessage(`❌ প্রোফাইল পিকচার পরিবর্তন করতে ব্যর্থ হয়েছে!\nError: ${err.message || err}`, event.threadID, event.messageID);
                }
                return api.sendMessage("✅ সফলভাবে বটের প্রোফাইল পিকচার পরিবর্তন করা হয়েছে! 🚀", event.threadID, event.messageID);
            });
        } else {
            return api.sendMessage("❌ আপনার ব্যবহৃত FCA প্যাকেজে `changeAvatar` সাপোর্ট করে না।", event.threadID, event.messageID);
        }

    } catch (error) {
        console.error(error);
        return api.sendMessage(`❌ এরর ঘটেছে: ${error.message}`, event.threadID, event.messageID);
    }
};
