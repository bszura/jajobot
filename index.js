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
    StringSelectMenuOptionBuilder
} = require('discord.js');
const fs = require('fs');

// ═══════════════════════════════════════════════════════════
// 🌐 EXPRESS SERVER
// ═══════════════════════════════════════════════════════════

const app = express();
const PORT = process.env.PORT || 3000;

let botStatus = 'Starting...';

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
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 Ultimate Discord Bot</h1>
                <p>${botStatus}</p>
                <div class="status">✅ ONLINE</div>
                
                <div class="stats">
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
            </div>
        </body>
        </html>
    `);
});

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        bot: client.user?.tag || 'Not ready',
        guilds: client.guilds?.cache.size || 0,
        uptime: process.uptime()
    });
});

app.listen(PORT, () => {
    console.log(`🌐 Express server running on port ${PORT}`);
});

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
        GatewayIntentBits.GuildMessageReactions
    ]
});

// ═══════════════════════════════════════════════════════════
// 💾 BAZA DANYCH (JSON)
// ═══════════════════════════════════════════════════════════

const invites = new Map();
const activeTickets = new Map();
let userLevels = {};
let warnings = {};

if (fs.existsSync('levels.json')) {
    try {
        userLevels = JSON.parse(fs.readFileSync('levels.json'));
    } catch (e) {
        userLevels = {};
    }
}

if (fs.existsSync('warnings.json')) {
    try {
        warnings = JSON.parse(fs.readFileSync('warnings.json'));
    } catch (e) {
        warnings = {};
    }
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
    try {
        const firstInvites = await guild.invites.fetch();
        invites.set(guild.id, new Map(firstInvites.map((invite) => [invite.code, invite.uses])));
    } catch (error) {
        console.error(`Błąd ładowania zaproszeń:`, error.message);
    }
}

function getLevel(xp) {
    return Math.floor(0.1 * Math.sqrt(xp));
}

function getXpForLevel(level) {
    return Math.pow(level / 0.1, 2);
}

function addXP(userId) {
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
        console.error('Błąd aktualizacji licznika:', error.message);
    }
}

// ═══════════════════════════════════════════════════════════
// 🤖 BOT READY
// ═══════════════════════════════════════════════════════════

client.once('ready', async () => {
    botStatus = `Bot online jako ${client.user.tag}`;
    
    console.log(`
