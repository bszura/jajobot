console.log('🚀 === DISCORD BOT TEST v2 ===');

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
        status: 'Bot Test v2 Running',
        timestamp: new Date().toISOString(),
        botStatus: client?.user?.tag || 'Not logged in'
    });
});

let client; // Global client variable

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
    console.log('TOKEN starts with:', process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.substring(0, 10) + '...' : 'MISSING');
    console.log('================================');
    
    if (!process.env.DISCORD_TOKEN) {
        console.error('❌ CRITICAL: DISCORD_TOKEN is missing!');
        console.error('Bot cannot start without token!');
        return;
    }
    
    // Create client - TEST 1: BASIC INTENTS ONLY
    console.log('🤖 Creating Discord client (TEST 1: Basic intents)...');
    
    client = new Client({
        intents: [GatewayIntentBits.Guilds] // Tylko podstawowy intent
    });
    
    console.log('✅ Discord client created');
    
    // Event handlers
    client.once('ready', () => {
        console.log('🎉 === BOT SUCCESSFULLY LOGGED IN ===');
        console.log(`✅ Logged in as: ${client.user.tag}`);
        console.log(`🆔 Bot ID: ${client.user.id}`);
        console.log(`📊 Connected to ${client.guilds.cache.size} guilds`);
        console.log(`👥 Can see ${client.users.cache.size} users`);
        console.log(`🏓 WebSocket ping: ${client.ws.ping}ms`);
        console.log(`🕐 Bot ready at: ${new Date().toISOString()}`);
        console.log('========================================');
        
        // Set status
        client.user.setActivity('🧪 Test Mode - Working!', { type: 3 });
    });
    
    client.on('error', error => {
        console.error('❌ Discord Client Error:', error.name, error.message);
    });
    
    client.on('warn', warning => {
        console.warn('⚠️ Discord Warning:', warning);
    });
    
    client.on('debug', info => {
        if (info.includes('login') || info.includes('ready') || info.includes('heartbeat')) {
            console.log('🔧 Discord Debug:', info);
        }
    });
    
    client.on('disconnect', () => {
        console.log('🔌 Discord client disconnected');
    });
    
    client.on('reconnecting', () => {
        console.log('🔄 Discord client reconnecting...');
    });
    
    // Login attempt WITH TIMEOUT
    console.log('⚡ === ATTEMPTING DISCORD LOGIN ===');
    console.log('Token preview:', process.env.DISCORD_TOKEN.substring(0, 20) + '...');
    console.log('Timestamp:', new Date().toISOString());
    
    // 30 second timeout
    const loginTimeout = setTimeout(() => {
        console.error('❌ === LOGIN TIMEOUT (30 seconds) ===');
        console.error('Login took too long - możliwe przyczyny:');
        console.error('1. 🔐 Privileged Gateway Intents nie włączone w Discord Developer Portal');
        console.error('2. 🎫 Token nieprawidłowy lub wygasł');
        console.error('3. 🌐 Problem sieciowy lub DNS');
        console.error('4. 🚫 Discord API down lub rate limit');
        console.error('5. 🔒 Bot zablokowany przez Discord');
        console.error('');
        console.error('💡 SPRAWDŹ: https://discord.com/developers/applications/1501940408958324736/bot');
        console.error('💡 WŁĄCZ: Wszystkie 3 Privileged Gateway Intents');
    }, 30000);
    
    client.login(process.env.DISCORD_TOKEN)
        .then(() => {
            clearTimeout(loginTimeout);
            console.log('✅ client.login() promise resolved successfully');
        })
        .catch(error => {
            clearTimeout(loginTimeout);
            console.error('❌ === LOGIN FAILED ===');
            console.error('Error type:', error.constructor.name);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            console.error('HTTP status:', error.status);
            console.error('Request data:', error.requestData);
            console.error('Full error object:', error);
            console.error('');
            
            // Specific error guidance
            if (error.code === 'TOKEN_INVALID' || error.message.includes('token')) {
                console.error('💡 ROZWIĄZANIE: Reset token w Discord Developer Portal');
                console.error('   1. Idź na: https://discord.com/developers/applications/1501940408958324736/bot');
                console.error('   2. Kliknij "Reset Token"');
                console.error('   3. Skopiuj nowy token');
                console.error('   4. Zaktualizuj DISCORD_TOKEN w Render Environment');
            }
            
            if (error.code === 'DISALLOWED_INTENTS' || error.message.includes('intent')) {
                console.error('💡 ROZWIĄZANIE: Włącz Privileged Gateway Intents');
                console.error('   1. Idź na: https://discord.com/developers/applications/1501940408958324736/bot');
                console.error('   2. Przewiń w dół do "Privileged Gateway Intents"');
                console.error('   3. Zaznacz wszystkie 3 opcje');
                console.error('   4. Kliknij "Save Changes"');
            }
            
            if (error.code === 'ENOTFOUND' || error.message.includes('network')) {
                console.error('💡 ROZWIĄZANIE: Problem sieciowy - spróbuj redeploy');
            }
        });
        
    console.log('⏳ Login attempt initiated, waiting for result...');
    
} catch (error) {
    console.error('❌ Critical error loading Discord.js:', error);
    console.error('Stack trace:', error.stack);
}

console.log('🏁 === SCRIPT EXECUTION COMPLETED ===');
console.log('🕐 Script completed at:', new Date().toISOString());

// Global error handlers
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error.name, error.message);
    console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at Promise:', promise);
    console.error('Reason:', reason);
});

// Keep process alive
process.on('SIGTERM', () => {
    console.log('📡 Received SIGTERM, shutting down gracefully');
    if (client) {
        client.destroy();
    }
    process.exit(0);
});

console.log('🛡️ Error handlers registered');
