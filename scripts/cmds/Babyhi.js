module.exports = {
  config: {
    name: "babyhi",
    version: "1.2.0",
    hasPermssion: 0,
    credits: "Rasel Mahmud",
    description: "Auto replies with styled 'Type ➔ *baby hi' on specific keywords and unsends after 5 seconds",
    commandCategory: "noprefix",
    usages: "bot / baby / robot / বট / jan / bby",
    cooldowns: 1
  },

  handleEvent: async function ({ api, event }) {
    if (!event.body) return;

    const messageText = event.body.toLowerCase().trim();

    // 🛑 ১. ইউজার যদি ইতোমধ্যে 'baby hi' বা '*baby hi' লিখে ফেলে, তবে বট ইগনোর করবে
    if (messageText.includes("baby hi") || messageText.includes("*baby hi")) {
      return;
    }

    const keywords = ["bot", "baby", "robot", "বট", "jan", "bby"];

    // 🎯 ২. কি-ওয়ার্ড চেক
    const isTriggered = keywords.some(keyword => {
      const regex = new RegExp(`(?:^|\\s)${keyword}(?:$|\\s)`, "i");
      return regex.test(messageText);
    });

    if (isTriggered) {
      // 🎨 সুন্দর ডিজাইনের মেসেজ
      const styledMsg = 
        "✨ ───────────── ✨\n" +
        "  Type ➔ *𝙗𝙖𝙗𝙮 𝙝𝙞 \n" +
        "✨ ───────────── ✨";

      api.sendMessage(
        styledMsg,
        event.threadID,
        (err, info) => {
          if (err) return;

          // ⏳ ৫ সেকেন্ড পর আনসেন্ড
          setTimeout(() => {
            api.unsendMessage(info.messageID);
          }, 5000);
        },
        event.messageID
      );
    }
  },

  onChat: async function (context) {
    return this.handleEvent(context);
  },

  onStart: async function ({ api, event }) {
    return api.sendMessage("⚠️ এই কমান্ডের জন্য প্রিফিক্স লাগবে না!", event.threadID, event.messageID);
  }
};
