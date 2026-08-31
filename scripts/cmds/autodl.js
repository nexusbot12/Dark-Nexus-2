const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

let sagorDownloader;
try {
  sagorDownloader = require("sagor-video-downloader");
} catch (e) {
  sagorDownloader = null;
}

const supportedDomains = [
  "facebook.com", "fb.watch", "youtube.com", "youtu.be", "tiktok.com",
  "instagram.com", "instagr.am", "likee.com", "likee.video", "capcut.com",
  "spotify.com", "terabox.com", "twitter.com", "x.com", "drive.google.com",
  "soundcloud.com", "ndown.app", "pinterest.com", "pin.it"
];

function getPlatformName(url) {
  for (const domain of supportedDomains) {
    if (url.includes(domain)) {
      let name = domain.replace(/(\.com|\.app|\.video|\.net|\.be|\.it)/g, "").toUpperCase();
      if (name === "FB") return "FACEBOOK";
      if (name === "YOUTU") return "YOUTUBE";
      if (name === "INSTAGR") return "INSTAGRAM";
      if (name === "PIN") return "PINTEREST";
      return name;
    }
  }
  return "DIRECT LINK";
}

module.exports = {
  config: {
    name: "autodl",
    version: "3.0",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: "All-in-one Media & Video Downloader",
    longDescription: "Automatically downloads videos/media from Facebook, YouTube, TikTok, Instagram, Likee, CapCut, Spotify, Terabox, Twitter, Google Drive, SoundCloud, Pinterest or direct links.",
    category: "media",
    guide: {
      en: "{pn} <link> or send any media link in chat."
    }
  },

  onStart: async function ({ api, event, args }) {
    const url = args[0];

    if (!url) {
      return api.sendMessage(
        "📥 Send any video/media link (https://) from supported sites (Facebook, YouTube, TikTok, Instagram, etc.) or use:\n/autoal <link>",
        event.threadID,
        event.messageID
      );
    }

    return await handleDownload(api, event, url);
  },

  onChat: async function ({ api, event }) {
    const content = event.body ? event.body.trim() : "";
    if (!content || content.toLowerCase().startsWith("autoal")) return;

    const links = content.match(/(https?:\/\/[^\s]+)/g);
    if (!links || links.length === 0) return;

    const uniqueLinks = [...new Set(links)];

    for (const url of uniqueLinks) {
      await handleDownload(api, event, url);
    }
  }
};

async function handleDownload(api, event, url) {
  api.setMessageReaction("⌛️", event.messageID, () => {}, true);

  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);

  const platformName = getPlatformName(url);
  let filePath = null;

  try {
    // Method 1: Sakura API Downloader
    try {
      const GITHUB_RAW = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";
      const rawRes = await axios.get(GITHUB_RAW, { timeout: 5000 });
      const apiBase = rawRes.data.apiv1;
      const API = `${apiBase}/api/auto?url=${encodeURIComponent(url)}`;
      const res = await axios.get(API, { timeout: 15000 });

      if (res.data && (res.data.high_quality || res.data.low_quality)) {
        const mediaURL = res.data.high_quality || res.data.low_quality;
        const ext = mediaURL.includes(".mp3") ? "mp3" : "mp4";
        filePath = path.join(cacheDir, `auto_media_${Date.now()}.${ext}`);
        const buffer = (await axios.get(mediaURL, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(filePath, Buffer.from(buffer));
      }
    } catch (e) {
      // Primary API failed, move to fallback
    }

    // Method 2: Sagor Video Downloader Package
    if (!filePath && sagorDownloader) {
      try {
        const result = await sagorDownloader.downloadVideo(url);
        if (result && result.filePath && fs.existsSync(result.filePath)) {
          filePath = result.filePath;
        }
      } catch (e) {
        // Sagor downloader failed, move to direct download
      }
    }

    // Method 3: Direct Link Download Fallback
    if (!filePath) {
      const ext = path.extname(url.split("?")[0]).toLowerCase() || ".mp4";
      filePath = path.join(cacheDir, `auto_media_${Date.now()}${ext}`);
      const res = await axios.get(url, { responseType: "arraybuffer", timeout: 30000 });
      fs.writeFileSync(filePath, Buffer.from(res.data));
    }

    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error("Failed to download media");
    }

    // Check size limit (Facebook Max 25MB attachment limit)
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > 25) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      api.setMessageReaction("❌️", event.messageID, () => {}, true);
      return;
    }

    api.setMessageReaction("✅️", event.messageID, () => {}, true);

    const infoCard = `╔═══❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═══╗
✅ Video Downloaded!
	📥 Platform: ${platformName}
╚═══════════════╝`;

    await api.sendMessage(
      {
        body: infoCard,
        attachment: fs.createReadStream(filePath)
      },
      event.threadID,
      () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      },
      event.messageID
    );

  } catch (err) {
    api.setMessageReaction("❌️", event.messageID, () => {}, true);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