╔═══════════════════════════════════════╗
║   🤖 BOT ONLINE!                      ║
║   👤 ${client.user.tag.padEnd(29)} ║
║   🌟 ULTIMATE EDITION                 ║
╚═══════════════════════════════════════╝
    `);
    
    client.user.setActivity('🎮 /help | Ultimate Bot', { type: 3 });
    
    for (const guild of client.guilds.cache.values()) {
        await loadInvites(guild);
        await updateMemberCount(guild);
    }
    
    // Rejestruj komendy TYLKO jeśli mamy CLIENT_ID i GUILD_ID
    if (process.env.CLIENT_ID && process.env.GUILD_ID) {
        await registerCommands();
    } else {
        console.log('⚠️ CLIENT_ID lub GUILD_ID brak - pomijam rejestrację komend');
    }
    
    console.log('✅ Wszystkie systemy działają!');
    console.log(`📊 Serwery: ${client.guilds.cache.size}`);
    console.log(`👥 Użytkownicy: ${client.users.cache.size}`);
});

// ═══════════════════════════════════════════════════════════
// 👋 SYSTEM POWITALNY
// ═══════════════════════════════════════════════════════════

client.on('guildMemberAdd', async (member) => {
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
        
        const lobbyChannel = member.guild.channels.cache.get(process.env.LOBBY_CHANNEL_ID);
        
        if (lobbyChannel) {
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🎉 Witamy na serwerze!')
                .setDescription(`Hej ${member}! Miło Cię widzieć! 👋\n\n**Jesteś naszym ${member.guild.memberCount}. członkiem!**`)
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
                        value: '• Użyj `/verify` aby się zweryfikować\n• Przeczytaj regulamin\n• Miłej zabawy!'
                    }
                )
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() });
            
            await lobbyChannel.send({ content: `${member}`, embeds: [welcomeEmbed] });
        }
        
        await updateMemberCount(member.guild);
    } catch (error) {
        console.error('Błąd w guildMemberAdd:', error.message);
    }
});

client.on('guildMemberRemove', async (member) => {
    try {
        const lobbyChannel = member.guild.channels.cache.get(process.env.LOBBY_CHANNEL_ID);
        if (lobbyChannel) {
            await lobbyChannel.send(`👋 **${member.user.tag}** opuścił serwer...`);
        }
        await updateMemberCount(member.guild);
    } catch (error) {
        console.error('Błąd w guildMemberRemove:', error.message);
    }
});

// ═══════════════════════════════════════════════════════════
// 📝 SYSTEM POZIOMÓW
// ═══════════════════════════════════════════════════════════

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;
    
    try {
        const newLevel = addXP(message.author.id);
        
        if (newLevel && process.env.LEVEL_UP_CHANNEL_ID) {
            const levelUpEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🎉 LEVEL UP!')
                .setDescription(`${message.author} awansował na poziom **${newLevel}**!`)
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
            
            const levelChannel = message.guild.channels.cache.get(process.env.LEVEL_UP_CHANNEL_ID) || message.channel;
            await levelChannel.send({ embeds: [levelUpEmbed] });
        }
        
        // Auto-reakcje
        const content = message.content.toLowerCase();
        if (content.includes('bot')) await message.react('🤖').catch(() => {});
        if (content.includes('❤️')) await message.react('❤️').catch(() => {});
        if (content.includes('cześć') || content.includes('hej')) await message.react('👋').catch(() => {});
    } catch (error) {
        console.error('Błąd w messageCreate:', error.message);
    }
});

// ═══════════════════════════════════════════════════════════
// 📨 INVITES
// ═══════════════════════════════════════════════════════════

client.on('inviteCreate', async (invite) => {
    try {
        const cachedInvites = invites.get(invite.guild.id);
        if (cachedInvites) {
            cachedInvites.set(invite.code, invite.uses);
        }
    } catch (error) {
        console.error('Błąd inviteCreate:', error.message);
    }
});

client.on('inviteDelete', async (invite) => {
    try {
        const cachedInvites = invites.get(invite.guild.id);
        if (cachedInvites) {
            cachedInvites.delete(invite.code);
        }
    } catch (error) {
        console.error('Błąd inviteDelete:', error.message);
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
            if (!process.env.VERIFIED_ROLE_ID) {
                return interaction.reply({ content: '❌ Rola weryfikacji nie jest skonfigurowana!', ephemeral: true });
            }
            
            const member = interaction.member;
            
            if (member.roles.cache.has(process.env.VERIFIED_ROLE_ID)) {
                return interaction.reply({ content: '✅ Jesteś już zweryfikowany!', ephemeral: true });
            }
            
            const verifyEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🔐 Weryfikacja konta')
                .setDescription('**Kliknij przycisk poniżej aby zweryfikować swoje konto!**\n\n✨ Po weryfikacji otrzymasz pełny dostęp do serwera')
                .setTimestamp();
            
            const verifyButton = new ButtonBuilder()
                .setCustomId('verify_button')
                .setLabel('✅ Zweryfikuj się')
                .setStyle(ButtonStyle.Success);
            
            const row = new ActionRowBuilder().addComponents(verifyButton);
            
            await interaction.reply({ embeds: [verifyEmbed], components: [row], ephemeral: true });
        }
        
        if (interaction.customId === 'verify_button') {
            const verifiedRole = interaction.guild.roles.cache.get(process.env.VERIFIED_ROLE_ID);
            
            if (!verifiedRole) {
                return interaction.reply({ content: '❌ Rola weryfikacji nie istnieje!', ephemeral: true });
            }
            
            await interaction.member.roles.add(verifiedRole);
            
            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Weryfikacja zakończona!')
                .setDescription(`**Gratulacje ${interaction.user}!**\n\n✅ Zostałeś zweryfikowany\n🎉 Witamy oficjalnie!`)
                .setTimestamp();
            
            await interaction.update({ embeds: [successEmbed], components: [] });
            
            const lobbyChannel = interaction.guild.channels.cache.get(process.env.LOBBY_CHANNEL_ID);
            if (lobbyChannel) {
                await lobbyChannel.send(`🎊 **${interaction.user.tag}** został zweryfikowany!`);
            }
        }
        
        // 🎫 TICKET
        if (interaction.commandName === 'ticket') {
            const existingTicket = activeTickets.get(interaction.user.id);
            if (existingTicket) {
                return interaction.reply({ content: `❌ Masz już otwarty ticket: <#${existingTicket}>`, ephemeral: true });
            }
            
            const ticketEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎫 Otwórz Ticket')
                .setDescription('**Wybierz kategorię:**\n\n' + Object.values(TICKET_CATEGORIES).map(cat => `${cat.emoji} **${cat.name}**\n${cat.description}`).join('\n\n'))
                .setTimestamp();
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('ticket_category')
                .setPlaceholder('🎫 Wybierz kategorię')
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
                name: `ticket-${interaction.user.username}`.toLowerCase(),
                type: ChannelType.GuildText,
                parent: process.env.TICKET_CATEGORY_ID || null,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                ]
            });
            
            activeTickets.set(interaction.user.id, ticketChannel.id);
            
            const ticketEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`${categoryData.emoji} ${categoryData.name}`)
                .setDescription(`**Witaj ${interaction.user}!**\n\nOpisz swój problem, a wkrótce Ci pomożemy!`)
                .setTimestamp();
            
            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('🔒 Zamknij')
                .setStyle(ButtonStyle.Danger);
            
            const row = new ActionRowBuilder().addComponents(closeButton);
            
            await ticketChannel.send({ content: `${interaction.user}`, embeds: [ticketEmbed], components: [row] });
            await interaction.editReply({ content: `✅ Ticket utworzony: ${ticketChannel}` });
        }
        
        if (interaction.customId === 'close_ticket') {
            await interaction.reply('🔒 Zamykanie ticketu za 5 sekund...');
            
            for (const [userId, channelId] of activeTickets.entries()) {
                if (channelId === interaction.channel.id) {
                    activeTickets.delete(userId);
                    break;
                }
            }
            
            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
            }, 5000);
        }
        
        // 📊 LEVEL
        if (interaction.commandName === 'level') {
            const target = interaction.options.getUser('użytkownik') || interaction.user;
            const userData = userLevels[target.id] || { xp: 0, level: 0 };
            
            const nextLevelXP = getXpForLevel(userData.level + 1);
            const progress = ((userData.xp / nextLevelXP) * 100).toFixed(1);
            
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`📊 Poziom ${target.tag}`)
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '🏆 Poziom', value: `**${userData.level}**`, inline: true },
                    { name: '⭐ XP', value: `**${userData.xp}** / ${Math.floor(nextLevelXP)}`, inline: true },
                    { name: '📈 Postęp', value: `**${progress}%**`, inline: true }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        }
        
        // 🏆 LEADERBOARD
        if (interaction.commandName === 'leaderboard') {
            const sorted = Object.entries(userLevels).sort((a, b) => b[1].xp - a[1].xp).slice(0, 10);
            
            let description = '';
            for (let i = 0; i < sorted.length; i++) {
                const [userId, data] = sorted[i];
                const user = await client.users.fetch(userId).catch(() => null);
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                description += `${medal} **${user?.tag || 'Nieznany'}** - Level ${data.level} (${data.xp} XP)\n`;
            }
            
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🏆 Leaderboard - Top 10')
                .setDescription(description || 'Brak danych')
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        }
        
        // 👤 AVATAR
        if (interaction.commandName === 'avatar') {
            const target = interaction.options.getUser('użytkownik') || interaction.user;
            
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`Avatar ${target.tag}`)
                .setImage(target.displayAvatarURL({ dynamic: true, size: 4096 }))
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        }
        
        // 📊 SERVERINFO
        if (interaction.commandName === 'serverinfo') {
            const { guild } = interaction;
            
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`📊 ${guild.name}`)
                .setThumbnail(guild.iconURL())
                .addFields(
                    { name: '👑 Właściciel', value: `<@${guild.ownerId}>`, inline: true },
                    { name: '👥 Członków', value: `**${guild.memberCount}**`, inline: true },
                    { name: '📅 Utworzony', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
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
            const answers = ['Tak', 'Nie', 'Może', 'Zdecydowanie tak', 'Zdecydowanie nie', 'Nie jestem pewien'];
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
        
        // ℹ️ HELP
        if (interaction.commandName === 'help') {
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📚 Lista Komend')
                .addFields(
                    { name: '✅ Weryfikacja', value: '`/verify` - Zweryfikuj się' },
                    { name: '🎫 Tickety', value: '`/ticket` - Otwórz ticket' },
                    { name: '📊 Poziomy', value: '`/level` - Sprawdź poziom\n`/leaderboard` - Top 10' },
                    { name: '👤 Info', value: '`/avatar` - Avatar\n`/serverinfo` - Info o serwerze' },
                    { name: '🎮 Fun', value: '`/roll` - Rzut kostką\n`/8ball` - Magiczna kula' }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
    } catch (error) {
        console.error('Błąd w interakcji:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Wystąpił błąd!', ephemeral: true }).catch(() => {});
        }
    }
});

