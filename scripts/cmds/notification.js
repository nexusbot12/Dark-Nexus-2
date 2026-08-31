const fs = require("fs");
const path = require("path");
const axios = require("axios");

// 🛠️ ইনবক্স ভিডিও প্রসেসিং ফিক্সসহ পাওয়ারফুল মিডিয়া ডাউনলোডার
async function getAttachmentsStream(attachments) {
	if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
		return { streams: [], cleanup: () => {} };
	}

	const cacheDir = path.join(__dirname, "cache");
	if (!fs.existsSync(cacheDir)) {
		fs.mkdirSync(cacheDir, { recursive: true });
	}

	const cacheFiles = [];
	const streams = [];

	for (let i = 0; i < attachments.length; i++) {
		const item = attachments[i];
		
		// 📌 ইনবক্সের ভিডিও ও মিডিয়ার সমস্ত সম্ভাব্য লিংক চেক
		let mediaUrl = item.playableUrl || item.sdUrl || item.hdUrl || item.url || item.largePreviewUrl || item.previewUrl || item.downloadUrl;
		
		if (!mediaUrl) continue;

		// 📌 ফেসবুক সিকিউরিটি লিংক ফিল্টার
		if (mediaUrl.includes("facebook.com/l.php") || mediaUrl.includes("l.facebook.com")) {
			try {
				const parsed = new URL(mediaUrl);
				const realUrl = parsed.searchParams.get("u");
				if (realUrl) mediaUrl = realUrl;
			} catch (_) {}
		}

		let ext = "png";
		if (item.type === "video") ext = "mp4";
		else if (item.type === "audio" || item.type === "voice_message") ext = "mp3";
		else if (item.type === "animated_image" || item.type === "gif") ext = "gif";

		const filePath = path.join(cacheDir, `att_${Date.now()}_${i}.${ext}`);

		// 📌 ইনবক্স ভিডিওর জন্য ২-৩ বার রিট্রাই মেকানিজম (ফেসবুক প্রসেস হওয়া পর্যন্ত ওয়েট করবে)
		for (let retry = 0; retry < 3; retry++) {
			try {
				if (retry > 0) {
					await new Promise(resolve => setTimeout(resolve, 2000)); // ২ সেকেন্ড অপেক্ষা
				}

				const response = await axios({
					method: "GET",
					url: mediaUrl,
					responseType: "arraybuffer",
					timeout: 120000, // ১২০ সেকেন্ড পর্যন্ত অপেক্ষা করবে
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
						'Accept': '*/*',
						'Referer': 'https://www.facebook.com/'
					},
					maxRedirects: 10
				});

				// ফাইল সঠিকভাবে নামলে ক্যাশে সেভ করে লুপ বন্ধ করবে
				if (response.data && response.data.byteLength > 1000) {
					fs.writeFileSync(filePath, Buffer.from(response.data));
					streams.push(fs.createReadStream(filePath));
					cacheFiles.push(filePath);
					break;
				}
			} catch (e) {
				console.error(`Attempt ${retry + 1} download error:`, e.message);
			}
		}
	}

	const cleanup = () => {
		setTimeout(() => {
			for (const f of cacheFiles) {
				if (fs.existsSync(f)) {
					try { fs.unlinkSync(f); } catch (_) {}
				}
			}
		}, 30000); // ৩০ সেকেন্ড পর ক্যাশ পরিষ্কার
	};

	return { streams, cleanup };
}

