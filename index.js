// 🌙 NyxQuote Bot
// by @shdowtyrant_ | watermark: @Nythera_Team

import fs from "fs";
import path from "path";
import { Client, GatewayIntentBits, EmbedBuilder, REST, Routes } from "discord.js";
import dotenv from "dotenv";
import schedule from "node-schedule";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// --- Config ---
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const QUOTE_CHANNEL_ID = process.env.QUOTE_CHANNEL_ID;
const QUOTES_FILE = path.join(__dirname, "quotes.json");
const BANNER_FILE = path.join(__dirname, "banner.json");
const SETTINGS_FILE = path.join(__dirname, "settings.json");

// --- Load / Save ---
const loadFile = (file, fallback) => {
  try {
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
    return JSON.parse(fs.readFileSync(file));
  } catch {
    return fallback;
  }
};

let quotes = loadFile(QUOTES_FILE, []);
let banners = loadFile(BANNER_FILE, []);
let settings = loadFile(SETTINGS_FILE, { autoQuote: true });

const saveSettings = () => fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const toWIB = (date = new Date()) => {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + 7 * 3600000);
};

// --- Gradient Colors ---
const gradientColors = ["#a680f5", "#8e95ff", "#b28dff", "#cfa0ff", "#dba9ff"];
let colorIndex = 0;
const nextColor = () => {
  const color = gradientColors[colorIndex];
  colorIndex = (colorIndex + 1) % gradientColors.length;
  return color;
};

// --- Send Night Quote + Banner ---
async function sendNightQuote() {
  try {
    const channel = client.channels.cache.get(QUOTE_CHANNEL_ID);
    if (!channel || !settings.autoQuote || quotes.length === 0) return;
    const quote = randomItem(quotes);
    const banner = banners.length > 0 ? randomItem(banners) : null;
    const embed = new EmbedBuilder()
      .setColor(nextColor())
      .setTitle("✨ Whisper of Nyx ✨")
      .setDescription(`\n🌌 Di antara bintang-bintang, Nyx berbisik…\n\n> "${quote}"\n\n💫 Semoga tenangnya malam menyimpan pesan ini.`)
      .setFooter({ text: "✨ @Nythera_Team • Prophetess of Shadowed Starlight" })
      .setTimestamp();
    if (banner) embed.setImage(banner);
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error("Error sending nightly quote:", err);
  }
}

schedule.scheduleJob({ hour: 21, minute: 0, tz: "Asia/Jakarta" }, sendNightQuote);

// --- Bot Log Functions ---
async function sendOnlineLog() {
  const log = client.channels.cache.get(LOG_CHANNEL_ID);
  if (!log) return;
  const embed = new EmbedBuilder()
    .setColor(nextColor())
    .setTitle("💫 Nyx Awakened")
    .setDescription(`\n🌙 Sang Dewi terbangun...\n🌌 Bayangan kembali bergerak\n\n⏰ Time: **${toWIB().toLocaleTimeString("id-ID")} WIB**\n✨ Status: Active\n`)
    .setFooter({ text: "@Nythera_Team • celestial presence" })
    .setTimestamp();
  await log.send({ embeds: [embed] });
}

async function sendOfflineLog() {
  const log = client.channels.cache.get(LOG_CHANNEL_ID);
  if (!log) return;
  const embed = new EmbedBuilder()
    .setColor("#5b4a91")
    .setTitle("🌑 Nyx Entered Slumber")
    .setDescription(`\n🌑 Cahaya bulan padam...\n💤 System terlelap\n\n⏰ Time: **${toWIB().toLocaleTimeString("id-ID")} WIB**\n⚡ Status: Offline\n`)
    .setFooter({ text: "@Nythera_Team • silent nightfall" })
    .setTimestamp();
  await log.send({ embeds: [embed] });
}

process.on("SIGINT", async () => { await sendOfflineLog(); process.exit(0); });
process.on("SIGTERM", async () => { await sendOfflineLog(); process.exit(0); });

