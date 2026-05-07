// ═══════════════════════════════════════════════════════════
// 📦 IMPORTY - WSZYSTKO NA POCZĄTKU
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
    try {
        userLevels = JSON.parse(fs.readFileSync('levels.json'));
        console.log(`📊 Załadowano ${Object.keys(userLevels).length} poziomów użytkowników`);
    } catch (error) {
        console.log('⚠️ Błąd ładowania levels.json, tworzę nowy plik');
        userLevels = {};
    }
}

if (fs.existsSync('warnings.json')) {
    try {
        warnings = JSON.parse(fs.readFileSync('warnings.json'));
        console.log(`⚠️ Załadowano ostrzeżenia dla ${Object.keys(warnings).length} użytkowników`);
    } catch (error) {
        console.log('⚠️ Błąd ładowania warnings.json, tworzę nowy plik');
        warnings = {};
    }
}

function saveLevels() {
    try {
        fs.writeFileSync('levels.json', JSON.stringify(userLevels, null, 2));
    } catch (error) {
        console.error('❌ Błąd zapisywania levels.json:', error);
    }
}

function saveWarnings() {
    try {
        fs.writeFileSync('warnings.json', JSON.stringify(warnings, null, 2));
    } catch (error) {
        console.error('❌ Błąd zapisywania warnings.json:', error);
    }
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
    try {
        const firstInvites = await guild.invites.fetch();
        invites.set(guild.id, new Map(firstInvites.map((invite) => [invite.code, invite.uses])));
        console.log(`📨 Załadowano ${firstInvites.size} zaproszeń dla ${guild.name}`);
    } catch (error) {
        console.error(`❌ Błąd ładowania zaproszeń dla ${guild.name}:`, error.message);
    }
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
    if (!process.env.MEMBER_COUNT_CHANNEL_ID) return;
    
    try {
        const channel = guild.channels.cache.get(process.env.MEMBER_COUNT_CHANNEL_ID);
        if (channel) {
            await channel.setName(`👥 Członków: ${guild.memberCount}`);
        }
    } catch (error) {
        console.error('❌ Błąd aktualizacji licznika członków:', error.message);
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
    
    // Sprawdź uprawnienia
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (guild) {
        const botMember = guild.members.cache.get(client.user.id);
        if (botMember?.permissions.has(PermissionFlagsBits.Administrator)) {
            console.log('✅ Bot ma uprawnienia administratora!');
        } else {
            console.log('⚠️ Bot NIE MA uprawnień administratora!');
        }
    }
    
    // REJESTRUJ KOMENDY (z force refresh)
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
    
    try {
        const cachedInvites = invites.get(member.guild.id);
        const newInvites = await member.guild.invites.fetch();
        
        let inviter = null;
        
        const usedInviteData = newInvites.find(inv => {
            const cached = cachedInvites?.get(inv.code) || 0;
            return cached < inv.uses;
        });
        
        if (usedInviteData) {
            inviter = usedInviteData.inviter;
        }
        
        invites.set(member.guild.id, new Map(newInvites.map((invite) => [invite.code, invite.uses])));
        
        // Powitanie
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
        
        // Log
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
        
    } catch (error) {
        console.error('❌ Błąd przy dołączeniu członka:', error.message);
    }
});

client.on('guildMemberRemove', async (member) => {
    try {
        // Log
        const logChannel = member.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ name: 'Członek opuścił serwer', iconURL: member.user.displayAvatarURL() })
                .setDescription(`${member.user.tag} opuścił serwer`)
                .addFields(
                    { name: 'ID', value: member.id, inline: true },
                    { name: 'Dołączył', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Nieznane', inline: true }
                )
                .setTimestamp();
            
            await logChannel.send({ embeds: [logEmbed] });
        }
        
        // Pożegnanie
        const lobbyChannel = member.guild.channels.cache.get(process.env.LOBBY_CHANNEL_ID);
        if (lobbyChannel) {
            await lobbyChannel.send(`👋 **${member.user.tag}** opuścił serwer... Do zobaczenia! 😢`);
        }
        
        await updateMemberCount(member.guild);
        
    } catch (error) {
        console.error('❌ Błąd przy opuszczeniu członka:', error.message);
    }
});

// ═══════════════════════════════════════════════════════════
// 📝 SYSTEM POZIOMÓW
// ═══════════════════════════════════════════════════════════

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;
    
    try {
        // Dodaj XP
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
        
        // Auto-reakcje
        const content = message.content.toLowerCase();
        if (content.includes('bot')) await message.react('🤖').catch(() => {});
        if (content.includes('❤️') || content.includes('love')) await message.react('❤️').catch(() => {});
        if (content.includes('🎉')) await message.react('🎉').catch(() => {});
        if (content.includes('cześć') || content.includes('hej')) await message.react('👋').catch(() => {});
        
    } catch (error) {
        console.error('❌ Błąd w messageCreate:', error.message);
    }
});

