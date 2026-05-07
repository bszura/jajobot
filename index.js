// ═══════════════════════════════════════════════════════════
// 📦 IMPORTY - WSZYSTKO NA POCZĄTKU (tylko raz!)
// ═══════════════════════════════════════════════════════════
const express = require('express');
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ChannelType,
    PermissionFlagsBits,
    REST,
    Routes,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    AttachmentBuilder
} = require('discord.js');
const fs = require('fs');

// Załaduj .env TYLKO jeśli istnieje (lokalnie)
if (fs.existsSync('.env')) {
    require('dotenv').config();
    console.log('📁 Załadowano .env (tryb lokalny)');
} else {
    console.log('☁️ Używam zmiennych środowiskowych (Render)');
}

// ═══════════════════════════════════════════════════════════
// 🤖 DISCORD CLIENT
// ═══════════════════════════════════════════════════════════
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences
    ]
});

// ═══════════════════════════════════════════════════════════
// 🌐 EXPRESS SERVER (dla Render)
// ═══════════════════════════════════════════════════════════
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🤖 Ultimate Discord Bot</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    padding: 20px;
                }
                .container {
                    text-align: center;
                    padding: 60px 40px;
                    background: rgba(255,255,255,0.15);
                    border-radius: 30px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    max-width: 600px;
                }
                h1 { 
                    font-size: 3.5em; 
                    margin-bottom: 20px;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                }
                p { 
                    font-size: 1.3em; 
                    margin: 15px 0;
                    opacity: 0.95;
                }
                .status { 
                    display: inline-block;
                    padding: 15px 30px;
                    background: #00ff00;
                    color: #000;
                    border-radius: 25px;
                    font-weight: bold;
                    margin: 30px 0;
                    font-size: 1.2em;
                    box-shadow: 0 4px 15px rgba(0,255,0,0.4);
                }
                .stats {
                    margin-top: 40px;
                    padding-top: 30px;
                    border-top: 2px solid rgba(255,255,255,0.3);
                }
                .stat-item {
                    display: inline-block;
                    margin: 10px 20px;
                    font-size: 1.1em;
                }
                .stat-value {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: #00ff00;
                }
                a {
                    color: #00ff00;
                    text-decoration: none;
                    font-weight: bold;
                }
                a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 Ultimate Discord Bot</h1>
                <p>Wielofunkcyjny bot Discord działa poprawnie!</p>
                <div class="status">✅ ONLINE</div>
                
                <div class="stats">
                    <div class="stat-item">
                        ⏰ Uptime:<br>
                        <span class="stat-value">${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s</span>
                    </div>
                    <div class="stat-item">
                        🌐 Serwery:<br>
                        <span class="stat-value">${client.guilds?.cache.size || 0}</span>
                    </div>
                    <div class="stat-item">
                        👥 Użytkownicy:<br>
                        <span class="stat-value">${client.users?.cache.size || 0}</span>
                    </div>
                    <div class="stat-item">
                        🏓 Ping:<br>
                        <span class="stat-value">${client.ws?.ping || 0}ms</span>
                    </div>
                </div>
                
                <p style="margin-top: 40px; font-size: 0.9em; opacity: 0.8;">
                    API Endpoints: <a href="/health">/health</a> | <a href="/stats">/stats</a>
                </p>
            </div>
        </body>
        </html>
    `);
});

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        guilds: client.guilds?.cache.size || 0,
        users: client.users?.cache.size || 0,
        ping: client.ws?.ping || 0
    });
});

app.get('/stats', (req, res) => {
    res.json({
        bot: {
            username: client.user?.username || 'Loading...',
            id: client.user?.id || null,
            status: 'online'
        },
        stats: {
            guilds: client.guilds?.cache.size || 0,
            users: client.users?.cache.size || 0,
            channels: client.channels?.cache.size || 0,
            uptime: process.uptime(),
            ping: client.ws?.ping || 0
        },
        system: {
            platform: process.platform,
            nodeVersion: process.version,
            memoryUsage: {
                heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
                heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`
            }
        }
    });
});

app.listen(PORT, () => {
    console.log(`🌐 Express server running on port ${PORT}`);
});

