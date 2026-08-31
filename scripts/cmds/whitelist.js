const { config } = global.GoatBot;

module.exports = {
	config: {
		name: "whitelist",
    aliases: ["wl"],
		version: "1.1",
		author: "Rasel Mahmud",
		countDown: 5,
		role: 2,
		longDescription: {
			en: "Add, remove, edit whiteListIds"
		},
		category: "owner",
		guide: {
			en: '   {pn} [add | -a] <uid | @tag | reply>: Add whiteList role for user'
				+ '\n   {pn} [remove | -r] <uid | @tag | reply>: Remove whiteList role of user'
				+ '\n   {pn} [list | -l]: List all whiteList users'
				+ '\n   {pn} [ on | off ]: enable and disable whiteList mode'
		}
	},

	langs: {
		en: {
			added: "╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n✅ 𝐖𝐇𝐈𝐓𝐄𝐋𝐈𝐒𝐓 𝐀𝐃𝐃𝐄𝐃\n╚═══════════════════╝\n\n👑 𝐀𝐝𝐝𝐞𝐝 %1 𝐔𝐬𝐞𝐫(𝐬):\n%2",
			alreadyAdmin: "\n\n⚠️ 𝐀𝐥𝐫𝐞𝐚𝐝𝐲 𝐖𝐡𝐢𝐭𝐞𝐋𝐢𝐬𝐭𝐞𝐝 %1 𝐔𝐬𝐞𝐫(𝐬):\n%2",
			missingIdAdd: "╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n❌ 𝐄𝐑𝐑𝐎𝐑\n╚═══════════════════╝\n\n⚠️ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐭𝐞𝐫 𝐔𝐈𝐃, 𝐦𝐞𝐧𝐭𝐢𝐨𝐧 𝐨𝐫 𝐫𝐞𝐩𝐥𝐲 𝐭𝐨 𝐚𝐝𝐝",
			removed: "╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n✅ 𝐖𝐇𝐈𝐓𝐄𝐋𝐈𝐒𝐓 𝐑𝐄𝐌𝐎𝐕𝐄𝐃\n╚═══════════════════╝\n\n❌ 𝐑𝐞𝐦𝐨𝐯𝐞𝐝 %1 𝐔𝐬𝐞𝐫(𝐬):\n%2",
			notAdmin: "\n\n⚠️ 𝐍𝐨𝐭 𝐖𝐡𝐢𝐭𝐞𝐋𝐢𝐬𝐭𝐞𝐝 %1 𝐔𝐬𝐞𝐫(𝐬):\n%2",
			missingIdRemove: "╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n❌ 𝐄𝐑𝐑𝐎𝐑\n╚═══════════════════╝\n\n⚠️ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐭𝐞𝐫 𝐔𝐈𝐃, 𝐦𝐞𝐧𝐭𝐢𝐨𝐧 𝐨𝐫 𝐫𝐞𝐩𝐥𝐲 𝐭𝐨 𝐫𝐞𝐦𝐨𝐯𝐞",
			listAdmin: "╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n👑 𝐖𝐋 𝐋𝐈𝐒𝐓\n╚═══════════════════╝\n\n%1\n\n╔═══════════════════╗\n║ 𝐎𝐰𝐧𝐞𝐫: 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐡𝐦𝐮𝐝  ║\n╚═══════════════════╝",
			enable: "╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n✅ 𝐖𝐇𝐈𝐓𝐄𝐋𝐈𝐒𝐓 𝐌𝐎𝐃𝐄\n╚═══════════════════╝\n\n🟢 𝐓𝐔𝐑𝐍𝐄𝐃 𝐎𝐍",
			disable: "╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n✅ 𝐖𝐇𝐈𝐓𝐄𝐋𝐈𝐒𝐓 𝐌𝐎𝐃𝐄\n╚═══════════════════╝\n\n🔴 𝐓𝐔𝐑𝐍𝐄𝐃 𝐎𝐅𝐅",
			emptyList: "╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n👑 𝐖𝐋 𝐋𝐈𝐒𝐓\n╚═══════════════════╝\n\n⚠️ 𝐍𝐨 𝐮𝐬𝐞𝐫𝐬 𝐢𝐧 𝐰𝐡𝐢𝐭𝐞𝐥𝐢𝐬𝐭!\n\n╔═══════════════════╗\n║ 𝐎𝐰𝐧𝐞𝐫: 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐡𝐦𝐮𝐝  ║\n╚═══════════════════╝"
		}
	},

	onStart: async function ({ message, args, usersData, event, getLang, api }) {
		const { writeFileSync } = require("fs-extra");

		switch (args[0]) {
			case "add":
			case "-a": {
				let uids = [];
				
				// Reply থেকে UID নেওয়া
				if (event.messageReply) {
					uids.push(event.messageReply.senderID);
				}
				// Mention থেকে UID নেওয়া
				else if (Object.keys(event.mentions).length > 0) {
					uids = Object.keys(event.mentions);
				}
				// Args থেকে UID নেওয়া
				else if (args[1]) {
					uids = args.filter(arg => !isNaN(arg));
				}

				if (uids.length === 0)
					return message.reply(getLang("missingIdAdd"));

				const notAdminIds = [];
				const adminIds = [];
				
				for (const uid of uids) {
					if (config.whiteListMode.whiteListIds.includes(uid))
						adminIds.push(uid);
					else
						notAdminIds.push(uid);
				}

				config.whiteListMode.whiteListIds.push(...notAdminIds);
				const getNames = await Promise.all(uids.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

				let msg = "";
				if (notAdminIds.length > 0) {
					const addedUsers = getNames
						.filter(u => notAdminIds.includes(u.uid))
						.map(u => `▸ 👤 ${u.name}\n  └─ 🆔 ${u.uid}`)
						.join("\n\n");
					msg += getLang("added", notAdminIds.length, addedUsers);
				}
				if (adminIds.length > 0) {
					const existUsers = getNames
						.filter(u => adminIds.includes(u.uid))
						.map(u => `▸ 👤 ${u.name}\n  └─ 🆔 ${u.uid}`)
						.join("\n\n");
					msg += getLang("alreadyAdmin", adminIds.length, existUsers);
				}

				return message.reply(msg);
			}

			case "remove":
			case "-r": {
				let uids = [];
				
				// Reply থেকে UID নেওয়া
				if (event.messageReply) {
					uids.push(event.messageReply.senderID);
				}
				// Mention থেকে UID নেওয়া
				else if (Object.keys(event.mentions).length > 0) {
					uids = Object.keys(event.mentions);
				}
				// Args থেকে UID নেওয়া
				else if (args[1]) {
					uids = args.filter(arg => !isNaN(arg));
				}

				if (uids.length === 0)
					return message.reply(getLang("missingIdRemove"));

				const notAdminIds = [];
				const adminIds = [];
				
				for (const uid of uids) {
					if (config.whiteListMode.whiteListIds.includes(uid))
						adminIds.push(uid);
					else
						notAdminIds.push(uid);
				}

				for (const uid of adminIds)
					config.whiteListMode.whiteListIds.splice(config.whiteListMode.whiteListIds.indexOf(uid), 1);

				const getNames = await Promise.all(adminIds.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

				let msg = "";
				if (adminIds.length > 0) {
					const removedUsers = getNames
						.map(u => `▸ 👤 ${u.name}\n  └─ 🆔 ${u.uid}`)
						.join("\n\n");
					msg += getLang("removed", adminIds.length, removedUsers);
				}
				if (notAdminIds.length > 0) {
					const notFoundUsers = uids
						.filter(u => notAdminIds.includes(u))
						.map(u => `▸ 🆔 ${u}`)
						.join("\n\n");
					msg += getLang("notAdmin", notAdminIds.length, notFoundUsers);
				}

				return message.reply(msg);
			}

			case "list":
			case "-l": {
				if (config.whiteListMode.whiteListIds.length === 0) {
					return message.reply(getLang("emptyList"));
				}

				const getNames = await Promise.all(
					config.whiteListMode.whiteListIds.map(uid => 
						usersData.getName(uid).then(name => ({ uid, name }))
					)
				);

				const wlList = getNames
					.map((u, i) => `${i + 1}. 👑 一 ${u.name}\n   └─ 🆔 ${u.uid}`)
					.join("\n\n");

				return message.reply(getLang("listAdmin", wlList));
			}

			case "on": {
				config.whiteListMode.enable = true;
				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
				return message.reply(getLang("enable"));
			}

			case "off": {
				config.whiteListMode.enable = false;
				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
				return message.reply(getLang("disable"));
			}

			default:
				return message.reply(
					"╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n👑 𝐖𝐋 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒\n╚═══════════════════╝\n\n" +
					"📌 /wl add <mention/reply/uid>\n" +
					"📌 /wl remove <mention/reply/uid>\n" +
					"📌 /wl list\n" +
					"📌 /wl on\n" +
					"📌 /wl off\n\n" +
					"╔═══════════════════╗\n║ 𝐎𝐰𝐧𝐞𝐫: 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐡𝐦𝐮𝐝  ║\n╚═══════════════════╝"
				);
		}
	}
};
