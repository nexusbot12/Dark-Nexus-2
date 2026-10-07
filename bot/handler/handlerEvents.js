Const fs = require("fs-extra");
Const nullAndUndefined = [undefined, null];
// const { config } = global.GoatBot;
// const { utils } = global;

Function getType(obj) {
	Return Object.prototype.toString.call(obj).slice(8, -1);
}

Function getRole(threadData, senderID) {
	Const adminBot = global.GoatBot.config.adminBot || [];
	If (!senderID)
		Return 0;
	Const adminBox = threadData ? ThreadData.adminIDs || [] : [];
	Return adminBot.includes(senderID) ? 2 : adminBox.includes(senderID) ? 1 : 0;
}

Function getText(type, reason, time, targetID, lang) {
	Const utils = global.utils;
	If (type == "userBanned")
		Return utils.getText({ lang, head: "handlerEvents" }, "userBanned", reason, time, targetID);
	Else if (type == "threadBanned")
		Return utils.getText({ lang, head: "handlerEvents" }, "threadBanned", reason, time, targetID);
	Else if (type == "onlyAdminBox")
		Return utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBox");
	Else if (type == "onlyAdminBot")
		Return utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBot");
}

Function replaceShortcutInLang(text, prefix, commandName) {
	Return text
		.replace(/\{(?:p|prefix)\}/g, prefix)
		.replace(/\{(?:n|name)\}/g, commandName)
		.replace(/\{pn\}/g, `${prefix}${commandName}`);
}

Function getRoleConfig(utils, command, isGroup, threadData, commandName) {
	Let roleConfig;
	If (utils.isNumber(command.config.role)) {
		RoleConfig = {
			OnStart: command.config.role
		};
	}
	Else if (typeof command.config.role == "object" && !Array.isArray(command.config.role)) {
		If (!command.config.role.onStart)
			Command.config.role.onStart = 0;
		RoleConfig = command.config.role;
	}
	Else {
		RoleConfig = {
			OnStart: 0
		};
	}

	If (isGroup)
		RoleConfig.onStart = threadData.data.setRole?.[commandName] ?? RoleConfig.onStart;

	For (const key of ["onChat", "onStart", "onReaction", "onReply"]) {
		If (roleConfig[key] == undefined)
			RoleConfig[key] = roleConfig.onStart;
	}

	Return roleConfig;
}

Function isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, lang) {
	Const config = global.GoatBot.config;
	Const { adminBot, hideNotiMessage } = config;

	// 🌟 BOT OWNER CHECK
	Const isBotOwner = (adminBot || []).includes(senderID);

	// check if user banned
	Const infoBannedUser = userData.banned;
	If (infoBannedUser.status == true) {
		Const { reason, date } = infoBannedUser;
		If (hideNotiMessage.userBanned == false)
			Message.reply(getText("userBanned", reason, date, senderID, lang));
		Return true;
	}

	// check if only admin bot (Bot Owner Bypass added)
	If (
		Config.adminOnly.enable == true
		&& !isBotOwner
		&& !config.adminOnly.ignoreCommand.includes(commandName)
	) {
		If (hideNotiMessage.adminOnly == false)
			Message.reply(getText("onlyAdminBot", null, null, null, lang));
		Return true;
	}

	// ==========    Check Thread    ========== //
	If (isGroup == true) {
		// 🌟 BOT OWNER BYPASS ADDED HERE (!isBotOwner)
		If (
			ThreadData.data.onlyAdminBox === true
			&& !threadData.adminIDs.includes(senderID)
			&& !isBotOwner
			&& !(threadData.data.ignoreCommanToOnlyAdminBox || []).includes(commandName)
		) {
			// check if only admin box
			If (!threadData.data.hideNotiMessageOnlyAdminBox)
				Message.reply(getText("onlyAdminBox", null, null, null, lang));
			Return true;
		}

		// check if thread banned
		Const infoBannedThread = threadData.banned;
		If (infoBannedThread.status == true) {
			Const { reason, date } = infoBannedThread;
			If (hideNotiMessage.threadBanned == false)
				Message.reply(getText("threadBanned", reason, date, threadID, lang));
			Return true;
		}
	}
	Return false;
}