// ═══════════════════════════════════════════════════════════
// 💾 BAZA DANYCH (JSON)
// ═══════════════════════════════════════════════════════════

const invites = new Map();
const activeTickets = new Map();
let userLevels = {};
let warnings = {};

// Ładowanie danych
if (fs.existsSync('levels.json')) {
    userLevels = JSON.parse(fs.readFileSync('levels.json'));
}
if (fs.existsSync('warnings.json')) {
    warnings = JSON.parse(fs.readFileSync('warnings.json'));
}

function saveLevels() {
    fs.writeFileSync('levels.json', JSON.stringify(userLevels, null, 2));
}

function saveWarnings() {
    fs.writeFileSync('warnings.json', JSON.stringify(warnings, null, 2));
}

// ═══════════════════════════════════════════════════════════
// 🎫 KATEGORIE TICKETÓW
// ═══════════════════════════════════════════════════════════

const TICKET_CATEGORIES = {
    support: {
        name: '🛠️ Pomoc Techniczna',
        emoji: '🛠️',
        description: 'Problemy techniczne, błędy, pytania'
    },
    report: {
        name: '⚠️ Zgłoszenie',
        emoji: '⚠️',
        description: 'Zgłoś użytkownika lub problem'
    },
    partnership: {
        name: '🤝 Współpraca',
        emoji: '🤝',
        description: 'Propozycje współpracy'
    },
    other: {
        name: '📝 Inne',
        emoji: '📝',
        description: 'Pozostałe sprawy'
    }
};

// ═══════════════════════════════════════════════════════════
// ⚙️ FUNKCJE POMOCNICZE
// ═══════════════════════════════════════════════════════════

async function loadInvites(guild) {
    const firstInvites = await guild.invites.fetch();
    invites.set(guild.id, new Map(firstInvites.map((invite) => [invite.code, invite.uses])));
}

function getLevel(xp) {
    return Math.floor(0.1 * Math.sqrt(xp));
}

function getXpForLevel(level) {
    return Math.pow(level / 0.1, 2);
}

function addXP(userId, amount = 1) {
    if (!userLevels[userId]) {
        userLevels[userId] = { xp: 0, level: 0, lastMessage: 0 };
    }
    
    const now = Date.now();
    if (now - userLevels[userId].lastMessage < 60000) return null;
    
    userLevels[userId].lastMessage = now;
    userLevels[userId].xp += Math.floor(Math.random() * 15) + 15;
    
    const oldLevel = userLevels[userId].level;
    const newLevel = getLevel(userLevels[userId].xp);
    
    if (newLevel > oldLevel) {
        userLevels[userId].level = newLevel;
        saveLevels();
        return newLevel;
    }
    
    saveLevels();
    return null;
}

async function updateMemberCount(guild) {
    const channel = guild.channels.cache.get(process.env.MEMBER_COUNT_CHANNEL_ID);
    if (channel) {
        await channel.setName(`👥 Członków: ${guild.memberCount}`);
    }
}

// ═══════════════════════════════════════════════════════════
// 🤖 BOT GOTOWY
// ═══════════════════════════════════════════════════════════

