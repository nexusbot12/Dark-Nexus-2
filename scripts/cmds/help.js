const { getPrefix } = global.utils;
const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "help",
    version: "9.0",
    author: "Tanbir Hossen",
    countDown: 3,
    role: 0,
    description: "❖ Complete Help System with Full Author Credits ❖",
    category: "info",
    guide: {
      en: "{pn} - All commands\n{pn} [cmd] - Command details\n{pn} authors - All authors\n{pn} cat [category] - Category commands\n{pn} search [word] - Search"
    }
  },

  onStart: async function({ message, args, event, role, api }) {
    const { threadID, messageID } = event;
    const prefix = getPrefix(threadID) || "*";
    const input = args[0]?.toLowerCase();
    
    try {
      // Create cache directory
      const cacheDir = path.join(__dirname, "cache", "help_system");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      
      // Premium Anime Images
      const animeImages = [
        "https://files.catbox.moe/wfngzy.jpg",
        "https://files.catbox.moe/1xdv8z.jpg", 
        "https://files.catbox.moe/fmn527.jpg",
        "https://files.catbox.moe/et8m45.jpg",
        "https://files.catbox.moe/pjxmue.jpg",
        "https://files.catbox.moe/7kndmf.jpg",
        "https://files.catbox.moe/o8cgcm.jpg",
        "https://files.catbox.moe/2nd2gq.jpg",
        "https://files.catbox.moe/ohqfdz.jpg",
        "https://files.catbox.moe/z129vp.jpg"
      ];
      
      // Download image
      const randomImage = animeImages[Math.floor(Math.random() * animeImages.length)];
      const fileName = `help_${Date.now()}.jpg`;
      const filePath = path.join(cacheDir, fileName);
      
      // Get commands
      const commands = global.GoatBot?.commands || new Map();
      const aliases = global.GoatBot?.aliases || new Map();
      
      let messageText = "";
      
      // =============== ALL FEATURES ===============
      
      // Show all authors
      if (input === "authors" || input === "credits") {
        messageText = await this.showAllAuthors(commands, prefix);
      }
      
      // Search commands
      else if (input === "search") {
        const keyword = args.slice(1).join(" ").toLowerCase();
        messageText = keyword ? await this.searchCommands(commands, role, prefix, keyword) 
                             : this.getSearchHelp(prefix);
      }
      
      // Show author's commands
      else if (input === "author") {
        const authorName = args.slice(1).join(" ");
        messageText = authorName ? await this.showAuthorCommands(commands, role, prefix, authorName)
                                : this.getAuthorHelp(prefix);
      }
      
      // Show categories
      else if (input === "cat" || input === "category") {
        const category = args[1]?.toLowerCase();
        messageText = category ? await this.showCategoryCommands(commands, role, prefix, category)
                              : await this.showAllCategories(commands, prefix);
      }
      
      // Show command details
      else if (input && (commands.has(input) || (aliases.has(input) && commands.get(aliases.get(input))))) {
        const cmd = commands.get(input) || commands.get(aliases.get(input));
        messageText = await this.showCommandDetails(cmd, prefix);
      }
      
      // Show stats
      else if (input === "stats") {
        messageText = await this.showCommandStats(commands, role, prefix);
      }
      
      // Show popular
      else if (input === "popular") {
        messageText = await this.showPopularCommands(commands, role, prefix);
      }
      
      // Show new commands
      else if (input === "new") {
        messageText = await this.showRecentCommands(commands, role, prefix);
      }
      
      // Show menu
      else if (input === "menu") {
        messageText = this.showHelpMenu(prefix);
      }
      
      // Show all commands (default)
      else {
        messageText = await this.showAllCommands(commands, role, prefix);
      }
      
      // =============== DOWNLOAD & SEND ===============
      
      try {
        // Download image
        await this.downloadImage(randomImage, filePath);
        
        // Send with image
        await message.reply({
          body: messageText,
          attachment: fs.createReadStream(filePath)
        });
        
        // Add reaction
        api.setMessageReaction("✅", messageID, () => {}, true);
        
        // Cleanup
        setTimeout(() => this.cleanupFile(filePath), 15000);
        
      } catch (imageError) {
        console.error("Image error, sending text only:", imageError);
        
        await message.reply({
          body: messageText + "\n\n⚠️ [Image Loading Failed]"
        });
        
        api.setMessageReaction("📄", messageID, () => {}, true);
      }
      
    } catch (error) {
      console.error("Help system error:", error);
      
      const errorMsg = 
        `╔═══❰ 𝐃𝐀𝐑𝐊•𝐍𝐄𝐗𝐔𝐒 ❱═══╗\n` +
        `         ❌ 𝐄𝐑𝐑𝐎𝐑\n\n` +
        `Help system error\n\n` +
        `🔄 Try: ${prefix}help\n` +
        `👑 Developer: ➤𝐓A̶𝙽𝙱𝕚𝗥_☜۵༎࿐\n` +
        `🔗 https://www.facebook.com/share/19RvT5tWXu/\n` +
        `╚═══════════════════╝`;
      
      return message.reply(errorMsg);
    }
  },

  // ==================== MAIN FEATURES ====================

  // Show command details WITH AUTHOR
  showCommandDetails: async function(cmd, prefix) {
    const config = cmd.config;
    
    const description = config.description?.en || config.description || "No description";
    const aliasesList = config.aliases?.join(', ') || "None";
    const category = config.category?.toUpperCase() || "GENERAL";
    const version = config.version || "1.0";
    const countDown = config.countDown || 1;
    const author = config.author || "Unknown";
    const credits = config.credits || config.author || "Unknown";
    
    let roleText = "👥 All Users";
    if (config.role === 1) roleText = "👑 Group Admins";
    if (config.role === 2) roleText = "⚡ Bot Admins";
    
    let guide = config.guide?.en || config.guide || config.usage || "No usage guide";
    if (typeof guide === "object") guide = guide.en || guide.body || "No usage guide";
    
    guide = guide
      .replace(/\{prefix\}/g, prefix)
      .replace(/\{name\}/g, config.name)
      .replace(/\{pn\}/g, prefix + config.name);
    
    const commandInfo = 
      `╔════❰ 𝐃𝐀𝐑𝐊•𝐍𝐄𝐗𝐔𝐒 ❱════╗\n` +
      `         🎮 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐈𝐍𝐅𝐎\n\n` +
      `📛 Name: ${config.name}\n` +
      `📝 Description: ${description}\n` +
      `📁 Category: ${category}\n` +
      `🔤 Aliases: ${aliasesList}\n` +
      `🔄 Version: ${version}\n` +
      `👥 Permission: ${roleText}\n` +
      `⏱️ Cooldown: ${countDown}s\n` +
      `👤 Author: ${author}\n` +
      `🌟 Credits: ${credits}\n\n` +
      `🎯 How to use:\n${guide}\n\n` +
      `👑 Bot System by ➤𝐓A̶𝙽𝙱𝕚𝗥_☜۵༎࿐\n` +
      `🔗 https://www.facebook.com/share/19RvT5tWXu/\n` +
      `╚═══════════════════╝`;
    
    return commandInfo;
  },

  // Show all authors with credits
  showAllAuthors: async function(commands, prefix) {
    const authors = new Map();
    
    for (const [name, cmd] of commands) {
      if (!cmd?.config) continue;
      const author = cmd.config.author || "Unknown";
      const credits = cmd.config.credits || cmd.config.author || "Unknown";
      
      const authorKey = credits.toLowerCase();
      if (!authors.has(authorKey)) {
        authors.set(authorKey, {
          name: credits,
          commands: [],
          count: 0
        });
      }
      
      const authorData = authors.get(authorKey);
      authorData.commands.push(name);
      authorData.count++;
    }
    
    const sortedAuthors = [...authors.entries()]
      .sort((a, b) => b[1].count - a[1].count);
    
    let messageText = 
      `╔════❰ 𝐃𝐀𝐑𝐊•𝐍𝐄𝐗𝐔𝐒 ❱════╗\n` +
      `         👑 𝐁𝐎𝐓 𝐀𝐔𝐓𝐇𝐎𝐑𝐒\n\n` +
      `📊 Total Authors: ${authors.size}\n\n`;
    
    // Show all authors
    for (const [key, data] of sortedAuthors) {
      messageText += `👤 ${data.name}\n`;
      messageText += `   Commands: ${data.count}\n`;
      messageText += `   Sample: ${data.commands.slice(0, 3).join(', ')}\n\n`;
    }
    
    messageText += `🎯 Author Commands:\n`;
    messageText += `${prefix}help author [name] - Author's commands\n`;
    messageText += `${prefix}help [cmd] - See command details\n\n`;
    
    messageText += `🏆 Top Contributors:\n`;
    if (sortedAuthors.length > 0) {
      const top3 = sortedAuthors.slice(0, 3);
      const medals = ["🥇", "🥈", "🥉"];
      top3.forEach((data, index) => {
        messageText += `${medals[index]} ${data[1].name} - ${data[1].count} commands\n`;
      });
    }
    
    messageText += `\n👑 Main Developer: ➤𝐓A̶𝙽𝙱𝕚𝗥_☜۵༎࿐\n`;
    messageText += `🔗 https://www.facebook.com/share/19RvT5tWXu/\n`;
    messageText += `╚═══════════════════╝`;
    
    return messageText;
  },

  // Show author's commands
  showAuthorCommands: async function(commands, role, prefix, authorName) {
    const authorCommands = [];
    let authorDisplayName = "";
    
    for (const [name, cmd] of commands) {
      if (!cmd?.config) continue;
      if (cmd.config.role > 1 && role < cmd.config.role) continue;
      
      const credits = cmd.config.credits || cmd.config.author || "";
      if (credits.toLowerCase().includes(authorName.toLowerCase())) {
        authorCommands.push(name);
        if (!authorDisplayName) authorDisplayName = credits;
      }
    }
    
    if (authorCommands.length === 0) {
      return `❌ No commands found for author "${authorName}"`;
    }
    
    let messageText = 
      `╔════❰ 𝐃𝐀𝐑𝐊•𝐍𝐄𝐗𝐔𝐒 ❱════╗\n` +
      `         👤 𝐀𝐔𝐓𝐇𝐎𝐑: ${authorDisplayName}\n\n` +
      `📊 Commands: ${authorCommands.length}\n\n`;
    
    // Show commands in groups
    for (let i = 0; i < authorCommands.length; i += 6) {
      const chunk = authorCommands.slice(i, i + 6);
      messageText += `› ${chunk.join(' › ')}\n`;
    }
    
    messageText += `\n🎯 Sample Usage:\n`;
    if (authorCommands.length > 0) {
      messageText += `${prefix}help ${authorCommands[0]}\n`;
      messageText += `${prefix}${authorCommands[0]}\n`;
    }
    
    messageText += `\n👑 Author: ${authorDisplayName}\n`;
    messageText += `🔗 Bot System by ➤𝐓A̶𝙽𝙱𝕚𝗥_☜۵༎࿐\n`;
    messageText += `╚═══════════════════╝`;
    
    return messageText;
  },

  // Show all commands with authors
  showAllCommands: async function(commands, role, prefix) {
    const categories = {};
    
    for (const [name, cmd] of commands) {
      if (!cmd?.config) continue;
      if (cmd.config.role > 1 && role < cmd.config.role) continue;
      
      const category = cmd.config.category?.toUpperCase() || "GENERAL";
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(name);
    }
    
    const sortedCategories = Object.keys(categories).sort();
    
    let messageText = 
      `╔════❰ 𝐃𝐀𝐑𝐊•𝐍𝐄𝐗𝐔𝐒 ❱════╗\n` +
      `         🎮 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐋𝐈𝐒𝐓\n\n`;
    
    for (const category of sortedCategories) {
      const emoji = this.getCategoryEmoji(category);
      messageText += `								${emoji}${category}${emoji}\n`;
      messageText += `› ${categories[category].join(' › ')}\n\n`;
    }
    
    const totalCommands = Object.values(categories).reduce((sum, arr) => sum + arr.length, 0);
    
    messageText += 
      `─━─━─━─━─━─━─━─▢\n` +
      `┃ ⬤ Total cmds: ${totalCommands}\n` +
      `┃ ⬤ Type [${prefix}help <cmd>] for details\n` +
      `┃ ⬤ Type '${prefix}help authors' for credits\n` +
      `┃ ⬤ Type '${prefix}help cat' for categories\n` +
      `┗─━─━─━─━─━─━─━─▢\n\n` +
      `								❰𝐃𝐀𝐑𝐊•𝐍𝐄𝐗𝐔𝐒❱\n` +
      `						   👑 by ➤𝐓A̶𝙽𝙱𝕚𝗥_☜۵༎࿐`;
    
    return messageText;
  },

  // Show category commands
  showCategoryCommands: async function(commands, role, prefix, category) {
    const categoryUpper = category.toUpperCase();
    const categoryCommands = [];
    
    for (const [name, cmd] of commands) {
      if (!cmd?.config) continue;
      if (cmd.config.role > 1 && role < cmd.config.role) continue;
      
      const cmdCategory = cmd.config.category?.toUpperCase() || "GENERAL";
      if (cmdCategory === categoryUpper) {
        categoryCommands.push(name);
      }
    }
    
    if (categoryCommands.length === 0) {
      return `❌ No commands in category "${category}"`;
    }
    
    const emoji = this.getCategoryEmoji(categoryUpper);
    
    let messageText = 
      `╔════❰ 𝐃𝐀𝐑𝐊•𝐍𝐄𝐗𝐔𝐒 ❱════╗\n` +
      `         ${emoji} ${categoryUpper}\n\n` +
      `📊 Commands: ${categoryCommands.length}\n\n`;
    
    for (let i = 0; i < categoryCommands.length; i += 5) {
      const chunk = categoryCommands.slice(i, i + 5);
      messageText += `› ${chunk.join(' › ')}\n`;
    }
    
    messageText += `\n🎯 Usage: ${prefix}help [command]\n`;
    messageText += `Example: ${prefix}help ${categoryCommands[0] || 'info'}\n\n`;
    
    messageText += `👑 Category: ${categoryUpper}\n`;
    messageText += `🔗 Bot by ➤𝐓A̶𝙽𝙱𝕚𝗥_☜۵༎࿐\n`;
    messageText += `╚═══════════════════╝`;
    
    return messageText;
  },

  // Search commands
  searchCommands: async function(commands, role, prefix, keyword) {
    const foundCommands = [];
    
    for (const [name, cmd] of commands) {
      if (!cmd?.config) continue;
      if (cmd.config.role > 1 && role < cmd.config.role) continue;
      
      if (name.toLowerCase().includes(keyword) ||
          (cmd.config.aliases && cmd.config.aliases.some(a => a.toLowerCase().includes(keyword))) ||
          (cmd.config.description && cmd.config.description.toLowerCase().includes(keyword)) ||
          (cmd.config.author && cmd.config.author.toLowerCase().includes(keyword))) {
        foundCommands.push({
          name: name,
          author: cmd.config.author || "Unknown",
          category: cmd.config.category || "General"
        });
      }
    }
    
    let messageText = 
      `╔════❰ 𝐃𝐀𝐑𝐊•𝐍𝐄𝐗𝐔𝐒 ❱════╗\n` +
      `         🔍 𝐒𝐄𝐀𝐑𝐂𝐇: "${keyword}"\n\n`;
    
    if (foundCommands.length > 0) {
      messageText += `📌 Found ${foundCommands.length} results:\n\n`;
      
      for (const cmd of foundCommands) {
        messageText += `• ${cmd.name}\n`;
        messageText += `  👤 ${cmd.author} | 📁 ${cmd.category.toUpperCase()}\n`;
      }
      
      messageText += `\n🎯 Try: ${prefix}help ${foundCommands[0].name}\n`;
    } else {
      messageText += `❌ No results found\n\n`;
      messageText += `💡 Try:\n`;
      messageText += `• Different keywords\n`;
      messageText += `• ${prefix}help - All commands\n`;
      messageText += `• ${prefix}help authors - All authors\n`;
    }
    
    messageText += `\n👑 Search by ➤𝐓A̶𝙽𝙱𝕚𝗥_☜۵༎࿐\n`;
    messageText += `🔗 https://www.facebook.com/share/19RvT5tWXu/\n`;
    messageText += `╚═══════════════════╝`;
    
    return messageText;
  },

  // Other features (simplified)
  showCommandStats: async function(commands, role, prefix) {
    let total = 0, available = 0;
    for (const [_, cmd] of commands) {
      if (!cmd?.config) continue;
      total++;
      if (cmd.config.role > 1 && role < cmd.config.role) continue;
      available++;
    }
    
    return `📊 Stats: ${available}/${total} commands available`;
  },

  showPopularCommands: async function(commands, role, prefix) {
    const cmds = [];
    for (const [name, cmd] of commands) {
      if (!cmd?.config) continue;
      if (cmd.config.role > 1 && role < cmd.config.role) continue;
      cmds.push(name);
    }
    
    return `⭐ Popular: ${cmds.slice(0, 5).join(', ')}`;
  },

  showRecentCommands: async function(commands, role, prefix) {
    const cmds = [];
    for (const [name, cmd] of commands) {
      if (!cmd?.config) continue;
      if (cmd.config.role > 1 && role < cmd.config.role) continue;
      if (parseFloat(cmd.config.version || "1.0") >= 2.0) {
        cmds.push(name);
      }
    }
    
    return `🆕 Recent: ${cmds.slice(0, 5).join(', ')}`;
  },

  showHelpMenu: function(prefix) {
    return `📋 Menu:\n${prefix}help [cmd]\n${prefix}help authors\n${prefix}help cat [category]\n${prefix}help search [word]`;
  },

  showAllCategories: async function(commands, prefix) {
    const categories = new Set();
    for (const [_, cmd] of commands) {
      if (!cmd?.config) continue;
      categories.add(cmd.config.category?.toUpperCase() || "GENERAL");
    }
    
    return `📁 Categories: ${[...categories].join(', ')}`;
  },

  getSearchHelp: function(prefix) {
    return `🔍 Usage: ${prefix}help search [keyword]`;
  },

  getAuthorHelp: function(prefix) {
    return `👤 Usage: ${prefix}help author [name]`;
  },

  // Helper functions
  getCategoryEmoji: function(category) {
    const emojiMap = {
      "INFO": "❖", "MEDIA": "❖", "FUN": "❖", "TOOLS": "",
      "GROUP": "❖", "ADMIN": "👑", "MUSIC": "❖", "AI": "❖",
      "GENERAL": "❖"
    };
    return emojiMap[category] || "❖";
  },

  downloadImage: async function(url, outputPath) {
    const response = await axios({
      method: "GET",
      url: url,
      responseType: "stream",
      timeout: 30000
    });
    
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  },

  cleanupFile: function(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  }
};