module.exports = {
	config: {
		name: "notification",
		aliases: ["notify", "noti"],
		version: "2.7.0",
		author: "NTKhang Fixed By Rasel & Upgraded",
		countDown: 5,
		role: 2,
		description: {
			vi: "Gửi thông báo đến tất cả hoặc nhóm cụ thể và trò chuyện 2 chiều",
			en: "Send notification to all or a specific group with 2-way reply"
		},
		category: "owner",
		guide: {
			en: "সব গ্রুপে পাঠাতে: {pn} <মেসেজ> (অথবা মিডিয়াতে রিপ্লাই দিন)\nনির্দিষ্ট গ্রুপে পাঠাতে: {pn} <TID বা গ্রুপের নাম> | <মেসেজ>"
		},
		envConfig: {
			delayPerGroup: 250
		}
	},

	langs: {
		vi: {
			missingMessage: "Vui lòng nhập tin nhắn bạn muốn gửi",
			sendingNotification: "📡 Đang gửi thông báo đến %1 nhóm...\n⏳ Vui lòng chờ...",
			sentNotification: "📊 Kết quả thông báo\n─────────────────────\n✅ Thành công : %1 nhóm",
			errorSendingNotification: "❌ Thất bại   : %1 nhóm\n%2"
		},
		en: {
			missingMessage: "Please enter the message you want to send",
			sendingNotification: "📡 Sending notification to %1 groups...\n⏳ Please wait...",
			sentNotification: "📊 Notification Report\n─────────────────────\n✅ Success : %1 groups",
			errorSendingNotification: "❌ Failed  : %1 groups\n%2"
		},
		bn: {
			missingMessage: "অনুগ্রহ করে পাঠাতে চান এমন message লিখুন",
			sendingNotification: "📡 %1 টি গ্রুপে নোটিফিকেশন পাঠানো হচ্ছে...\n⏳ অপেক্ষা করুন...",
			sentNotification: "📊 নোটিফিকেশন রিপোর্ট\n─────────────────────\n✅ সফল : %1 টি গ্রুপ",
			errorSendingNotification: "❌ ব্যর্থ : %1 টি গ্রুপ\n%2"
		}
	},

	onStart: async function ({ message, api, event, args, commandName, envCommands, threadsData, usersData, getLang }) {
		const { delayPerGroup } = envCommands[commandName];

		const isReply = event.type === "message_reply" && event.messageReply;
		const repliedBody = isReply ? (event.messageReply.body || "") : "";
		const rawAttachments = [
			...(event.attachments || []),
			...(isReply ? (event.messageReply.attachments || []) : [])
		];

		const senderID = event.senderID;
		const senderName = await usersData.get(senderID, "name") || "Admin";

		const allThreads = (await threadsData.getAll()).filter(t => t.isGroup && t.members.find(m => m.userID == api.getCurrentUserID())?.inGroup);

		let targetThreads = [];
		let msgText = "";
		const fullText = args.join(" ");

		if (fullText.includes("|")) {
			const parts = fullText.split("|");
			const targetQuery = parts[0].trim().toLowerCase();
			const textAfterPipe = parts.slice(1).join("|").trim();

			msgText = textAfterPipe || repliedBody;

			targetThreads = allThreads.filter(t => 
				String(t.threadID) === targetQuery || 
				(t.threadName && t.threadName.toLowerCase().includes(targetQuery))
			);

			if (targetThreads.length === 0) {
				return message.reply(`❌ '${targetQuery}' নাম বা TID-এর কোনো গ্রুপ পাওয়া যায়নি!`);
			}
		} else {
			targetThreads = allThreads;
			msgText = fullText || repliedBody;
		}

		const { streams, cleanup } = await getAttachmentsStream(rawAttachments);

		if (!msgText && streams.length === 0) {
			return message.reply("❌ অনুগ্রহ করে মেসেজ লিখুন, মিডিয়া যুক্ত করুন অথবা কোনো মেসেজে রিপ্লাই দিয়ে কমান্ড দিন!\n\n📌 **ব্যবহার পদ্ধতি:**\n১. সব গ্রুপে: `noti <মেসেজ>` (অথবা রিপ্লাই দিয়ে `noti`)\n২. নির্দিষ্ট গ্রুপে: `noti <গ্রুপ নাম/TID> | <মেসেজ>`");
		}

		const bodyText = msgText || (streams.length > 0 ? "📷 [Media Attached]" : "");
		const body = `📢 **ADMIN NOTIFICATION**\n─────────────────────\n  ${bodyText}\n─────────────────────\n👤 ${senderName}\n\n💬 *(এডমিনকে মেসেজ পাঠাতে এই নোটিফিকেশনে রিপ্লাই দিন)*`;

		const formSend = {
			body,
			mentions: [{ tag: senderName, id: senderID }]
		};

		if (streams.length > 0) {
			formSend.attachment = streams;
		}

		message.reply(getLang("sendingNotification", targetThreads.length));

		let sendSucces = 0;
		const sendError = [];

		for (const thread of targetThreads) {
			const tid = thread.threadID;
			try {
				const info = await api.sendMessage(formSend, tid);
				
				if (info && info.messageID) {
					global.GoatBot.onReply.set(info.messageID, {
						commandName,
						type: "userReply",
						threadID: tid,
						adminID: senderID
					});
				}

				sendSucces++;
				await new Promise(resolve => setTimeout(resolve, delayPerGroup));
			} catch (e) {
				sendError.push({ threadIDs: [tid], errorDescription: e?.error || e?.message || String(e) });
			}
		}

		cleanup();

		let msg = "";
		if (sendSucces > 0)
			msg += getLang("sentNotification", sendSucces) + "\n";
		if (sendError.length > 0)
			msg += getLang("errorSendingNotification", sendError.reduce((a, b) => a + b.threadIDs.length, 0), sendError.reduce((a, b) => a + `\n • ${b.errorDescription}\n   └ ${b.threadIDs.join(", ")}`, ""));
		message.reply(msg);
	},

	// 🔄 দ্বিমুখী মেসেজিং ও রিপ্লাই হ্যান্ডলার
	onReply: async function ({ api, event, Reply, usersData, threadsData }) {
		const { senderID, threadID, body, attachments, messageID } = event;
		const { type, adminID, threadID: targetThreadID, userMsgID } = Reply;

		// 📩 ১. গ্রুপ সদস্য নোটিফিকেশনে রিপ্লাই দিলে তা এডমিন ইনবক্সে যাবে
		if (type === "userReply") {
			try {
				const userName = await usersData.get(senderID, "name") || "Group Member";
				const threadInfo = await threadsData.get(threadID) || {};
				const groupName = threadInfo.threadName || "Unknown Group";

				const { streams, cleanup } = await getAttachmentsStream(attachments);

				const textContent = body || (streams.length > 0 ? "📷 [Media Attached]" : "*(No text)*");

				const msgToAdmin = {
					body: `📩 **REPLY FROM GROUP**\n─────────────────────\n👤 **User:** ${userName}\n📍 **Group:** ${groupName}\n🆔 **Group ID:** ${threadID}\n💬 **Message:** ${textContent}\n─────────────────────\n📌 *উত্তর দিতে এই মেসেজটিতে রিপ্লাই (Reply) দিন।*`
				};

				if (streams.length > 0) {
					msgToAdmin.attachment = streams;
				}

				const info = await api.sendMessage(msgToAdmin, adminID);

				if (info && info.messageID) {
					global.GoatBot.onReply.set(info.messageID, {
						commandName: this.config.name,
						type: "adminReply",
						threadID: threadID,
						userMsgID: messageID,
						adminID: adminID
					});
				}

				cleanup();
				api.sendMessage("✅ আপনার মেসেজটি এডমিনের ইনবক্সে পাঠানো হয়েছে!", threadID, messageID);
			} catch (err) {
				console.error("User Reply Error:", err);
				api.sendMessage("❌ এডমিনকে মেসেজ পাঠাতে ব্যর্থ হয়েছে!", threadID, messageID);
			}
		}

		// 📤 ২. এডমিন ইনবক্স থেকে রিপ্লাই দিলে তা নির্দিষ্ট গ্রুপে যাবে
		else if (type === "adminReply") {
			if (String(senderID) !== String(adminID)) return;

			try {
				const adminName = await usersData.get(adminID, "name") || "Admin";

				// 📌 ইনবক্সের ভিডিও প্রসেসিং
				const { streams, cleanup } = await getAttachmentsStream(attachments);

				const textContent = body || (streams.length > 0 ? "📷 [Media Attached]" : "*(No text)*");

				const msgToGroup = {
					body: `📩 **ADMIN REPLY**\n─────────────────────\n💬 ${textContent}\n─────────────────────\n👤 **From:** ${adminName}\n\n💬 *(পুনরায় এডমিনকে মেসেজ দিতে এই মেসেজে রিপ্লাই দিন)*`
				};

				if (streams.length > 0) {
					msgToGroup.attachment = streams;
				}

				const info = await api.sendMessage(msgToGroup, targetThreadID, userMsgID);

				if (info && info.messageID) {
					global.GoatBot.onReply.set(info.messageID, {
						commandName: this.config.name,
						type: "userReply",
						threadID: targetThreadID,
						adminID: adminID
					});
				}

				cleanup();
				api.sendMessage("✅ গ্রুপে উত্তর সফলভাবে পাঠানো হয়েছে!", threadID, messageID);
			} catch (err) {
				console.error("Admin Reply Error:", err);
				api.sendMessage("❌ গ্রুপে উত্তর পাঠাতে ব্যর্থ হয়েছে!", threadID, messageID);
			}
		}
	}
};