client.once('ready', async () => {
    console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║   🤖 BOT ONLINE!                      ║
║   👤 ${client.user.tag.padEnd(29)} ║
║   🌟 ULTIMATE EDITION                 ║
║                                       ║
╚═══════════════════════════════════════╝
    `);
    
    client.user.setActivity('🎮 /help | Ultimate Bot', { type: 3 });
    
    for (const guild of client.guilds.cache.values()) {
        await loadInvites(guild);
        await updateMemberCount(guild);
    }
    
    await registerCommands();
    
    console.log('✅ Wszystkie systemy działają!');
    console.log(`📊 Serwery: ${client.guilds.cache.size}`);
    console.log(`👥 Użytkownicy: ${client.users.cache.size}`);
});

// ═══════════════════════════════════════════════════════════
// 👋 SYSTEM POWITALNY
// ═══════════════════════════════════════════════════════════

client.on('guildMemberAdd', async (member) => {
    console.log(`👤 Nowy członek: ${member.user.tag}`);
    
    const cachedInvites = invites.get(member.guild.id);
    const newInvites = await member.guild.invites.fetch();
    
    let inviter = null;
    
    const usedInviteData = newInvites.find(inv => {
        const cached = cachedInvites.get(inv.code);
        return cached < inv.uses;
    });
    
    if (usedInviteData) {
        inviter = usedInviteData.inviter;
    }
    
    invites.set(member.guild.id, new Map(newInvites.map((invite) => [invite.code, invite.uses])));
    
    const lobbyChannel = member.guild.channels.cache.get(process.env.LOBBY_CHANNEL_ID);
    
    if (lobbyChannel) {
        const welcomeEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🎉 Witamy na serwerze!')
            .setDescription(`Hej ${member}! Miło Cię widzieć! 👋\n\n**Jesteś naszym ${member.guild.memberCount}. członkiem!** 🎊`)
            .addFields(
                { 
                    name: '📨 Zaproszony przez', 
                    value: inviter ? `**${inviter.tag}**` : '❓ Nieznane zaproszenie',
                    inline: true 
                },
                { 
                    name: '📅 Konto utworzone', 
                    value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
                    inline: true 
                },
                {
                    name: '✅ Co dalej?',
                    value: '• Użyj `/verify` aby się zweryfikować\n• Przeczytaj regulamin\n• Miłej zabawy! 🎮'
                }
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
            .setTimestamp()
            .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() });
        
        await lobbyChannel.send({ 
            content: `${member} 🎉`,
            embeds: [welcomeEmbed] 
        });
    }
    
    const logChannel = member.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (logChannel) {
        const logEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setAuthor({ name: 'Nowy członek', iconURL: member.user.displayAvatarURL() })
            .setDescription(`${member.user.tag} dołączył do serwera`)
            .addFields(
                { name: 'ID', value: member.id, inline: true },
                { name: 'Zaproszony przez', value: inviter ? inviter.tag : 'Nieznane', inline: true },
                { name: 'Konto utworzone', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setTimestamp();
        
        await logChannel.send({ embeds: [logEmbed] });
    }
    
    await updateMemberCount(member.guild);
});

client.on('guildMemberRemove', async (member) => {
    const logChannel = member.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (logChannel) {
        const logEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setAuthor({ name: 'Członek opuścił serwer', iconURL: member.user.displayAvatarURL() })
            .setDescription(`${member.user.tag} opuścił serwer`)
            .addFields(
                { name: 'ID', value: member.id, inline: true },
                { name: 'Dołączył', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true }
            )
            .setTimestamp();
        
        await logChannel.send({ embeds: [logEmbed] });
    }
    
    const lobbyChannel = member.guild.channels.cache.get(process.env.LOBBY_CHANNEL_ID);
    if (lobbyChannel) {
        await lobbyChannel.send(`👋 **${member.user.tag}** opuścił serwer... Do zobaczenia! 😢`);
    }
    
    await updateMemberCount(member.guild);
});

// ═══════════════════════════════════════════════════════════
// 📝 SYSTEM POZIOMÓW
// ═══════════════════════════════════════════════════════════

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;
    
    const newLevel = addXP(message.author.id);
    
    if (newLevel) {
        const levelUpEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🎉 LEVEL UP!')
            .setDescription(`${message.author} awansował na poziom **${newLevel}**! 🚀`)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '📊 Nowy poziom', value: `**${newLevel}**`, inline: true },
                { name: '⭐ XP', value: `**${userLevels[message.author.id].xp}**`, inline: true }
            )
            .setTimestamp();
        
        const levelChannel = message.guild.channels.cache.get(process.env.LEVEL_UP_CHANNEL_ID) || message.channel;
        await levelChannel.send({ embeds: [levelUpEmbed] });
    }
    
    const content = message.content.toLowerCase();
    if (content.includes('bot')) await message.react('🤖').catch(() => {});
    if (content.includes('❤️') || content.includes('love')) await message.react('❤️').catch(() => {});
    if (content.includes('🎉')) await message.react('🎉').catch(() => {});
    if (content.includes('cześć') || content.includes('hej')) await message.react('👋').catch(() => {});
});

// ═══════════════════════════════════════════════════════════
// 🗑️ LOGI
// ═══════════════════════════════════════════════════════════

client.on('messageDelete', async (message) => {
    if (!message.guild) return;
    if (message.author?.bot) return;
    
    const logChannel = message.guild.channels.cache.get(process.env.MESSAGE_LOG_CHANNEL_ID);
    if (!logChannel) return;
    
    const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setAuthor({ name: 'Wiadomość usunięta', iconURL: message.author?.displayAvatarURL() })
        .setDescription(`**Autor:** ${message.author}\n**Kanał:** ${message.channel}\n**Treść:**\n\`\`\`${message.content || 'Brak treści'}\`\`\``)
        .setTimestamp();
    
    await logChannel.send({ embeds: [embed] });
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (!oldMessage.guild) return;
    if (oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    
    const logChannel = oldMessage.guild.channels.cache.get(process.env.MESSAGE_LOG_CHANNEL_ID);
    if (!logChannel) return;
    
    const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setAuthor({ name: 'Wiadomość edytowana', iconURL: oldMessage.author?.displayAvatarURL() })
        .setDescription(`**Autor:** ${oldMessage.author}\n**Kanał:** ${oldMessage.channel}\n[Przejdź do wiadomości](${newMessage.url})`)
        .addFields(
            { name: '📝 Przed', value: `\`\`\`${oldMessage.content?.substring(0, 1000) || 'Brak treści'}\`\`\`` },
            { name: '✅ Po', value: `\`\`\`${newMessage.content?.substring(0, 1000) || 'Brak treści'}\`\`\`` }
        )
        .setTimestamp();
    
    await logChannel.send({ embeds: [embed] });
});