// ═══════════════════════════════════════════════════════════
// 🗑️ LOGI WIADOMOŚCI
// ═══════════════════════════════════════════════════════════

client.on('messageDelete', async (message) => {
    if (!message.guild) return;
    if (message.author?.bot) return;
    if (!process.env.MESSAGE_LOG_CHANNEL_ID) return;
    
    try {
        const logChannel = message.guild.channels.cache.get(process.env.MESSAGE_LOG_CHANNEL_ID);
        if (!logChannel) return;
        
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setAuthor({ name: 'Wiadomość usunięta', iconURL: message.author?.displayAvatarURL() })
            .setDescription(`**Autor:** ${message.author}\n**Kanał:** ${message.channel}\n**Treść:**\n\`\`\`${(message.content || 'Brak treści').substring(0, 1000)}\`\`\``)
            .setTimestamp();
        
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('❌ Błąd logowania usuniętej wiadomości:', error.message);
    }
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (!oldMessage.guild) return;
    if (oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    if (!process.env.MESSAGE_LOG_CHANNEL_ID) return;
    
    try {
        const logChannel = oldMessage.guild.channels.cache.get(process.env.MESSAGE_LOG_CHANNEL_ID);
        if (!logChannel) return;
        
        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setAuthor({ name: 'Wiadomość edytowana', iconURL: oldMessage.author?.displayAvatarURL() })
            .setDescription(`**Autor:** ${oldMessage.author}\n**Kanał:** ${oldMessage.channel}\n[Przejdź do wiadomości](${newMessage.url})`)
            .addFields(
                { name: '📝 Przed', value: `\`\`\`${(oldMessage.content || 'Brak treści').substring(0, 500)}\`\`\`` },
                { name: '✅ Po', value: `\`\`\`${(newMessage.content || 'Brak treści').substring(0, 500)}\`\`\`` }
            )
            .setTimestamp();
        
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('❌ Błąd logowania edytowanej wiadomości:', error.message);
    }
});

// ═══════════════════════════════════════════════════════════
// 📨 SYSTEM ZAPROSZEŃ
// ═══════════════════════════════════════════════════════════

client.on('inviteCreate', async (invite) => {
    try {
        const cachedInvites = invites.get(invite.guild.id);
        if (cachedInvites) {
            cachedInvites.set(invite.code, invite.uses);
        }
    } catch (error) {
        console.error('❌ Błąd przy tworzeniu zaproszenia:', error.message);
    }
});

client.on('inviteDelete', async (invite) => {
    try {
        const cachedInvites = invites.get(invite.guild.id);
        if (cachedInvites) {
            cachedInvites.delete(invite.code);
        }
    } catch (error) {
        console.error('❌ Błąd przy usuwaniu zaproszenia:', error.message);
    }
});

// ═══════════════════════════════════════════════════════════
// 🎮 INTERAKCJE
// ═══════════════════════════════════════════════════════════

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand() && !interaction.isButton() && !interaction.isStringSelectMenu()) return;
    
    try {
        // ✅ VERIFY
        if (interaction.commandName === 'verify') {
            const member = interaction.member;
            
            if (member.roles.cache.has(process.env.VERIFIED_ROLE_ID)) {
                return interaction.reply({ 
                    content: '✅ Jesteś już zweryfikowany!', 
                    ephemeral: true 
                });
            }
            
            const verifyEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🔐 Weryfikacja konta')
                .setDescription(
                    '**Kliknij przycisk poniżej aby zweryfikować swoje konto!**\n\n' +
                    '✨ Po weryfikacji otrzymasz pełny dostęp do serwera\n' +
                    '🎯 To tylko jedno kliknięcie!\n\n'
                )
                .setThumbnail(interaction.guild.iconURL())
                .setFooter({ text: 'Kliknij przycisk poniżej' })
                .setTimestamp();
            
            const verifyButton = new ButtonBuilder()
                .setCustomId('verify_button')
                .setLabel('✅ Zweryfikuj się')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🎉');
            
            const row = new ActionRowBuilder().addComponents(verifyButton);
            
            await interaction.reply({ embeds: [verifyEmbed], components: [row], ephemeral: true });
        }
        
        if (interaction.customId === 'verify_button') {
            const verifiedRole = interaction.guild.roles.cache.get(process.env.VERIFIED_ROLE_ID);
            
            if (!verifiedRole) {
                return interaction.reply({ content: '❌ Błąd: Rola zweryfikowanych nie istnieje!', ephemeral: true });
            }
            
            await interaction.member.roles.add(verifiedRole);
            
            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Weryfikacja zakończona!')
                .setDescription(
                    `**Gratulacje ${interaction.user}!** 🎊\n\n` +
                    '✅ Twoje konto zostało zweryfikowane\n' +
                    '🔓 Masz teraz pełny dostęp do serwera\n' +
                    '💬 Miłej zabawy!\n\n' +
                    '🎉 Witamy oficjalnie w społeczności!'
                )
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
            
            await interaction.update({ embeds: [successEmbed], components: [] });
            
            const lobbyChannel = interaction.guild.channels.cache.get(process.env.LOBBY_CHANNEL_ID);
            if (lobbyChannel) {
                await lobbyChannel.send(`🎊 **${interaction.user.tag}** został zweryfikowany! Witamy oficjalnie! 🎉`);
            }
        }
        
        // 🎫 TICKET SYSTEM
        if (interaction.commandName === 'ticket') {
            const existingTicket = activeTickets.get(interaction.user.id);
            if (existingTicket) {
                return interaction.reply({
                    content: `❌ Masz już otwarty ticket: <#${existingTicket}>`,
                    ephemeral: true
                });
            }
            
            const ticketEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎫 Otwórz Ticket')
                .setDescription(
                    '**Wybierz kategorię swojego ticketu:**\n\n' +
                    Object.values(TICKET_CATEGORIES).map(cat => 
                        `${cat.emoji} **${cat.name}**\n${cat.description}`
                    ).join('\n\n')
                )
                .setFooter({ text: 'Wybierz kategorię z menu poniżej' })
                .setTimestamp();
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('ticket_category')
                .setPlaceholder('🎫 Wybierz kategorię ticketu')
                .addOptions(
                    Object.entries(TICKET_CATEGORIES).map(([key, cat]) => 
                        new StringSelectMenuOptionBuilder()
                            .setLabel(cat.name)
                            .setDescription(cat.description)
                            .setValue(key)
                            .setEmoji(cat.emoji)
                    )
                );
            
            const row = new ActionRowBuilder().addComponents(selectMenu);
            
            await interaction.reply({ embeds: [ticketEmbed], components: [row], ephemeral: true });
        }
        
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category') {
            await interaction.deferReply({ ephemeral: true });
            
            const category = interaction.values[0];
            const categoryData = TICKET_CATEGORIES[category];
            
            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                type: ChannelType.GuildText,
                parent: process.env.TICKET_CATEGORY_ID || null,
                topic: `Ticket użytkownika ${interaction.user.tag} | Kategoria: ${categoryData.name}`,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    },
                    ...(process.env.STAFF_ROLE_ID ? [{
                        id: process.env.STAFF_ROLE_ID,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    }] : [])
                ]
            });
            
            activeTickets.set(interaction.user.id, ticketChannel.id);
            
            const ticketInfoEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`${categoryData.emoji} ${categoryData.name}`)
                .setDescription(
                    `**Witaj ${interaction.user}!**\n\n` +
                    `Twój ticket został utworzony!\n` +
                    `📋 Kategoria: **${categoryData.name}**\n\n` +
                    `Opisz szczegółowo swój problem, a nasz team wkrótce Ci pomoże! 💙\n\n` +
                    `🔔 Staff został powiadomiony`
                )
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Ticket ID: ${ticketChannel.id}` })
                .setTimestamp();
            
            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('🔒 Zamknij Ticket')
                .setStyle(ButtonStyle.Danger);
            
            const claimButton = new ButtonBuilder()
                .setCustomId('claim_ticket')
                .setLabel('✋ Przejmij Ticket')
                .setStyle(ButtonStyle.Primary);
            
            const row = new ActionRowBuilder().addComponents(claimButton, closeButton);
            
            const content = process.env.STAFF_ROLE_ID ? `${interaction.user} <@&${process.env.STAFF_ROLE_ID}>` : `${interaction.user}`;
            
            await ticketChannel.send({
                content: content,
                embeds: [ticketInfoEmbed],
                components: [row]
            });
            
            await interaction.editReply({ content: `✅ Ticket utworzony: ${ticketChannel}` });
            
            // Log
            const logChannel = interaction.guild.channels.cache.get(process.env.TICKET_LOG_CHANNEL_ID);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('🎫 Nowy Ticket')
                    .addFields(
                        { name: 'Użytkownik', value: `${interaction.user.tag}`, inline: true },
                        { name: 'Kategoria', value: categoryData.name, inline: true },
                        { name: 'Kanał', value: `${ticketChannel}`, inline: true }
                    )
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed] });
            }
        }
        
        if (interaction.customId === 'claim_ticket') {
            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setDescription(`✋ ${interaction.user} przejął ten ticket!`)
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        }
        
        if (interaction.customId === 'close_ticket') {
            const confirmEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔒 Zamykanie Ticketu')
                .setDescription('Czy na pewno chcesz zamknąć ten ticket?')
                .setTimestamp();
            
            const confirmButton = new ButtonBuilder()
                .setCustomId('confirm_close')
                .setLabel('✅ Tak, zamknij')
                .setStyle(ButtonStyle.Danger);
            
            const cancelButton = new ButtonBuilder()
                .setCustomId('cancel_close')
                .setLabel('❌ Anuluj')
                .setStyle(ButtonStyle.Secondary);
            
            const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
            
            await interaction.reply({ embeds: [confirmEmbed], components: [row] });
        }
        
        if (interaction.customId === 'confirm_close') {
            await interaction.update({
                content: '🔒 Zamykanie ticketu za 5 sekund...',
                embeds: [],
                components: []
            });
            
            // Transcript
            try {
                const messages = await interaction.channel.messages.fetch({ limit: 100 });
                const transcript = messages.reverse().map(m => 
                    `[${m.createdAt.toLocaleString('pl-PL')}] ${m.author.tag}: ${m.content || '[Embed/Załącznik]'}`
                ).join('\n');
                
                const fileName = `transcript-${interaction.channel.name}-${Date.now()}.txt`;
                fs.writeFileSync(fileName, transcript);
                
                // Log
                const logChannel = interaction.guild.channels.cache.get(process.env.TICKET_LOG_CHANNEL_ID);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('🔒 Ticket Zamknięty')
                        .addFields(
                            { name: 'Kanał', value: interaction.channel.name, inline: true },
                            { name: 'Zamknięty przez', value: interaction.user.tag, inline: true }
                        )
                        .setTimestamp();
                    
                    await logChannel.send({ 
                        embeds: [logEmbed],
                        files: [{ attachment: fileName, name: fileName }]
                    });
                }
                
                fs.unlinkSync(fileName);
            } catch (error) {
                console.error('❌ Błąd tworzenia transkrypcji:', error.message);
            }
            
            // Usuń z cache
            for (const [userId, channelId] of activeTickets.entries()) {
                if (channelId === interaction.channel.id) {
                    activeTickets.delete(userId);
                    break;
                }
            }
            
            // Usuń kanał
            setTimeout(() => {
                interaction.channel.delete().catch(console.error);
            }, 5000);
        }
        
        if (interaction.customId === 'cancel_close') {
            await interaction.update({
                content: '✅ Zamykanie anulowane!',
                embeds: [],
                components: []
            });
        }
        
        if (interaction.commandName === 'ticket-panel') {
            const panelEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎫 System Ticketów')
                .setDescription(
                    '**Potrzebujesz pomocy?**\n\n' +
                    'Kliknij przycisk poniżej aby otworzyć ticket!\n' +
                    'Nasz team supportu odpowie tak szybko jak to możliwe! 💙\n\n' +
                    '**Dostępne kategorie:**\n' +
                    Object.values(TICKET_CATEGORIES).map(cat => 
                        `${cat.emoji} **${cat.name}** - ${cat.description}`
                    ).join('\n')
                )
                .setThumbnail(interaction.guild.iconURL())
                .setFooter({ text: 'Kliknij przycisk aby rozpocząć' })
                .setTimestamp();
            
            const ticketButton = new ButtonBuilder()
                .setCustomId('open_ticket_panel')
                .setLabel('🎫 Otwórz Ticket')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎫');
            
            const row = new ActionRowBuilder().addComponents(ticketButton);
            
            await interaction.channel.send({ embeds: [panelEmbed], components: [row] });
            await interaction.reply({ content: '✅ Panel ticketów utworzony!', ephemeral: true });
        }
        
        if (interaction.customId === 'open_ticket_panel') {
            // Taka sama logika jak /ticket
            const existingTicket = activeTickets.get(interaction.user.id);
            if (existingTicket) {
                return interaction.reply({
                    content: `❌ Masz już otwarty ticket: <#${existingTicket}>`,
                    ephemeral: true
                });
            }
            
            const ticketEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎫 Otwórz Ticket')
                .setDescription(
                    '**Wybierz kategorię swojego ticketu:**\n\n' +
                    Object.values(TICKET_CATEGORIES).map(cat => 
                        `${cat.emoji} **${cat.name}**\n${cat.description}`
                    ).join('\n\n')
                )
                .setFooter({ text: 'Wybierz kategorię z menu poniżej' })
                .setTimestamp();
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('ticket_category')
                .setPlaceholder('🎫 Wybierz kategorię ticketu')
                .addOptions(
                    Object.entries(TICKET_CATEGORIES).map(([key, cat]) => 
                        new StringSelectMenuOptionBuilder()
                            .setLabel(cat.name)
                            .setDescription(cat.description)
                            .setValue(key)
                            .setEmoji(cat.emoji)
                    )
                );
            
            const row = new ActionRowBuilder().addComponents(selectMenu);
            
            await interaction.reply({ embeds: [ticketEmbed], components: [row], ephemeral: true });
        }
        
        // 📊 LEVEL
        if (interaction.commandName === 'level') {
            const target = interaction.options.getUser('użytkownik') || interaction.user;
            const userData = userLevels[target.id] || { xp: 0, level: 0 };
            
            const nextLevelXP = getXpForLevel(userData.level + 1);
            const progress = ((userData.xp / nextLevelXP) * 100).toFixed(1);
            
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`📊 Poziom użytkownika ${target.tag}`)
                .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 512 }))
                .addFields(
                    { name: '🏆 Poziom', value: `**${userData.level}**`, inline: true },
                    { name: '⭐ XP', value: `**${userData.xp}** / ${Math.floor(nextLevelXP)}`, inline: true },
                    { name: '📈 Postęp', value: `**${progress}%**`, inline: true }
                )
                .setFooter({ text: 'Pisz na czacie aby zdobywać XP!' })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        }
        
        // 🏆 LEADERBOARD
        if (interaction.commandName === 'leaderboard') {
            const sorted = Object.entries(userLevels)
                .sort((a, b) => b[1].xp - a[1].xp)
                .slice(0, 10);
            
            let description = '';
            for (let i = 0; i < sorted.length; i++) {
                const [userId, data] = sorted[i];
                try {
                    const user = await client.users.fetch(userId);
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                    description += `${medal} **${user.tag}** - Level ${data.level} (${data.xp} XP)\n`;
                } catch {
                    // User not found, skip
                }
            }
            
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🏆 Leaderboard - Top 10')
                .setDescription(description || 'Brak danych')
                .setThumbnail(interaction.guild.iconURL())
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        }
        
        // 👤 AVATAR
        if (interaction.commandName === 'avatar') {
            const target = interaction.options.getUser('użytkownik') || interaction.user;
            
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`Avatar użytkownika ${target.tag}`)
                .setImage(target.displayAvatarURL({ dynamic: true, size: 4096 }))
                .setDescription(`[Pobierz w pełnej rozdzielczości](${target.displayAvatarURL({ dynamic: true, size: 4096 })})`)
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        }
        
        // 📊 SERVERINFO
        if (interaction.commandName === 'serverinfo') {
            const { guild } = interaction;
            
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`📊 Informacje o ${guild.name}`)
                .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
                .addFields(
                    { name: '👑 Właściciel', value: `<@${guild.ownerId}>`, inline: true },
                    { name: '👥 Członków', value: `**${guild.memberCount}**`, inline: true },
                    { name: '📅 Utworzony', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: '💬 Kanały', value: `**${guild.channels.cache.size}**`, inline: true },
                    { name: '🎭 Role', value: `**${guild.roles.cache.size}**`, inline: true },
                    { name: '😊 Emoji', value: `**${guild.emojis.cache.size}**`, inline: true },
                    { name: '📈 Poziom weryfikacji', value: `**${guild.verificationLevel}**`, inline: true },
                    { name: '🚀 Boosty', value: `**${guild.premiumSubscriptionCount || 0}** (Poziom ${guild.premiumTier})`, inline: true }
                )
                .setImage(guild.bannerURL({ size: 2048 }))
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        }
        
        // 👤 USERINFO
        if (interaction.commandName === 'userinfo') {
            const target = interaction.options.getUser('użytkownik') || interaction.user;
            const member = await interaction.guild.members.fetch(target.id);
            
            const roles = member.roles.cache
                .filter(role => role.id !== interaction.guild.id)
                .sort((a, b) => b.position - a.position)
                .map(role => role.toString())
                .slice(0, 10);
            
            const embed = new EmbedBuilder()
                .setColor(member.displayHexColor || '#5865F2')
                .setTitle(`👤 Informacje o ${target.tag}`)
                .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 512 }))
                .addFields(
                    { name: '🆔 ID', value: `\`${target.id}\``, inline: true },
                    { name: '📅 Utworzony', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: '📥 Dołączył', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                    { name: `🎭 Role [${member.roles.cache.size - 1}]`, value: roles.join(', ') || 'Brak ról', inline: false },
                    { name: '🏆 Poziom', value: `**${userLevels[target.id]?.level || 0}**`, inline: true },
                    { name: '⭐ XP', value: `**${userLevels[target.id]?.xp || 0}**`, inline: true }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        }
        
        // 🔨 CLEAR
        if (interaction.commandName === 'clear') {
            const amount = interaction.options.getInteger('ilość');
            
            if (amount < 1 || amount > 100) {
                return interaction.reply({ content: '❌ Podaj liczbę od 1 do 100!', ephemeral: true });
            }
            
            const messages = await interaction.channel.messages.fetch({ limit: amount });
            const deleted = await interaction.channel.bulkDelete(messages, true);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setDescription(`✅ Usunięto **${deleted.size}** wiadomości!`)
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
            
            // Log
            const logChannel = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('🗑️ Wyczyszczono wiadomości')
                    .addFields(
                        { name: 'Moderator', value: interaction.user.tag, inline: true },
                        { name: 'Kanał', value: `${interaction.channel}`, inline: true },
                        { name: 'Ilość', value: `${deleted.size}`, inline: true }
                    )
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed] });
            }
        }
        
        // 👢 KICK
        if (interaction.commandName === 'kick') {
            const target = interaction.options.getMember('użytkownik');
            const reason = interaction.options.getString('powód') || 'Brak powodu';
            
            if (!target) {
                return interaction.reply({ content: '❌ Nie znaleziono użytkownika!', ephemeral: true });
            }
            
            if (!target.kickable) {
                return interaction.reply({ content: '❌ Nie mogę wyrzucić tego użytkownika!', ephemeral: true });
            }
            
            await target.kick(reason);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('👢 Użytkownik wyrzucony')
                .addFields(
                    { name: 'Użytkownik', value: target.user.tag, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Powód', value: reason, inline: false }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
            const logChannel = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
            if (logChannel) {
                await logChannel.send({ embeds: [embed] });
            }
        }
        
        // 🔨 BAN
        if (interaction.commandName === 'ban') {
            const target = interaction.options.getMember('użytkownik');
            const reason = interaction.options.getString('powód') || 'Brak powodu';
            
            if (!target) {
                return interaction.reply({ content: '❌ Nie znaleziono użytkownika!', ephemeral: true });
            }
            
            if (!target.bannable) {
                return interaction.reply({ content: '❌ Nie mogę zbanować tego użytkownika!', ephemeral: true });
            }
            
            await target.ban({ reason });
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔨 Użytkownik zbanowany')
                .addFields(
                    { name: 'Użytkownik', value: target.user.tag, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Powód', value: reason, inline: false }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
            const logChannel = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
            if (logChannel) {
                await logChannel.send({ embeds: [embed] });
            }
        }
        
        // ⚠️ WARN
        if (interaction.commandName === 'warn') {
            const target = interaction.options.getUser('użytkownik');
            const reason = interaction.options.getString('powód');
            
            if (!warnings[target.id]) warnings[target.id] = [];
            warnings[target.id].push({
                reason,
                moderator: interaction.user.id,
                timestamp: Date.now()
            });
            saveWarnings();
            
            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⚠️ Ostrzeżenie')
                .setDescription(`${target} otrzymał ostrzeżenie!`)
                .addFields(
                    { name: 'Powód', value: reason, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Suma ostrzeżeń', value: `${warnings[target.id].length}`, inline: true }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
            // DM
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle(`⚠️ Otrzymałeś ostrzeżenie na ${interaction.guild.name}`)
                    .addFields(
                        { name: 'Powód', value: reason },
                        { name: 'Moderator', value: interaction.user.tag },
                        { name: 'Suma ostrzeżeń', value: `${warnings[target.id].length}` }
                    )
                    .setTimestamp();
                
                await target.send({ embeds: [dmEmbed] });
            } catch {
                // Nie można wysłać DM
            }
        }
        
        // 📝 WARNINGS
        if (interaction.commandName === 'warnings') {
            const target = interaction.options.getUser('użytkownik') || interaction.user;
            const userWarnings = warnings[target.id] || [];
            
            if (userWarnings.length === 0) {
                return interaction.reply({ content: `✅ ${target.tag} nie ma żadnych ostrzeżeń!`, ephemeral: true });
            }
            
            const description = userWarnings.map((w, i) => 
                `**${i + 1}.** ${w.reason}\n` +
                `Moderator: <@${w.moderator}> | <t:${Math.floor(w.timestamp / 1000)}:R>`
            ).join('\n\n');
            
            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle(`⚠️ Ostrzeżenia użytkownika ${target.tag}`)
                .setDescription(description.substring(0, 4000))
                .setFooter({ text: `Suma: ${userWarnings.length}` })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        // 💡 SUGGEST
        if (interaction.commandName === 'suggest') {
            const suggestion = interaction.options.getString('sugestia');
            
            const suggestChannel = interaction.guild.channels.cache.get(process.env.SUGGESTIONS_CHANNEL_ID);
            if (!suggestChannel) {
                return interaction.reply({ content: '❌ Kanał sugestii nie jest skonfigurowany!', ephemeral: true });
            }
            
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTitle('💡 Nowa Sugestia')
                .setDescription(suggestion)
                .setFooter({ text: `ID użytkownika: ${interaction.user.id}` })
                .setTimestamp();
            
            const msg = await suggestChannel.send({ embeds: [embed] });
            await msg.react('✅');
            await msg.react('❌');
            
            await interaction.reply({ content: '✅ Twoja sugestia została wysłana!', ephemeral: true });
        }
        
        // 🎲 ROLL
        if (interaction.commandName === 'roll') {
            const max = interaction.options.getInteger('maksimum') || 100;
            const result = Math.floor(Math.random() * max) + 1;
            
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🎲 Rzut kostką')
                .setDescription(`${interaction.user} wyrzucił **${result}** (1-${max})!`)
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        }
        
        // 🎱 8BALL
        if (interaction.commandName === '8ball') {
            const question = interaction.options.getString('pytanie');
            const answers = [
                'Tak', 'Nie', 'Może', 'Zdecydowanie tak', 'Zdecydowanie nie',
                'Nie jestem pewien', 'Pytaj mnie później', 'Absolutnie',
                'Nie ma szans', 'Wygląda dobrze', 'Nie wygląda dobrze',
                'Znaki wskazują na tak', 'Znaki wskazują na nie'
            ];
            
            const answer = answers[Math.floor(Math.random() * answers.length)];
            
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎱 Magiczna kula')
                .addFields(
                    { name: '❓ Pytanie', value: question },
                    { name: '💬 Odpowiedź', value: `**${answer}**` }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        }
        
        // 📊 STATS
        if (interaction.commandName === 'stats') {
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor(uptime / 3600) % 24;
            const minutes = Math.floor(uptime / 60) % 60;
            const seconds = Math.floor(uptime % 60);
            
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📊 Statystyki Bota')
                .setThumbnail(client.user.displayAvatarURL())
                .addFields(
                    { name: '⏰ Uptime', value: `${days}d ${hours}h ${minutes}m ${seconds}s`, inline: true },
                    { name: '🌐 Serwery', value: `${client.guilds.cache.size}`, inline: true },
                    { name: '👥 Użytkownicy', value: `${client.users.cache.size}`, inline: true },
                    { name: '💬 Kanały', value: `${client.channels.cache.size}`, inline: true },
                    { name: '🏓 Ping', value: `${client.ws.ping}ms`, inline: true },
                    { name: '💾 Pamięć', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true }
                )
                .setFooter({ text: `Discord.js v${require('discord.js').version} | Node.js ${process.version}` })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        }
        
        // ℹ️ HELP
        if (interaction.commandName === 'help') {
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📚 Lista Komend')
                .setDescription('Oto wszystkie dostępne komendy!')
                .addFields(
                    {
                        name: '✅ Weryfikacja',
                        value: '`/verify` - Zweryfikuj swoje konto',
                        inline: false
                    },
                    {
                        name: '🎫 Tickety',
                        value: '`/ticket` - Otwórz ticket\n`/ticket-panel` - Utwórz panel (Admin)',
                        inline: false
                    },
                    {
                        name: '📊 Poziomy',
                        value: '`/level` - Sprawdź poziom\n`/leaderboard` - Top 10 użytkowników',
                        inline: false
                    },
                    {
                        name: '👤 Informacje',
                        value: '`/avatar` - Avatar użytkownika\n`/userinfo` - Info o użytkowniku\n`/serverinfo` - Info o serwerze',
                        inline: false
                    },
                    {
                        name: '🔨 Moderacja (Admin)',
                        value: '`/clear` - Usuń wiadomości\n`/kick` - Wyrzuć użytkownika\n`/ban` - Zbanuj użytkownika\n`/warn` - Ostrzeż użytkownika\n`/warnings` - Lista ostrzeżeń',
                        inline: false
                    },
                    {
                        name: '🎮 Fun',
                        value: '`/roll` - Rzut kostką\n`/8ball` - Magiczna kula\n`/suggest` - Zgłoś sugestię',
                        inline: false
                    },
                    {
                        name: '📊 Inne',
                        value: '`/stats` - Statystyki bota\n`/help` - Ta wiadomość',
                        inline: false
                    }
                )
                .setFooter({ text: 'Ultimate Discord Bot 💙' })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
    } catch (error) {
        console.error('❌ Błąd w interakcji:', error.message);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
                content: '❌ Wystąpił błąd podczas wykonywania komendy!', 
                ephemeral: true 
            }).catch(() => {});
        }
    }
});

// ═══════════════════════════════════════════════════════════
// 📋 REJESTRACJA KOMEND (Z FORCE REFRESH!)
// ═══════════════════════════════════════════════════════════

async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        console.log('🗑️ Usuwam stare komendy...');
        
        // WYCZYŚĆ STARE KOMENDY (Guild)
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: [] }
        );
        
        // WYCZYŚĆ STARE KOMENDY (Global) 
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [] }
        );
        
        console.log('✅ Stare komendy usunięte!');
        
        // POCZEKAJ CHWILĘ
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🔄 Rejestrowanie nowych komend...');
        
        const commands = [
            // Weryfikacja
            {
                name: 'verify',
                description: 'Zweryfikuj swoje konto na serwerze'
            },
            
            // Tickety
            {
                name: 'ticket',
                description: 'Otwórz nowy ticket supportowy'
            },
            {
                name: 'ticket-panel',
                description: 'Utwórz panel ticketów (tylko admin)',
                default_member_permissions: PermissionFlagsBits.Administrator.toString()
            },
            
            // Poziomy
            {
                name: 'level',
                description: 'Sprawdź poziom użytkownika',
                options: [
                    {
                        name: 'użytkownik',
                        description: 'Wybierz użytkownika',
                        type: 6,
                        required: false
                    }
                ]
            },
            {
                name: 'leaderboard',
                description: 'Zobacz ranking najlepszych użytkowników'
            },
            
            // Info
            {
                name: 'avatar',
                description: 'Pokaż avatar użytkownika',
                options: [
                    {
                        name: 'użytkownik',
                        description: 'Wybierz użytkownika',
                        type: 6,
                        required: false
                    }
                ]
            },
            {
                name: 'userinfo',
                description: 'Pokaż informacje o użytkowniku',
                options: [
                    {
                        name: 'użytkownik',
                        description: 'Wybierz użytkownika',
                        type: 6,
                        required: false
                    }
                ]
            },
            {
                name: 'serverinfo',
                description: 'Pokaż informacje o serwerze'
            },
            
            // Moderacja
            {
                name: 'clear',
                description: 'Usuń określoną liczbę wiadomości',
                default_member_permissions: PermissionFlagsBits.ManageMessages.toString(),
                options: [
                    {
                        name: 'ilość',
                        description: 'Liczba wiadomości do usunięcia (1-100)',
                        type: 4,
                        required: true,
                        min_value: 1,
                        max_value: 100
                    }
                ]
            },
            {
                name: 'kick',
                description: 'Wyrzuć użytkownika z serwera',
                default_member_permissions: PermissionFlagsBits.KickMembers.toString(),
                options: [
                    {
                        name: 'użytkownik',
                        description: 'Wybierz użytkownika',
                        type: 6,
                        required: true
                    },
                    {
                        name: 'powód',
                        description: 'Powód wyrzucenia',
                        type: 3,
                        required: false
                    }
                ]
            },
            {
                name: 'ban',
                description: 'Zbanuj użytkownika',
                default_member_permissions: PermissionFlagsBits.BanMembers.toString(),
                options: [
                    {
                        name: 'użytkownik',
                        description: 'Wybierz użytkownika',
                        type: 6,
                        required: true
                    },
                    {
                        name: 'powód',
                        description: 'Powód bana',
                        type: 3,
                        required: false
                    }
                ]
            },
            {
                name: 'warn',
                description: 'Ostrzeż użytkownika',
                default_member_permissions: PermissionFlagsBits.ModerateMembers.toString(),
                options: [
                    {
                        name: 'użytkownik',
                        description: 'Wybierz użytkownika',
                        type: 6,
                        required: true
                    },
                    {
                        name: 'powód',
                        description: 'Powód ostrzeżenia',
                        type: 3,
                        required: true
                    }
                ]
            },
            {
                name: 'warnings',
                description: 'Zobacz ostrzeżenia użytkownika',
                options: [
                    {
                        name: 'użytkownik',
                        description: 'Wybierz użytkownika',
                        type: 6,
                        required: false
                    }
                ]
            },
            
            // Fun
            {
                name: 'suggest',
                description: 'Zgłoś sugestię',
                options: [
                    {
                        name: 'sugestia',
                        description: 'Twoja sugestia',
                        type: 3,
                        required: true,
                        max_length: 1000
                    }
                ]
            },
            {
                name: 'roll',
                description: 'Rzuć kostką',
                options: [
                    {
                        name: 'maksimum',
                        description: 'Maksymalna wartość (domyślnie 100)',
                        type: 4,
                        required: false,
                        min_value: 1,
                        max_value: 1000000
                    }
                ]
            },
            {
                name: '8ball',
                description: 'Zapytaj magiczną kulę',
                options: [
                    {
                        name: 'pytanie',
                        description: 'Twoje pytanie',
                        type: 3,
                        required: true
                    }
                ]
            },
            
            // Inne
            {
                name: 'stats',
                description: 'Zobacz statystyki bota'
            },
            {
                name: 'help',
                description: 'Lista wszystkich komend'
            }
        ];
        
        // ZAREJESTRUJ NOWE KOMENDY (GUILD - szybkie)
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        
        console.log('✅ Komendy zarejestrowane pomyślnie!');
        console.log(`📊 Zarejestrowano ${commands.length} komend`);
        
    } catch (error) {
        console.error('❌ Błąd rejestracji komend:', error);
    }
}

// ═══════════════════════════════════════════════════════════
// 🚀 LOGOWANIE BOTA
// ═══════════════════════════════════════════════════════════

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Błąd logowania bota:', error);
});

// Error handlers
process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('❌ Uncaught exception:', error);
});
