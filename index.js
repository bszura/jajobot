require('dotenv').config();

const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;

let botStatus = "Offline";

// ✅ Express (Render wymaga otwartego portu)
app.get("/", (req, res) => {
  res.json({
    status: botStatus,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log("🌐 Express running on port:", PORT);
});

// ✅ Discord bot
if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN missing!");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  botStatus = `✅ Online as ${client.user.tag}`;
  console.log("==================================");
  console.log("🤖 BOT ONLINE:", client.user.tag);
  console.log("📊 Guilds:", client.guilds.cache.size);
  console.log("==================================");
});

client.on("error", (err) => {
  console.error("❌ Discord error:", err);
});

console.log("⚡ Logging in...");
client.login(process.env.DISCORD_TOKEN);
