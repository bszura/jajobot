const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');

// Express (dla Render)
const app = express();
const PORT = process.env.PORT || 3000;

let botStatus = 'Offline';

app.get('/', (req, res) => {
  res.json({ 
    status: botStatus,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log('✅ Express running on port:', PORT);
});

// Discord Bot
console.log('🤖 Starting Discord bot...');
console.log('Token check:', process.env.DISCORD_TOKEN ? '✅ Token found' : '❌ Token missing');

if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN not set in environment variables!');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  botStatus = `Online: ${client.user.tag}`;
  console.log('');
  console.log('========================================');
  console.log('🎉 BOT SUCCESSFULLY LOGGED IN!');
  console.log('👤 Username:', client.user.tag);
  console.log('🆔 Bot ID:', client.user.id);
  console.log('📊 Total Guilds:', client.guilds.cache.size);
  console.log('👥 Total Users:', client.users.cache.size);
  console.log('🏓 Ping:', client.ws.ping + 'ms');
  console.log('========================================');
  console.log('');
  
  // Lista wszystkich serwerów
  client.guilds.cache.forEach(guild => {
    console.log(`  Server: ${guild.name} (${guild.id}) - ${guild.memberCount} members`);
  });
  
  client.user.setActivity('🟢 Online!', { type: 3 });
});

client.on('error', (error) => {
  console.error('❌ Discord Client Error:', error.message);
  botStatus = 'Error: ' + error.message;
});

client.on('debug', (info) => {
  if (info.includes('login') || info.includes('ready') || info.includes('heartbeat')) {
    console.log('🔧', info);
  }
});

console.log('⚡ Attempting to login...');

client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    console.log('✅ Login command executed');
  })
  .catch((error) => {
    console.error('❌ LOGIN FAILED!');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    botStatus = 'Login failed: ' + error.message;
  });

console.log('🏁 Setup complete, waiting for Discord response...');
