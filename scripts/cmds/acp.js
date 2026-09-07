const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "accept",
    aliases: ['acp'],
    version: "5.0",
    author: "Tanbir Hosen",
    role: 0,
    shortDescription: "Accept/Delete friend requests and manage friends",
    longDescription: "Accept friend requests, delete pending requests, and unfriend existing friends",
    category: "Utility",
  },

  onReply: async function ({ message, Reply, event, api, commandName }) {
    const { author, listRequest, messageID, type } = Reply;
    if (author !== event.senderID) return;

    const args = event.body.trim().split(" ");
    const action = args[0].toLowerCase();

    if (type === "friendRequestList") {
      return this.handleListActions(api, listRequest, messageID, event, args);
    }
  },

  // Helper function to extract user ID
  async extractUserID(api, target, event) {
    if (!target) return null;
    if (target.startsWith("@")) {
      const mentions = event.mentions;
      if (mentions && Object.keys(mentions).length > 0) {
        return Object.keys(mentions)[0];
      }
      return null;
    }
    if (target.includes("facebook.com") || target.includes("fb.com") || target.includes("fb.me")) {
      try {
        const match = target.match(/(?:id=|\/)(\d+)/);
        return match ? match[1] : null;
      } catch {
        return null;
      }
    }
    if (/^\d+$/.test(target)) {
      return target;
    }
    return null;
  },

  // Get pending friend requests
  async getPendingRequests(api) {
    try {
      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
        fb_api_caller_class: "RelayModern",
        doc_id: "4499164963466303",
        variables: JSON.stringify({ input: { scale: 3 } })
      };
      const response = await api.httpPost("https://www.facebook.com/api/graphql/", form);
      const data = JSON.parse(response);
      return data?.data?.viewer?.friending_possibilities?.edges || [];
    } catch (error) {
      console.error("Get pending requests error:", error);
      return [];
    }
  },

  // Accept a specific friend request
  async acceptFriendRequest(api, userID) {
    try {
      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestConfirmMutation",
        fb_api_caller_class: "RelayModern",
        doc_id: "3147613905362928",
        variables: JSON.stringify({
          input: {
            source: "friends_tab",
            actor_id: api.getCurrentUserID(),
            friend_requester_id: userID,
            client_mutation_id: Math.random().toString(36).substring(2, 15)
          },
          scale: 3,
          refresh_num: 0
        })
      };
      await api.httpPost("https://www.facebook.com/api/graphql/", form);
      return { success: true };
    } catch (error) {
      console.error("Accept friend request error:", error);
      return { success: false, error: error.message };
    }
  },

  // Delete a pending friend request
  async deleteFriendRequest(api, userID) {
    try {
      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestDeleteMutation",
        fb_api_caller_class: "RelayModern",
        doc_id: "4108254489275063",
        variables: JSON.stringify({
          input: {
            source: "friends_tab",
            actor_id: api.getCurrentUserID(),
            friend_requester_id: userID,
            client_mutation_id: Math.random().toString(36).substring(2, 15)
          },
          scale: 3,
          refresh_num: 0
        })
      };
      await api.httpPost("https://www.facebook.com/api/graphql/", form);
      return { success: true };
    } catch (error) {
      console.error("Delete friend request error:", error);
      return { success: false, error: error.message };
    }
  },

  // Unfriend a user
  async unfriendUser(api, userID) {
    try {
      await api.unfriend(userID);
      return { success: true };
    } catch (error) {
      console.error("Unfriend user error:", error);
      return { success: false, error: error.message };
    }
  },

  // Handle list actions (add/del from list)
  async handleListActions(api, listRequest, messageID, event, args) {
    const action = args[0].toLowerCase();
    if (!["add", "del", "delete"].includes(action)) {
      const helpMsg = `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  ❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃\n┃  \n┃  📌 Use: add/del <num|all>\n╚═══════════════════╝`;
      return api.editMessage(helpMsg, messageID);
    }
    let targetIDs = [];
    if (args[1]?.toLowerCase() === "all") {
      targetIDs = listRequest.map((_, idx) => idx + 1);
    } else {
      targetIDs = args.slice(1).filter(num => !isNaN(num) && num > 0);
    }
    if (targetIDs.length === 0) {
      const errorMsg = `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  ❌ 𝐒𝐏𝐄𝐂𝐈𝐅𝐘\n┃  \n┃  📌 Example:\n┃  • ${action} all\n┃  • ${action} 1 2 3\n╚═══════════════════╝`;
      return api.editMessage(errorMsg, messageID);
    }
    const results = [];
    for (const numStr of targetIDs) {
      const num = parseInt(numStr);
      const index = num - 1;
      const request = listRequest[index];
      if (!request) {
        results.push({ success: false, name: `#${num}`, reason: "Not found" });
        continue;
      }
      const userID = request.node.id;
      const userName = request.node.name;
      if (action === "add") {
        const result = await this.acceptFriendRequest(api, userID);
        results.push({
          success: result.success,
          name: userName,
          id: userID,
          reason: result.error || null
        });
      } else {
        const result = await this.deleteFriendRequest(api, userID);
        results.push({
          success: result.success,
          name: userName,
          id: userID,
          reason: result.error || null
        });
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    const successResults = results.filter(r => r.success);
    
    let resultMsg = `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n`;
    resultMsg += `┃  ${action === "add" ? "✅" : "🗑️"} ${action === "add" ? "𝐀𝐂𝐂𝐄𝐏𝐓" : "𝐃𝐄𝐋𝐄𝐓𝐄"}\n`;
    
    if (successResults.length > 0) {
      successResults.forEach((user, index) => {
        resultMsg += `┃  ${index + 1}. ${user.name}\n`;
        resultMsg += `┃     ID: ${user.id}\n`;
      });
    } else {
      resultMsg += `┃  No successful actions\n`;
    }
    
    resultMsg += `┃  \n`;
    resultMsg += `┃  📊 Total: ${results.length}\n`;
    resultMsg += `┃  ✅ Success: ${successCount}\n`;
    
    if (failCount > 0) {
      resultMsg += `┃  ❌ Failed: ${failCount}\n`;
    }
    
    resultMsg += `╚═══════════════════╝`;
    
    await api.editMessage(resultMsg, messageID);
  },

  // Accept all pending requests
  async acceptAllPending(api) {
    const pendingRequests = await this.getPendingRequests(api);
    if (pendingRequests.length === 0) {
      return {
        success: false,
        message: `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  📭 𝐍𝐎 𝐏𝐄𝐍𝐃𝐈𝐍𝐆\n┃  \n┃  📌 No friend requests\n╚═══════════════════╝`
      };
    }
    let successCount = 0;
    let failCount = 0;
    for (const request of pendingRequests) {
      const result = await this.acceptFriendRequest(api, request.node.id);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    return {
      success: true,
      message: `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  ✅ 𝐀𝐂𝐂𝐄𝐏𝐓𝐄𝐃 𝐀𝐋𝐋\n┃  \n┃  📊 Total: ${pendingRequests.length}\n┃  ✅ Accepted: ${successCount}\n┃  ❌ Failed: ${failCount}\n╚═══════════════════╝`
    };
  },

  // Show friend requests list
  async showRequestsList(api, event) {
    const pendingRequests = await this.getPendingRequests(api);
    if (pendingRequests.length === 0) {
      return {
        success: false,
        message: `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  📭 𝐍𝐎 𝐏𝐄𝐍𝐃𝐈𝐍𝐆\n┃  \n┃  📌 No friend requests\n╚═══════════════════╝`
      };
    }
    let listMsg = `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n`;
    listMsg += `┃  📋 𝐏𝐄𝐍𝐃𝐈𝐍𝐆: ${pendingRequests.length}\n`;
    listMsg += `┃  \n`;
    
    pendingRequests.forEach((request, index) => {
      listMsg += `┃  ${index + 1}. ${request.node.name}\n`;
      listMsg += `┃     ID: ${request.node.id}\n`;
      listMsg += `┃     Link: https://facebook.com/${request.node.id}\n`;
      
      if (index < pendingRequests.length - 1) {
        listMsg += `┃  \n`;
      }
    });
    
    listMsg += `┃  \n┃  💬 𝐑𝐞𝐩𝐥𝐲 𝐰𝐢𝐭𝐡:\n`;
    listMsg += `┃  • add <num|all>\n`;
    listMsg += `┃  • del <num|all>\n`;
    listMsg += `╚═══════════════════╝`;
    
    return {
      success: true,
      message: listMsg,
      data: pendingRequests
    };
  },

  onStart: async function ({ event, api, commandName, args, messageReply }) {
    if (!args[0]) {
      const processingMsg = await api.sendMessage(
        `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  🔄 𝐂𝐇𝐄𝐂𝐊𝐈𝐍𝐆...\n┃  \n┃  📌 Checking your status\n╚═══════════════════╝`,
        event.threadID
      );
      
      const senderID = event.senderID;
      const userInfo = await api.getUserInfo(senderID);
      const userName = userInfo[senderID]?.name || "You";
      
      try {
        const friendsList = await api.getFriendsList();
        const isFriend = friendsList.some(friend => friend.userID === senderID);
        
        if (isFriend) {
          await api.editMessage(
            `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  ✅ 𝐀𝐋𝐑𝐄𝐀𝐃𝐘 𝐅𝐑𝐈𝐄𝐍𝐃𝐒\n┃  \n┃  📌 ${userName}\n┃  📌 ID: ${senderID}\n┃  📌 We are already friends!\n╚═══════════════════╝`,
            processingMsg.messageID
          );
          return;
        }
      } catch (error) {
        console.log("Friend check failed, continuing...");
      }
      
      const pendingRequests = await this.getPendingRequests(api);
      const senderRequest = pendingRequests.find(request => request.node.id === senderID);
      
      if (!senderRequest) {
        await api.editMessage(
          `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  📭 𝐍𝐎 𝐏𝐄𝐍𝐃𝐈𝐍𝐆\n┃  \n┃  📌 ${userName}\n┃  📌 ID: ${senderID}\n┃  📌 You don't have a pending request\n╚═══════════════════╝`,
          processingMsg.messageID
        );
        return;
      }
      
      const result = await this.acceptFriendRequest(api, senderID);
      
      if (result.success) {
        await api.editMessage(
          `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  ✅ 𝐀𝐂𝐂𝐄𝐏𝐓𝐄𝐃\n┃  \n┃  📌 ${userName}\n┃  📌 ID: ${senderID}\n┃  📌 Your request accepted\n╚═══════════════════╝`,
          processingMsg.messageID
        );
      } else {
        await api.editMessage(
          `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  ❌ 𝐅𝐀𝐈𝐋𝐄𝐃\n┃  \n┃  📌 ${userName}\n┃  📌 ID: ${senderID}\n┃  📌 Error: ${result.error}\n╚═══════════════════╝`,
          processingMsg.messageID
        );
      }
      return;
    }

    const firstArg = args[0].toLowerCase();
    
    if (firstArg === "list") {
      const listResult = await this.showRequestsList(api, event);
      if (listResult.success) {
        api.sendMessage(
          listResult.message,
          event.threadID,
          (error, info) => {
            if (error) return console.error(error);
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              listRequest: listResult.data,
              author: event.senderID,
              type: "friendRequestList"
            });
          }
        );
      } else {
        api.sendMessage(listResult.message, event.threadID, event.messageID);
      }
      return;
    }

    if (firstArg.startsWith("@") || messageReply) {
      let targetUserID = null;
      if (messageReply) {
        targetUserID = messageReply.senderID;
      } else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetUserID = Object.keys(event.mentions)[0];
      }
      if (!targetUserID) {
        return api.sendMessage(
          `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  ❌ 𝐍𝐎 𝐓𝐀𝐑𝐆𝐄𝐓\n┃  \n┃  📌 Mention or reply to user\n╚═══════════════════╝`,
          event.threadID,
          event.messageID
        );
      }
      const processingMsg = await api.sendMessage(
        `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  🔄 𝐂𝐇𝐄𝐂𝐊𝐈𝐍𝐆...\n┃  \n┃  📌 Processing request\n╚═══════════════════╝`,
        event.threadID
      );
      const pendingRequests = await this.getPendingRequests(api);
      const hasPendingRequest = pendingRequests.some(req => req.node.id === targetUserID);
      if (!hasPendingRequest) {
        const userInfo = await api.getUserInfo(targetUserID);
        const userName = userInfo[targetUserID]?.name || "User";
        await api.editMessage(
          `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  ❌ 𝐍𝐎 𝐑𝐄𝐐𝐔𝐄𝐒𝐓\n┃  \n┃  📌 ${userName}\n┃  📌 ID: ${targetUserID}\n┃  📌 No pending request\n╚═══════════════════╝`,
          processingMsg.messageID
        );
        return;
      }
      const result = await this.acceptFriendRequest(api, targetUserID);
      const userInfo = await api.getUserInfo(targetUserID);
      const userName = userInfo[targetUserID]?.name || "User";
      if (result.success) {
        await api.editMessage(
          `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  ✅ 𝐀𝐂𝐂𝐄𝐏𝐓𝐄𝐃\n┃  \n┃  📌 ${userName}\n┃  📌 ID: ${targetUserID}\n┃  📌 Request accepted\n╚═══════════════════╝`,
          processingMsg.messageID
        );
      } else {
        await api.editMessage(
          `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  ❌ 𝐅𝐀𝐈𝐋𝐄𝐃\n┃  \n┃  📌 ${userName}\n┃  📌 ID: ${targetUserID}\n┃  📌 Error: ${result.error}\n╚═══════════════════╝`,
          processingMsg.messageID
        );
      }
      return;
    }

    if (["un", "ud", "unfriend"].includes(firstArg)) {
      if (!args[1] && !messageReply && !event.mentions) {
        return api.sendMessage(
          `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  ❌ 𝐌𝐈𝐒𝐒𝐈𝐍𝐆\n┃  \n┃  📌 Usage:\n┃  • accept un @mention\n┃  • accept un (reply)\n┃  • accept un <uid>\n┃  • accept un <fb.link>\n╚═══════════════════╝`,
          event.threadID,
          event.messageID
        );
      }
      let targetUserID = null;
      if (messageReply) {
        targetUserID = messageReply.senderID;
      } else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetUserID = Object.keys(event.mentions)[0];
      } else {
        targetUserID = await this.extractUserID(api, args[1], event);
      }
      if (!targetUserID) {
        return api.sendMessage(
          `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  ❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃\n┃  \n┃  📌 Invalid target\n┃  📌 Check UID/link/mention\n╚═══════════════════╝`,
          event.threadID,
          event.messageID
        );
      }
      const processingMsg = await api.sendMessage(
        `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  🔄 𝐂𝐇𝐄𝐂𝐊𝐈𝐍𝐆...\n┃  \n┃  📌 Processing unfriend\n╚═══════════════════╝`,
        event.threadID
      );
      try {
        const userInfo = await api.getUserInfo(targetUserID);
        const userName = userInfo[targetUserID]?.name || "User";
        const result = await this.unfriendUser(api, targetUserID);
        if (result.success) {
          await api.editMessage(
            `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  ✅ 𝐔𝐍𝐅𝐑𝐈𝐄𝐍𝐃𝐄𝐃\n┃  \n┃  📌 ${userName}\n┃  📌 ID: ${targetUserID}\n┃  📌 Successfully unfriended\n╚═══════════════════╝`,
            processingMsg.messageID
          );
        } else {
          await api.editMessage(
            `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  ❌ 𝐅𝐀𝐈𝐋𝐄𝐃\n┃  \n┃  📌 ${userName}\n┃  📌 ID: ${targetUserID}\n┃  📌 Error: ${result.error}\n╚═══════════════════╝`,
            processingMsg.messageID
          );
        }
      } catch (error) {
        await api.editMessage(
          `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  ❌ 𝐄𝐑𝐑𝐎𝐑\n┃  \n┃  📌 User not found\n┃  📌 Or not your friend\n╚═══════════════════╝`,
          processingMsg.messageID
        );
      }
      return;
    }

    const helpMsg = `╔═════❰ 𝗗𝗔𝗥𝗞•𝗡𝗘𝗫𝗨𝗦 ❱═════╗\n┃  📌 𝐀𝐂𝐂𝐄𝐏𝐓 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒\n┃  \n┃  🔹 accept\n┃     → Check & accept YOUR request\n┃  🔹 accept @mention\n┃     → Accept mentioned user\n┃  🔹 accept (reply)\n┃     → Accept replied user\n┃  🔹 accept list\n┃     → Show pending requests\n┃  🔹 add 1 2 3\n┃     → Accept from list\n┃  🔹 add all\n┃     → Accept all from list\n┃  🔹 del 1 2 3\n┃     → Delete from list\n┃  🔹 del all\n┃     → Delete all from list\n┃  🔹 accept un @mention\n┃     → Unfriend mentioned\n┃  🔹 accept un (reply)\n┃     → Unfriend replied\n┃  🔹 accept un <uid>\n┃     → Unfriend by UID\n┃  🔹 accept un <fb link>\n┃     → Unfriend by link\n┃  🔹 accept ud\n┃     → Same as un (short)\n┃  🔹 accept unfriend\n┃     → Same as un (long)\n╚═══════════════════╝`;
    api.sendMessage(helpMsg, event.threadID, event.messageID);
  }
};