// --- Bot Ready ---
client.once("ready", async () => {
  console.log(`🌙 NyxQuote active as ${client.user.tag}`);
  await sendOnlineLog();

  const commands = [
    { name: "help", description: "Show help menu" },
    { name: "status", description: "Show bot status" },
    { name: "quote", description: "Quote replied message", options: [{ type: 3, name: "text", description: "Text to quote", required: false }]},
    { name: "sendquote", description: "Send manual quote" },
    { name: "addquote", description: "Add a new quote", options: [{ type: 3, name: "text", description: "Quote text", required: true }]},
    { name: "delquote", description: "Delete quote by index", options: [{ type: 4, name: "index", description: "Quote index", required: true }]},
    { name: "quotes", description: "List all quotes" },
    { name: "addbanner", description: "Add a new banner", options: [{ type: 3, name: "url", description: "Banner URL", required: true }]},
    { name: "delbanner", description: "Delete banner by index", options: [{ type: 4, name: "index", description: "Banner index", required: true }]},
    { name: "banners", description: "Show all banners" },
    { name: "togglequote", description: "Toggle auto nightly quote" }
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try { await rest.put(Routes.applicationCommands(client.user.id), { body: commands }); }
  catch (err) { console.error("Error registering slash commands:", err); }
});

// --- Slash Command Handler ---
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  const { commandName, options } = interaction;
  const randomBanner = randomItem(banners);

  try {
    if (commandName === "help") {
      const embed = new EmbedBuilder()
        .setColor(nextColor())
        .setTitle("🌌 NyxQuote Command List")
        .setDescription([
          "**General Commands**",
          "`/help` — Show this help menu",
          "`/status` — Show bot status",
          "", "**Quotes Management**",
          "`/quote` — Quote replied message",
          "`/sendquote` — Send manual quote",
          "`/addquote (text)` — Add a new quote",
          "`/delquote (index)` — Delete quote by index",
          "`/quotes` — Show all quotes",
          "", "**Banners Management**",
          "`/addbanner (url)` — Add banner",
          "`/delbanner (index)` — Delete banner",
          "`/banners` — Show all banners",
          "", "**Automation**",
          "`/togglequote` — Enable/disable nightly quote"
        ].join("\n"))
        .setFooter({ text: "@Nythera_Team • graceful commands" })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    else if (commandName === "status") {
      const ping = Date.now() - interaction.createdTimestamp;
      const dev = `<@1082466641201344633>`;
      const embed = new EmbedBuilder()
        .setColor(nextColor())
        .setTitle("🔮 Nyx Status")
        .setDescription(`\n✨ Status     : Active and serene\n⏱ Ping       : ${ping} ms\n👤 Developer  : ${dev}\n`)
        .setImage("https://i.imgur.com/K7eT6T3.gif")
        .setFooter({ text: "@Nythera_Team • ethereal presence" })
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    else if (commandName === "quote") {
      const text = options.getString("text");
      if (text) {
        const embed = new EmbedBuilder()
          .setColor(nextColor())
          .setTitle("✨ Quotes of the goddess")
          .setDescription(`\n🌌 Dari bayangan malam:\n\n> "${text}"\n\n💫 Semoga pesan ini tetap abadi dalam cahaya`)
          .setFooter({ text: "@Nythera_Team • whisper of night" })
          .setTimestamp();
        return interaction.reply({ embeds: [embed] });
      } else {
        return interaction.reply({ content: "✨ Provide text to quote!", ephemeral: true });
      }
    }

    else if (commandName === "sendquote") {
      if (quotes.length === 0) return interaction.reply({ content: "🌌 No quotes stored yet!", ephemeral: true });
      const quote = randomItem(quotes);
      const banner = banners.length > 0 ? randomItem(banners) : null;
      const embed = new EmbedBuilder()
        .setColor(nextColor())
        .setTitle("✨ Nyx Quote")
        .setDescription(`\n🌌 Di antara bintang-bintang, Nyx berbisik…\n\n> "${quote}"\n\n💫 Semoga tenangnya malam menyimpan pesan ini.`)
        .setFooter({ text: "@Nythera_Team • manual quote" })
        .setTimestamp();
      if (banner) embed.setImage(banner);
      return interaction.reply({ embeds: [embed] });
    }

    else if (commandName === "addquote") {
      const text = options.getString("text");
      quotes.push(text);
      fs.writeFileSync(QUOTES_FILE, JSON.stringify(quotes, null, 2));
      return interaction.reply({ content: "🌙 Quote ditambahkan dengan puitis.", ephemeral: true });
    }

    else if (commandName === "delquote") {
      const index = options.getInteger("index");
      if (isNaN(index) || index < 1 || index > quotes.length) return interaction.reply({ content: "⚠️ Index quote tidak valid!", ephemeral: true });
      quotes.splice(index - 1, 1);
      fs.writeFileSync(QUOTES_FILE, JSON.stringify(quotes, null, 2));
      return interaction.reply({ content: "💫 Quote dihapus dari ingatan malam.", ephemeral: true });
    }

    else if (commandName === "quotes") {
      const list = quotes.map((q,i) => `**${i+1}.** 🌙 ${q}`).join("\n\n").slice(0,4090);
      const embed = new EmbedBuilder()
        .setColor(nextColor())
        .setTitle("📜 Nyx Quotes Archive")
        .setDescription(list || "🌌 Belum ada quote yang tersimpan")
        .setFooter({ text: "@Nythera_Team • archive of serenity" })
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    else if (commandName === "addbanner") {
      const url = options.getString("url");
      const imageRegex = /\.(jpeg|jpg|gif|png|webp)$/i;
      if (!url || !imageRegex.test(url)) return interaction.reply({ content: "⚠️ Provide valid image URL!", ephemeral: true });
      banners.push(url);
      fs.writeFileSync(BANNER_FILE, JSON.stringify(banners, null, 2));
      return interaction.reply({ content: "🌌 Banner ditambahkan dengan keindahan malam.", ephemeral: true });
    }

    else if (commandName === "delbanner") {
      const index = options.getInteger("index");
      if (isNaN(index) || index < 1 || index > banners.length) return interaction.reply({ content: "⚠️ Index banner tidak valid!", ephemeral: true });
      banners.splice(index-1,1);
      fs.writeFileSync(BANNER_FILE, JSON.stringify(banners,null,2));
      return interaction.reply({ content: "💫 Banner dihapus dari galeri malam.", ephemeral: true });
    }

    else if (commandName === "banners") {
      const list = banners.map((b,i)=>`**${i+1}.** 🌌 Banner menunggu cahaya: ${b}`).join("\n\n").slice(0,4090);
      const embed = new EmbedBuilder()
        .setColor(nextColor())
        .setTitle("🌌 Nyx Banner Collection")
        .setDescription(list || "✨ Belum ada banner yang tersimpan")
        .setFooter({ text: "@Nythera_Team • gallery of serenity" })
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    else if (commandName === "togglequote") {
      settings.autoQuote = !settings.autoQuote;
      saveSettings();
      return interaction.reply({ content: `Auto nightly quotes are now **${settings.autoQuote ? "enabled 🌙" : "disabled 🌑"}**.`, ephemeral: true });
    }

  } catch (err) {
    console.error("Error processing command:", err);
    return interaction.reply({ content: "⚠️ Something went wrong while executing this command.", ephemeral: true });
  }
});

client.login(process.env.TOKEN);
