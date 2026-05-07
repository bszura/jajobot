console.log('🚀 === DISCORD BOT TEST START ===');

// Environment
if (require('fs').existsSync('.env')) {
    require('dotenv').config();
    console.log('📁 .env loaded');
} else {
    console.log('☁️ Using Render environment variables');
}

console.log('✅ Environment loaded');

// Express
console.log('📦 Loading Express...');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({
        status: 'Bot Test Running',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🌐 Express server running on port ${PORT}`);
});

console.log('✅ Express setup complete');

// Discord
console.log('📦 Loading Discord.js...');

try {
    const { Client, GatewayIntentBits } = require('discord.js');
    console.log('✅ Discord.js imported successfully');
    
    // Environment check
    console.log('🔧 === ENVIRONMENT CHECK ===');
    console.log('DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? `SET (${process.env.DISCORD_TOKEN.length} chars)` : '❌ MISSING');
    console.log('CLIENT_ID:', process.env.CLIENT_ID || '❌ MISSING');
    console.log('GUILD_ID:', process.env.GUILD_ID || '❌ MISSING');
    console.log('================================');
    
    if (!process.env.DISCORD_TOKEN) {
        console.error('❌ CRITICAL: DISCORD_TOKEN is missing!');
        console.error('Bot cannot start without token!');
        return;
    }
    
    // Create client
    console.log('🤖 Creating Discord client...');
    
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages
        ]
    });
    
    console.log('✅ Discord client created');
    
    // Ready event
    client.once('ready', () => {
        console.log('🎉 === BOT SUCCESSFULLY LOGGED IN ===');
        console.log(`✅ Logged in as: ${client.user.tag}`);
        console.log(`📊 Connected to ${client.guilds.cache.size} guilds`);
        console.log(`👥 Can see ${client.users.cache.size} users`);
        console.log(`🏓 WebSocket ping: ${client.ws.ping}ms`);
        console.log('========================================');
    });
    
    // Error handler
    client.on('error', error => {
        console.error('❌ Discord Client Error:', error);
    });
    
    // Login attempt
    console.log('⚡ === ATTEMPTING DISCORD LOGIN ===');
    console.log('Token preview:', process.env.DISCORD_TOKEN.substring(0, 20) + '...');
    
    client.login(process.env.DISCORD_TOKEN)
        .then(() => {
            console.log('✅ client.login() promise resolved');
        })
        .catch(error => {
            console.error('❌ === LOGIN FAILED ===');
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            console.error('Full error:', error);
        });
        
    console.log('⏳ Login attempt initiated...');
    
} catch (error) {
    console.error('❌ Error loading Discord.js:', error);
}

console.log('🏁 === SCRIPT EXECUTION COMPLETED ===');

// Global error handlers
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
});
