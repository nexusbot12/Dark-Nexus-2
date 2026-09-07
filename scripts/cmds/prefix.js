const fs = require("fs-extra");
const { utils } = global;

module.exports = {
	config: {
		name: "prefix",
		version: "2.1",
		author: "𝐓𝐚𝐧𝐛𝐢𝐫 𝐇𝐨𝐬𝐞𝐧",
		countDown: 5,
		role: 0,
		description: "Change bot prefix in your chat box or entire bot system (bot admin only)",
		category: "config",
		guide: {
			en: "   {pn} <new prefix>: change prefix in your chat box"
				+ "\n   Example:"
				+ "\n    {pn} #"
				+ "\n\n   {pn} <new prefix> -g: change prefix in entire bot system (bot admin only)"
				+ "\n   Example:"
				+ "\n    {pn} # -g"
				+ "\n\n   {pn} reset: reset prefix in your chat box to default"
		}
	},

	langs: {
		en: {
			reset: "Your prefix has been reset to default: %1",
			onlyAdmin: "Only bot admin can change system prefix",
			confirmGlobal: "Please react to this message to confirm changing system prefix",
			confirmThisThread: "Please react to this message to confirm changing prefix in your chat box",
			successGlobal: "Changed system prefix to: %1",
			successThisThread: "Changed prefix in your chat box to: %1"
		}
	},

	onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
		if (!args[0])
			return message.SyntaxError();

		if (args[0] === 'reset') {
			await threadsData.set(event.threadID, null, "data.prefix");
			return message.reply(getLang("reset", global.GoatBot.config.prefix));
		}

		const newPrefix = args[0];
		const formSet = {
			commandName,
			author: event.senderID,
			newPrefix
		};

		if (args[1] === "-g") {
			if (role < 2)
				return message.reply(getLang("onlyAdmin"));
			else
				formSet.setGlobal = true;
		} else {
			formSet.setGlobal = false;
		}

		return message.reply(args[1] === "-g" ? getLang("confirmGlobal") : getLang("confirmThisThread"), (err, info) => {
			if (err) return;
			formSet.messageID = info.messageID;
			global.GoatBot.onReaction.set(info.messageID, formSet);
		});
	},

	onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
		const { author, newPrefix, setGlobal, messageID } = Reaction;
		if (event.userID !== author)
			return;

		global.GoatBot.onReaction.delete(messageID);

		if (setGlobal) {
			global.GoatBot.config.prefix = newPrefix;
			fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			return message.reply(getLang("successGlobal", newPrefix));
		} else {
			await threadsData.set(event.threadID, newPrefix, "data.prefix");
			return message.reply(getLang("successThisThread", newPrefix));
		}
	},

	onChat: async function ({ event, message, api }) {
		if (event.body && event.body.toLowerCase() === "prefix") {
			try {
				const systemPrefix = global.GoatBot.config.prefix;
				const threadPrefix = utils.getPrefix(event.threadID);

				let senderName = "User";
				try {
					const userInfo = await api.getUserInfo(event.senderID);
					senderName = userInfo[event.senderID]?.name || "User";
				} catch (e) {
					console.error("Error getting user info:", e);
				}

				const imageURLs = [
					"https://files.catbox.moe/q2gtad.jpg",
					"https://files.catbox.moe/1s7ctu.jpg",
					"https://files.catbox.moe/f4kdt2.jpg",
					"https://files.catbox.moe/axh9be.jpg",
					"https://files.catbox.moe/qkpqy8.jpg",
					"https://files.catbox.moe/qbdyrr.jpg",
					"https://files.catbox.moe/rvmbip.jpg",
					"https://files.catbox.moe/wfngzy.jpg",
					"https://files.catbox.moe/1xdv8z.jpg",
					"https://files.catbox.moe/fmn527.jpg",
					"https://files.catbox.moe/et8m45.jpg",
					"https://files.catbox.moe/pjxmue.jpg",
					"https://files.catbox.moe/7kndmf.jpg",
					"https://files.catbox.moe/o8cgcm.jpg",
					"https://files.catbox.moe/2nd2gq.jpg",
					"https://files.catbox.moe/ohqfdz.jpg",
					"https://files.catbox.moe/z129vp.jpg",
					"https://files.catbox.moe/qwtstf.jpg",
					"https://files.catbox.moe/6l8g10.jpg",
					"https://files.catbox.moe/pwj189.jpg",
					"https://files.catbox.moe/fnrdcx.jpg",
					"https://files.catbox.moe/xgtccm.jpg",
					"https://files.catbox.moe/7d5liz.jpg",
					"https://files.catbox.moe/14vljp.jpg",
					"https://files.catbox.moe/9l0u7j.jpg",
					"https://files.catbox.moe/3qz0ze.jpg",
					"https://files.catbox.moe/wq9879.jpg",
					"https://files.catbox.moe/jkivl3.jpg",
					"https://files.catbox.moe/ffsge2.jpg",
					"https://files.catbox.moe/7a4nsg.jpg",
					"https://files.catbox.moe/d34419.jpg",
					"https://files.catbox.moe/de4mz6.jpg",
					"https://files.catbox.moe/pq0tan.jpg",
					"https://files.catbox.moe/t50bm5.jpg"
				];

				const botName = "𝐃𝐚𝐫𝐤•𝐍𝐞𝐱𝐮𝐬";
				const ownerName = "𝐓𝐚𝐧𝐛𝐢𝐫 𝐇𝐨𝐬𝐞𝐧";
				const ownerLink = "https://www.facebook.com/share/19V3zX5mPd/";

				const selectedImageURL = imageURLs[Math.floor(Math.random() * imageURLs.length)];

				const formattedMessage = 
					`╔════❰ 𝐃𝐀𝐑𝐊•𝐍𝐄𝐗𝐔𝐒 ❱═══╗\n` +
					`🕋 𝐀𝐒𝐒𝐀𝐋𝐀𝐌𝐔𝐀𝐋𝐀𝐈𝐊𝐔𝐌 🕋\n` +
					`👋 𝐇𝐞𝐲, ${senderName} 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐓𝐨 ${botName}\n\n` +
					`━━━━━━━━━━━━━━━━━━━━\n` +
					`🧊 𝐀𝐈 𝐀𝐬𝐬𝐢𝐬𝐭𝐚𝐧𝐭 | 𝐀𝐜𝐭𝐢𝐯𝐞 & 𝐒𝐭𝐚𝐛𝐥𝐞\n` +
					`━━━━━━━━━━━━━━━━━━━━\n\n` +
					`🌐 𝐒𝐲𝐬𝐭𝐞𝐦 𝐏𝐫𝐞𝐟𝐢𝐱 : ${systemPrefix}\n` +
					`💬 𝐂𝐡𝐚𝐭 𝐏𝐫𝐞𝐟𝐢𝐱   : ${threadPrefix}\n` +
					`━━━━━━━━━━━━━━━━━━━━\n\n` +
					`👑 𝐎𝐰𝐧𝐞𝐫 : ${ownerName}\n` +
					`🔗 ${ownerLink}\n\n` +
					`╚═══════════════════╝`;

				try {
					const imgStream = await global.utils.getStreamFromURL(selectedImageURL);
					await message.reply({
						body: formattedMessage,
						attachment: imgStream
					});
				} catch (mediaError) {
					console.error("Media error, fallback to text:", mediaError);
					await message.reply(formattedMessage);
				}

			} catch (error) {
				console.error("Error in prefix command:", error);
				const systemPrefix = global.GoatBot?.config?.prefix || "!";
				const threadPrefix = utils.getPrefix(event.threadID) || systemPrefix;

				const fallbackMessage = 
					`╔════❰ 𝐃𝐀𝐑𝐊•𝐍𝐄𝐗𝐔𝐒 ❱═══╗\n` +
					`🌐 𝐒𝐲𝐬𝐭𝐞𝐦 𝐏𝐫𝐞𝐟𝐢𝐱 : ${systemPrefix}\n` +
					`💬 𝐂𝐡𝐚𝐭 𝐏𝐫𝐞𝐟𝐢𝐱   : ${threadPrefix}\n\n` +
					`👑 𝐎𝐰𝐧𝐞𝐫 : 𝐓𝐚𝐧𝐛𝐢𝐫 𝐇𝐨𝐬𝐞𝐧\n` +
					`🔗 https://www.facebook.com/share/19V3zX5mPd/\n\n` +
					`╚═══════════════════╝`;

				await message.reply(fallbackMessage);
			}
		}
	}
};