// ═══════════════════════════════════════════════════════════
// 📋 REJESTRACJA KOMEND
// ═══════════════════════════════════════════════════════════

async function registerCommands() {
    const commands = [
        { name: 'verify', description: 'Zweryfikuj swoje konto' },
        { name: 'ticket', description: 'Otwórz ticket supportowy' },
        { 
            name: 'level', 
            description: 'Sprawdź poziom',
            options: [{ name: 'użytkownik', description: 'Użytkownik', type: 6, required: false }]
        },
        { name: 'leaderboard', description: 'Top 10 użytkowników' },
        { 
            name: 'avatar', 
            description: 'Pokaż avatar',
            options: [{ name: 'użytkownik', description: 'Użytkownik', type: 6, required: false }]
        },
        { name: 'serverinfo', description: 'Info o serwerze' },
        { 
            name: 'roll', 
            description: 'Rzut kostką',
            options: [{ name: 'maksimum', description: 'Max wartość', type: 4, required: false }]
        },
        { 
            name: '8ball', 
            description: 'Magiczna kula',
            options: [{ name: 'pytanie', description: 'Pytanie', type: 3, required: true }]
        },
        { name: 'help', description: 'Lista komend' }
    ];
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        console.log('🔄 Rejestrowanie komend...');
        
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        
        console.log(`✅ Zarejestrowano ${commands.length} komend!`);
    } catch (error) {
        console.error('❌ Błąd rejestracji komend:', error.message);
    }
}

// ═══════════════════════════════════════════════════════════
// 🚀 LOGIN
// ═══════════════════════════════════════════════════════════

console.log('⚡ Logging in...');
client.login(process.env.DISCORD_TOKEN);