client.on('inviteCreate', async (invite) => {
    const cachedInvites = invites.get(invite.guild.id);
    cachedInvites.set(invite.code, invite.uses);
});

client.on('inviteDelete', async (invite) => {
    const cachedInvites = invites.get(invite.guild.id);
    cachedInvites.delete(invite.code);
});

// ═══════════════════════════════════════════════════════════
// 🎮 INTERAKCJE - Tutaj wklej CAŁĄ sekcję z interakcjami
// (verify, tickety, komendy itp. - wszystko co było wcześniej)
// ═══════════════════════════════════════════════════════════

// ... (reszta kodu z ticketami i komendami - za długi żeby wszystko wkleić)
// SKOPIUJ TO Z POPRZEDNIEGO KODU!

// ═══════════════════════════════════════════════════════════
// 📋 REJESTRACJA KOMEND
// ═══════════════════════════════════════════════════════════

async function registerCommands() {
    const commands = [
        { name: 'verify', description: 'Zweryfikuj swoje konto na serwerze' },
        { name: 'ticket', description: 'Otwórz nowy ticket supportowy' },
        { 
            name: 'ticket-panel', 
            description: 'Utwórz panel ticketów (tylko admin)',
            default_member_permissions: PermissionFlagsBits.Administrator.toString()
        },
        { 
            name: 'level', 
            description: 'Sprawdź poziom użytkownika',
            options: [{ name: 'użytkownik', description: 'Wybierz użytkownika', type: 6, required: false }]
        },
        { name: 'leaderboard', description: 'Zobacz ranking najlepszych użytkowników' },
        { 
            name: 'avatar', 
            description: 'Pokaż avatar użytkownika',
            options: [{ name: 'użytkownik', description: 'Wybierz użytkownika', type: 6, required: false }]
        },
        { 
            name: 'userinfo', 
            description: 'Pokaż informacje o użytkowniku',
            options: [{ name: 'użytkownik', description: 'Wybierz użytkownika', type: 6, required: false }]
        },
        { name: 'serverinfo', description: 'Pokaż informacje o serwerze' },
        { name: 'stats', description: 'Zobacz statystyki bota' },
        { name: 'help', description: 'Lista wszystkich komend' }
    ];
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        console.log('🔄 Rejestrowanie komend slash...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        console.log('✅ Komendy zarejestrowane!');
    } catch (error) {
        console.error('❌ Błąd rejestracji komend:', error);
    }
}

// Logowanie bota
client.login(process.env.DISCORD_TOKEN);