Function createGetText2(langCode, pathCustomLang, prefix, command) {
	Const commandType = command.config.countDown ? "command" : "command event";
	Const commandName = command.config.name;
	Let customLang = {};
	Let getText2 = () => { };
	If (fs.existsSync(pathCustomLang))
		CustomLang = require(pathCustomLang)[commandName]?.text || {};
	If (command.langs || customLang || {}) {
		GetText2 = function (key, ...args) {
			Let lang = command.langs?.[langCode]?.[key] || customLang[key] || "";
			Lang = replaceShortcutInLang(lang, prefix, commandName);
			For (let i = args.length - 1; i >= 0; i--)
				Lang = lang.replace(new RegExp(`%${i + 1}`, "g"), args[i]);
			Return lang || `❌ Can't find text on language "${langCode}" for ${commandType} "${commandName}" with key "${key}"`;
		};
	}
	Return getText2;
}

Module.exports = function (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) {
	Return async function (event, message) {

		Const { utils, client, GoatBot } = global;
		Const { getPrefix, removeHomeDir, log, getTime } = utils;
		Const { config, configCommands: { envGlobal, envCommands, envEvents } } = GoatBot;
		Const { autoRefreshThreadInfoFirstTime } = config.database;
		Let { hideNotiMessage = {} } = config;

		Const { body, messageID, threadID, isGroup } = event;

		// Check if has threadID
		If (!threadID)
			Return;

		Const senderID = event.userID || event.senderID || event.author;

		Let threadData = global.db.allThreadData.find(t => t.threadID == threadID);
		Let userData = global.db.allUserData.find(u => u.userID == senderID);

		If (!userData && !isNaN(senderID))
			UserData = await usersData.create(senderID);

		If (event.isE2EE) {
			If (!threadData)
				ThreadData = { settings: {}, data: {}, adminIDs: [], members: [], banned: { status: false } };
			If (!userData)
				UserData = { userID: senderID, name: "", exp: 0, money: 0, banned: { status: false }, settings: {}, data: {} };
		}
		Else {
			If (!threadData && !isNaN(threadID)) {
				If (global.temp.createThreadDataError.includes(threadID))
					Return;
				ThreadData = await threadsData.create(threadID);
				Global.db.receivedTheFirstMessage[threadID] = true;
			}
			Else {
				If (
					AutoRefreshThreadInfoFirstTime === true
					&& !global.db.receivedTheFirstMessage[threadID]
				) {
					Global.db.receivedTheFirstMessage[threadID] = true;
					Await threadsData.refreshInfo(threadID);
				}
			}
		}

		If (typeof threadData.settings.hideNotiMessage == "object")
			HideNotiMessage = threadData.settings.hideNotiMessage;

		Const prefix = event.isE2EE ? Config.prefix : getPrefix(threadID);
		Const role = getRole(threadData, senderID);
		Const parameters = {
			Api, usersData, threadsData, message, event,
			UserModel, threadModel, prefix, dashBoardModel,
			GlobalModel, dashBoardData, globalData, envCommands,
			EnvEvents, envGlobal, role,
			RemoveCommandNameFromBody: function removeCommandNameFromBody(body_, prefix_, commandName_) {
				If ([body_, prefix_, commandName_].every(x => nullAndUndefined.includes(x)))
					Throw new Error("Please provide body, prefix and commandName to use this function, this function without parameters only support for onStart");
				For (let i = 0; i < arguments.length; i++)
					If (typeof arguments[i] != "string")
						Throw new Error(`The parameter "${i + 1}" must be a string, but got "${getType(arguments[i])}"`);

				Return body_.replace(new RegExp(`^${prefix_}(\\s+|)${commandName_}`, "i"), "").trim();
			}
		};
		Const langCode = threadData.data.lang || config.language || "en";

		Function createMessageSyntaxError(commandName) {
			Message.SyntaxError = async function () {
				Return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "commandSyntaxError", prefix, commandName));
			};
		}

		/*
			+-----------------------------------------------+
			|							 WHEN CALL COMMAND								|
			+-----------------------------------------------+
		*/
		Let isUserCallCommand = false;
		Async function onStart() {
			// —————————————— CHECK USE BOT —————————————— //
			If (!body) return;

			// ══════════ NO PREFIX SYSTEM ══════════
			Const noPrefixEnable = global.GoatBot.config.noPrefix?.enable === true;
			Const isAdminBot = (global.GoatBot.config.adminBot || []).includes(senderID);

			Let usedPrefix = prefix;
			Let bodyToParse = body;

			If (body.startsWith(prefix)) {
				BodyToParse = body;
				UsedPrefix = prefix;
			} else if (noPrefixEnable && isAdminBot) {
				Const possibleCmd = body.trim().split(/ +/)[0].toLowerCase();
				Const cmdExists = GoatBot.commands.has(possibleCmd) || GoatBot.commands.has(GoatBot.aliases.get(possibleCmd));
				If (!cmdExists) return;
				UsedPrefix = "";
				BodyToParse = body;
			} else {
				Return;
			}
			// ═════════════════════════════════════

			Const dateNow = Date.now();
			Const args = bodyToParse.slice(usedPrefix.length).trim().split(/ +/);
			// ————————————  CHECK HAS COMMAND ——————————— //
			Let commandName = args.shift().toLowerCase();
			Let command = GoatBot.commands.get(commandName) || GoatBot.commands.get(GoatBot.aliases.get(commandName));
			// ———————— CHECK ALIASES SET BY GROUP ———————— //
			Const aliasesData = threadData.data.aliases || {};
			For (const cmdName in aliasesData) {
				If (aliasesData[cmdName].includes(commandName)) {
					Command = GoatBot.commands.get(cmdName);
					Break;
				}
			}
			// ————————————— SET COMMAND NAME ————————————— //
			If (command)
				CommandName = command.config.name;
			// ——————— FUNCTION REMOVE COMMAND NAME ———————— //
			Function removeCommandNameFromBody(body_, prefix_, commandName_) {
				If (arguments.length) {
					If (typeof body_ != "string")
						Throw new Error(`The first argument (body) must be a string, but got "${getType(body_)}"`);
					If (typeof prefix_ != "string")
						Throw new Error(`The second argument (prefix) must be a string, but got "${getType(prefix_)}"`);
					If (typeof commandName_ != "string")
						Throw new Error(`The third argument (commandName) must be a string, but got "${getType(commandName_)}"`);

					Return body_.replace(new RegExp(`^${prefix_}(\\s+|)${commandName_}`, "i"), "").trim();
				}
				Else {
					Return body.replace(new RegExp(`^${usedPrefix}(\\s+|)${commandName}`, "i"), "").trim();
				}
			}
			// —————  CHECK BANNED OR ONLY ADMIN BOX  ————— //
			If (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
				Return;
				If (!command) {
				If (!hideNotiMessage.commandNotFound && (!commandName || commandName.trim() === ""))
					Return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "prefixOnly", prefix));
				If (!hideNotiMessage.commandNotFound && commandName) {
					Const input = commandName.toLowerCase();
					Const allCommands = Array.from(GoatBot.commands.keys());
					Function levenDist(a, b) {
						Const m = a.length, n = b.length;
						Const dp = Array.from({length: m+1}, (_, i) => Array.from({length: n+1}, (_, j) => i||j));
						For (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
							Dp[i][j] = a[i-1] === b[j-1] ? Dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
						Return dp[m][n];
					}
					Const scored = allCommands.map(cmd => {
						Const c = cmd.toLowerCase();
						Const substringBonus = input.includes(c) || c.includes(input) ? -100 : 0;
						Return { cmd, score: levenDist(input, c) + substringBonus };
					});
					Scored.sort((a, b) => a.score - b.score);
					Const bestScore = scored[0].score;
					Const top = scored.filter(s => s.score <= bestScore + 1).slice(0, 3).map(s => `› ${prefix}${s.cmd}`);
					Return await message.reply(
						Utils.getText({ lang: langCode, head: "handlerEvents" }, "commandNotFoundSuggestion", top.join("\n"), prefix)
					);
				} else return true;
			}
			// ————————————— CHECK PERMISSION ———————————— //
			Const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			Const needRole = roleConfig.onStart;

			If (needRole > role) {
				If (!hideNotiMessage.needRoleToUseCmd) {
					If (needRole == 1)
						Return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdmin", commandName));
					Else if (needRole == 2)
						Return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminBot2", commandName));
				}
				Else {
					Return true;
				}
			}
			// ———————————————— countDown ———————————————— //
			If (!client.countDown[commandName])
				Client.countDown[commandName] = {};
			Const timestamps = client.countDown[commandName];
			Let getCoolDown = command.config.countDown;
			If (!getCoolDown && getCoolDown != 0 || isNaN(getCoolDown))
				GetCoolDown = 1;
			Const cooldownCommand = getCoolDown * 1000;
			If (timestamps[senderID]) {
				Const expirationTime = timestamps[senderID] + cooldownCommand;
				If (dateNow < expirationTime)
					Return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "waitingForCommand", ((expirationTime - dateNow) / 1000).toString().slice(0, 3)));
			}
			// ——————————————— RUN COMMAND ——————————————— //
			Const time = getTime("DD/MM/YYYY HH:mm:ss");
			IsUserCallCommand = true;
			Try {
				// analytics command call
				(async () => {
					Const analytics = await globalData.get("analytics", "data", {});
					If (!analytics[commandName])
						Analytics[commandName] = 0;
					Analytics[commandName]++;
					Await globalData.set("analytics", analytics, "data");
				})();

				CreateMessageSyntaxError(commandName);
				Const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				Await command.onStart({
					...parameters,
					Args,
					CommandName,
					GetLang: getText2,
					RemoveCommandNameFromBody
				});
				Timestamps[senderID] = dateNow;
				Log.info("CALL COMMAND", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
			}
			Catch (err) {
				Log.err("CALL COMMAND", `An error occurred when calling the command ${commandName}`, err);
				Return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred", time, commandName, removeHomeDir(err.stack ? Err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
			}
		}


		/*
		 +------------------------------------------------+
		 |                    ON CHAT                     |
		 +------------------------------------------------+
		*/
		Async function onChat() {
			Const allOnChat = GoatBot.onChat || [];
			Const args = body ? Body.split(/ +/) : [];
			For (const key of allOnChat) {
				Const command = GoatBot.commands.get(key);
				If (!command)
					Continue;
				Const commandName = command.config.name;

				// —————————————— CHECK PERMISSION —————————————— //
				Const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
				Const needRole = roleConfig.onChat;
				If (needRole > role)
					Continue;

				Const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				Const time = getTime("DD/MM/YYYY HH:mm:ss");
				CreateMessageSyntaxError(commandName);

				If (getType(command.onChat) == "Function") {
					Const defaultOnChat = command.onChat;
					// convert to AsyncFunction
					Command.onChat = async function () {
						Return defaultOnChat(...arguments);
					};
				}

				Command.onChat({
					...parameters,
					IsUserCallCommand,
					Args,
					CommandName,
					GetLang: getText2
				})
					.then(async (handler) => {
						If (typeof handler == "function") {
							If (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
								Return;
							Try {
								Await handler();
								Log.info("onChat", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
							}
							Catch (err) {
								Await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred2", time, commandName, removeHomeDir(err.stack ? Err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
							}
						}
					})
					.catch(err => {
						Log.err("onChat", `An error occurred when calling the command onChat ${commandName}`, err);
					});
			}
		}


		/*
		 +------------------------------------------------+
		 |                   ON ANY EVENT                 |
		 +------------------------------------------------+
		*/
		Async function onAnyEvent() {
			Const allOnAnyEvent = GoatBot.onAnyEvent || [];
			Let args = [];
			If (typeof event.body == "string" && event.body.startsWith(prefix))
				Args = event.body.split(/ +/);

			For (const key of allOnAnyEvent) {
				If (typeof key !== "string")
					Continue;
				Const command = GoatBot.commands.get(key);
				If (!command)
					Continue;
				Const commandName = command.config.name;
				Const time = getTime("DD/MM/YYYY HH:mm:ss");
				CreateMessageSyntaxError(commandName);

				Const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, command);

				If (getType(command.onAnyEvent) == "Function") {
					Const defaultOnAnyEvent = command.onAnyEvent;
					// convert to AsyncFunction
					Command.onAnyEvent = async function () {
						Return defaultOnAnyEvent(...arguments);
					};
				}

				Command.onAnyEvent({
					...parameters,
					Args,
					CommandName,
					GetLang: getText2
				})
					.then(async (handler) => {
						If (typeof handler == "function") {
							Try {
								Await handler();
								Log.info("onAnyEvent", `${commandName} | ${senderID} | ${userData.name} | ${threadID}`);
							}
							Catch (err) {
								Message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred7", time, commandName, removeHomeDir(err.stack ? Err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
								Log.err("onAnyEvent", `An error occurred when calling the command onAnyEvent ${commandName}`, err);
							}
						}
					})
					.catch(err => {
						Log.err("onAnyEvent", `An error occurred when calling the command onAnyEvent ${commandName}`, err);
					});
			}
		}

		/*
		 +------------------------------------------------+
		 |                  ON FIRST CHAT                 |
		 +------------------------------------------------+
		*/
		Async function onFirstChat() {
			Const allOnFirstChat = GoatBot.onFirstChat || [];
			Const args = body ? Body.split(/ +/) : [];

			For (const itemOnFirstChat of allOnFirstChat) {
				Const { commandName, threadIDsChattedFirstTime } = itemOnFirstChat;
				If (threadIDsChattedFirstTime.includes(threadID))
					Continue;
				Const command = GoatBot.commands.get(commandName);
				If (!command)
					Continue;

				ItemOnFirstChat.threadIDsChattedFirstTime.push(threadID);
				Const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				Const time = getTime("DD/MM/YYYY HH:mm:ss");
				CreateMessageSyntaxError(commandName);

				If (getType(command.onFirstChat) == "Function") {
					Const defaultOnFirstChat = command.onFirstChat;
					// convert to AsyncFunction
					Command.onFirstChat = async function () {
						Return defaultOnFirstChat(...arguments);
					};
				}

				Command.onFirstChat({
					...parameters,
					IsUserCallCommand,
					Args,
					CommandName,
					GetLang: getText2
				})
					.then(async (handler) => {
						If (typeof handler == "function") {
							If (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
								Return;
							Try {
								Await handler();
								Log.info("onFirstChat", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
							}
							Catch (err) {
								Await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred2", time, commandName, removeHomeDir(err.stack ? Err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
							}
						}
					})
					.catch(err => {
						Log.err("onFirstChat", `An error occurred when calling the command onFirstChat ${commandName}`, err);
					});
			}
		}


		/* 
		 +------------------------------------------------+
		 |                    ON REPLY                    |
		 +------------------------------------------------+
		*/
		Async function onReply() {
			If (!event.messageReply)
				Return;
			Const { onReply } = GoatBot;
			Const Reply = onReply.get(event.messageReply.messageID);
			If (!Reply)
				Return;
			Reply.delete = () => onReply.delete(messageID);
			Const commandName = Reply.commandName;
			If (!commandName) {
				Message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommandName"));
				Return log.err("onReply", `Can't find command name to execute this reply!`, Reply);
			}
			Const command = GoatBot.commands.get(commandName);
			If (!command) {
				Message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommand", commandName));
				Return log.err("onReply", `Command "${commandName}" not found`, Reply);
			}

			// —————————————— CHECK PERMISSION —————————————— //
			Const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			Const needRole = roleConfig.onReply;
			If (needRole > role) {
				If (!hideNotiMessage.needRoleToUseCmdOnReply) {
					If (needRole == 1)
						Return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminToUseOnReply", commandName));
					Else if (needRole == 2)
						Return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminBot2ToUseOnReply", commandName));
				}
				Else {
					Return true;
				}
			}

			Const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
			Const time = getTime("DD/MM/YYYY HH:mm:ss");
			Try {
				If (!command)
					Throw new Error(`Cannot find command with commandName: ${commandName}`);
				Const args = body ? Body.split(/ +/) : [];
				CreateMessageSyntaxError(commandName);
				If (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
					Return;
				Await command.onReply({
					...parameters,
					Reply,
					Args,
					CommandName,
					GetLang: getText2
				});
				Log.info("onReply", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
			}
			Catch (err) {
				Log.err("onReply", `An error occurred when calling the command onReply ${commandName}`, err);
				Await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred3", time, commandName, removeHomeDir(err.stack ? Err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
			}
		}


		/*
		 +------------------------------------------------+
		 |                   ON REACTION                  |
		 +------------------------------------------------+
		*/
		Async function onReaction() {
			Const { onReaction } = GoatBot;
			Const Reaction = onReaction.get(messageID);
			If (!Reaction)
				Return;
			Reaction.delete = () => onReaction.delete(messageID);
			Const commandName = Reaction.commandName;
			If (!commandName) {
				Message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommandName"));
				Return log.err("onReaction", `Can't find command name to execute this reaction!`, Reaction);
			}
			Const command = GoatBot.commands.get(commandName);
			If (!command) {
				Message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommand", commandName));
				Return log.err("onReaction", `Command "${commandName}" not found`, Reaction);
			}

			// —————————————— CHECK PERMISSION —————————————— //
			Const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			Const needRole = roleConfig.onReaction;
			If (needRole > role) {
				If (!hideNotiMessage.needRoleToUseCmdOnReaction) {
					If (needRole == 1)
						Return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminToUseOnReaction", commandName));
					Else if (needRole == 2)
						Return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminBot2ToUseOnReaction", commandName));
				}
				Else {
					Return true;
				}
			}
			// —————————————————————————————————————————————— //

			Const time = getTime("DD/MM/YYYY HH:mm:ss");
			Try {
				If (!command)
					Throw new Error(`Cannot find command with commandName: ${commandName}`);
				Const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				Const args = [];
				CreateMessageSyntaxError(commandName);
				If (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
					Return;
				Await command.onReaction({
					...parameters,
					Reaction,
					Args,
					CommandName,
					GetLang: getText2
				});
				Log.info("onReaction", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${event.reaction}`);
			}
			Catch (err) {
				Log.err("onReaction", `An error occurred when calling the command onReaction ${commandName}`, err);
				Await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred4", time, commandName, removeHomeDir(err.stack ? Err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
			}
		}


		/*
		 +------------------------------------------------+
		 |                 EVENT COMMAND                  |
		 +------------------------------------------------+
		*/
		Async function handlerEvent() {
			Const { author } = event;
			Const allEventCommand = GoatBot.eventCommands.entries();
			For (const [key] of allEventCommand) {
				Const getEvent = GoatBot.eventCommands.get(key);
				If (!getEvent)
					Continue;
				Const commandName = getEvent.config.name;
				Const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, getEvent);
				Const time = getTime("DD/MM/YYYY HH:mm:ss");
				Try {
					Const handler = await getEvent.onStart({
						...parameters,
						CommandName,
						GetLang: getText2
					});
					If (typeof handler == "function") {
						Await handler();
						Log.info("EVENT COMMAND", `Event: ${commandName} | ${author} | ${userData.name} | ${threadID}`);
					}
				}
				Catch (err) {
					Log.err("EVENT COMMAND", `An error occurred when calling the command event ${commandName}`, err);
					Await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred5", time, commandName, removeHomeDir(err.stack ? Err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
				}
			}
		}


		/*
		 +------------------------------------------------+
		 |                    ON EVENT                    |
		 +------------------------------------------------+
		*/
		Async function onEvent() {
			Const allOnEvent = GoatBot.onEvent || [];
			Const args = [];
			Const { author } = event;
			For (const key of allOnEvent) {
				If (typeof key !== "string")
					Continue;
				Const command = GoatBot.commands.get(key);
				If (!command)
					Continue;
				Const commandName = command.config.name;
				Const time = getTime("DD/MM/YYYY HH:mm:ss");
				CreateMessageSyntaxError(commandName);

				Const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, command);

				If (getType(command.onEvent) == "Function") {
					Const defaultOnEvent = command.onEvent;
					// convert to AsyncFunction
					Command.onEvent = async function () {
						Return defaultOnEvent(...arguments);
					};
				}

				Command.onEvent({
					...parameters,
					Args,
					CommandName,
					GetLang: getText2
				})
					.then(async (handler) => {
						If (typeof handler == "function") {
							Try {
								Await handler();
								Log.info("onEvent", `${commandName} | ${author} | ${userData.name} | ${threadID}`);
							}
							Catch (err) {
								Message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred6", time, commandName, removeHomeDir(err.stack ? Err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2))));
								Log.err("onEvent", `An error occurred when calling the command onEvent ${commandName}`, err);
							}
						}
					})
					.catch(err => {
						Log.err("onEvent", `An error occurred when calling the command onEvent ${commandName}`, err);
					});
			}
		}

		/*
		 +------------------------------------------------+
		 |                    PRESENCE                    |
		 +------------------------------------------------+
		*/
		Async function presence() {
			// Your code here
		}

		/*
		 +------------------------------------------------+
		 |                  READ RECEIPT                  |
		 +------------------------------------------------+
		*/
		Async function read_receipt() {
			// Your code here
		}

		/*
		 +------------------------------------------------+
		 |                   		 TYP                    	|
		 +------------------------------------------------+
		*/
		Async function typ() {
			// Your code here
		}

		Return {
			OnAnyEvent,
			OnFirstChat,
			OnChat,
			OnStart,
			OnReaction,
			OnReply,
			OnEvent,
			HandlerEvent,
			Presence,
			Read_receipt,
			Typ
		};
	};
};
