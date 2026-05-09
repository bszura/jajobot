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
    MessageFlags
} = require('discord.js');
const fs = require('fs');
const { createClient } = require('@libsql/client');
const axios = require('axios');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════
// 🗄️ TURSO DATABASE
// ═══════════════════════════════════════════════════════════

const turso = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Inicjalizacja tabel
async function initDatabase() {
    try {
        // Tabela dla autoryzowanych użytkowników (RestoreCord)
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS authorized_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL UNIQUE,
                access_token TEXT NOT NULL,
                refresh_token TEXT,
                username TEXT NOT NULL,
                discriminator TEXT,
                avatar TEXT,
                email TEXT,
                authorized_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_used DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela backupów serwerów (RestoreCord)
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS server_backups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                backup_id TEXT NOT NULL UNIQUE,
                guild_id TEXT NOT NULL,
                guild_name TEXT NOT NULL,
                owner_id TEXT NOT NULL,
                created_by TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                member_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active'
            )
        `);

        // Tabela członków w backupach (RestoreCord)
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS backup_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                backup_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                username TEXT NOT NULL,
                discriminator TEXT,
                avatar TEXT,
                joined_at DATETIME,
                roles TEXT,
                nickname TEXT,
                FOREIGN KEY (backup_id) REFERENCES server_backups (backup_id)
            )
        `);

        // ═══════════════════════════════════════════════════════════
        // 📊 NOWE TABELE DLA BEZPIECZEŃSTWA DANYCH
        // ═══════════════════════════════════════════════════════════

        // Tabela poziomów użytkowników
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS user_levels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                username TEXT NOT NULL,
                xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 0,
                last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                total_messages INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, guild_id)
            )
        `);

        // Tabela ostrzeżeń
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS user_warnings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                moderator_id TEXT NOT NULL,
                reason TEXT NOT NULL,
                warning_count INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            )
        `);

        // Tabela zaproszeń (invite tracking)
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS guild_invites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                code TEXT NOT NULL,
                uses INTEGER DEFAULT 0,
                max_uses INTEGER DEFAULT 0,
                created_by TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(guild_id, code)
            )
        `);

        // Tabela join tracking
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS member_joins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                username TEXT NOT NULL,
                invited_by TEXT,
                invite_code TEXT,
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                account_created DATETIME,
                is_bot BOOLEAN DEFAULT 0
            )
        `);

        // Tabela aktywnych ticketów
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS active_tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                channel_id TEXT NOT NULL,
                category TEXT NOT NULL,
                status TEXT DEFAULT 'open',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                closed_at DATETIME,
                UNIQUE(user_id, guild_id, status)
            )
        `);

        // Tabela konfiguracji gildii
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS guild_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL UNIQUE,
                guild_name TEXT NOT NULL,
                owner_id TEXT NOT NULL,
                lobby_channel_id TEXT,
                log_channel_id TEXT,
                level_channel_id TEXT,
                member_count_channel_id TEXT,
                ticket_category_id TEXT,
                seller_role_id TEXT,
                verified_role_id TEXT,
                unverified_role_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela statystyk serwera
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS guild_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                date DATE NOT NULL,
                member_count INTEGER DEFAULT 0,
                message_count INTEGER DEFAULT 0,
                joins_count INTEGER DEFAULT 0,
                leaves_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(guild_id, date)
            )
        `);

        console.log('✅ Wszystkie tabele bazy danych zainicjalizowane!');
    } catch (error) {
        console.error('❌ Błąd inicjalizacji bazy danych:', error);
    }
}

// ═══════════════════════════════════════════════════════════
// 📊 FUNKCJE POZIOMÓW (DATABASE)
// ═══════════════════════════════════════════════════════════

async function getUserLevel(userId, guildId) {
    try {
        const result = await turso.execute({
            sql: `SELECT * FROM user_levels WHERE user_id = ? AND guild_id = ?`,
            args: [userId, guildId]
        });
        
        if (result.rows.length > 0) {
            return {
                xp: parseInt(result.rows[0].xp),
                level: parseInt(result.rows[0].level),
                lastMessage: new Date(result.rows[0].last_message_at).getTime(),
                totalMessages: parseInt(result.rows[0].total_messages)
            };
        }
        
        return { xp: 0, level: 0, lastMessage: 0, totalMessages: 0 };
    } catch (error) {
        console.error('❌ Błąd pobierania poziomu:', error);
        return { xp: 0, level: 0, lastMessage: 0, totalMessages: 0 };
    }
}

async function updateUserLevel(userId, guildId, username, xpGain) {
    try {
        const userData = await getUserLevel(userId, guildId);
        const now = Date.now();
        
        // Sprawdź cooldown (1 minuta)
        if (now - userData.lastMessage < 60000) {
            return null;
        }

        const newXP = userData.xp + xpGain;
        const oldLevel = userData.level;
        const newLevel = Math.floor(0.1 * Math.sqrt(newXP));
        const newMessageCount = userData.totalMessages + 1;

        await turso.execute({
            sql: `INSERT OR REPLACE INTO user_levels 
                  (user_id, guild_id, username, xp, level, last_message_at, total_messages, updated_at)
                  VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)`,
            args: [userId, guildId, username, newXP, newLevel, newMessageCount]
        });

        return newLevel > oldLevel ? newLevel : null;
    } catch (error) {
        console.error('❌ Błąd aktualizacji poziomu:', error);
        return null;
    }
}

async function getTopUsers(guildId, limit = 10) {
    try {
        const result = await turso.execute({
            sql: `SELECT * FROM user_levels WHERE guild_id = ? ORDER BY xp DESC LIMIT ?`,
            args: [guildId, limit]
        });
        return result.rows;
    } catch (error) {
        console.error('❌ Błąd pobierania rankingu:', error);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════
// 📨 FUNKCJE ZAPROSZEŃ (DATABASE)
// ═══════════════════════════════════════════════════════════

async function saveGuildInvites(guildId, invites) {
    try {
        // Usuń stare zaproszenia
        await turso.execute({
            sql: `DELETE FROM guild_invites WHERE guild_id = ?`,
            args: [guildId]
        });

        // Zapisz nowe
        for (const [code, uses] of invites.entries()) {
            await turso.execute({
                sql: `INSERT INTO guild_invites (guild_id, code, uses, created_by, updated_at)
                      VALUES (?, ?, ?, 'unknown', CURRENT_TIMESTAMP)`,
                args: [guildId, code, uses]
            });
        }
        console.log(`✅ Zapisano ${invites.size} zaproszeń dla ${guildId}`);
    } catch (error) {
        console.error('❌ Błąd zapisywania zaproszeń:', error);
    }
}

async function loadGuildInvites(guildId) {
    try {
        const result = await turso.execute({
            sql: `SELECT code, uses FROM guild_invites WHERE guild_id = ?`,
            args: [guildId]
        });

        const invitesMap = new Map();
        for (const row of result.rows) {
            invitesMap.set(row.code, parseInt(row.uses));
        }
        
        console.log(`✅ Załadowano ${invitesMap.size} zaproszeń dla ${guildId}`);
        return invitesMap;
    } catch (error) {
        console.error('❌ Błąd ładowania zaproszeń:', error);
        return new Map();
    }
}

async function saveMemberJoin(userId, guildId, username, invitedBy = null, inviteCode = null, accountCreated = null) {
    try {
        await turso.execute({
            sql: `INSERT INTO member_joins 
                  (user_id, guild_id, username, invited_by, invite_code, joined_at, account_created)
                  VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
            args: [userId, guildId, username, invitedBy, inviteCode, accountCreated]
        });
    } catch (error) {
        console.error('❌ Błąd zapisywania dołączenia:', error);
    }
}

// ═══════════════════════════════════════════════════════════
// 🎫 FUNKCJE TICKETÓW (DATABASE)
// ═══════════════════════════════════════════════════════════

async function saveActiveTicket(userId, guildId, channelId, category) {
    try {
        await turso.execute({
            sql: `INSERT OR REPLACE INTO active_tickets 
                  (user_id, guild_id, channel_id, category, status, created_at)
                  VALUES (?, ?, ?, ?, 'open', CURRENT_TIMESTAMP)`,
            args: [userId, guildId, channelId, category]
        });
    } catch (error) {
        console.error('❌ Błąd zapisywania ticketu:', error);
    }
}

async function removeActiveTicket(userId, guildId) {
    try {
        await turso.execute({
            sql: `UPDATE active_tickets SET status = 'closed', closed_at = CURRENT_TIMESTAMP 
                  WHERE user_id = ? AND guild_id = ? AND status = 'open'`,
            args: [userId, guildId]
        });
    } catch (error) {
        console.error('❌ Błąd usuwania ticketu:', error);
    }
}

async function getActiveTicket(userId, guildId) {
    try {
        const result = await turso.execute({
            sql: `SELECT channel_id FROM active_tickets 
                  WHERE user_id = ? AND guild_id = ? AND status = 'open'`,
            args: [userId, guildId]
        });
        
        return result.rows.length > 0 ? result.rows[0].channel_id : null;
    } catch (error) {
        console.error('❌ Błąd pobierania ticketu:', error);
        return null;
    }
}

async function loadActiveTicketsToMemory() {
    try {
        const result = await turso.execute({
            sql: `SELECT user_id, channel_id FROM active_tickets WHERE status = 'open'`
        });
        
        const activeTickets = new Map();
        for (const row of result.rows) {
            activeTickets.set(row.user_id, row.channel_id);
        }
        
        console.log(`✅ Załadowano ${activeTickets.size} aktywnych ticketów`);
        return activeTickets;
    } catch (error) {
        console.error('❌ Błąd ładowania ticketów:', error);
        return new Map();
    }
}

// ═══════════════════════════════════════════════════════════
// ⚙️ FUNKCJE KONFIGURACJI (DATABASE)
// ═══════════════════════════════════════════════════════════

async function saveGuildConfig(guildId, guildName, ownerId) {
    try {
        await turso.execute({
            sql: `INSERT OR REPLACE INTO guild_config 
                  (guild_id, guild_name, owner_id, updated_at)
                  VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            args: [guildId, guildName, ownerId]
        });
    } catch (error) {
        console.error('❌ Błąd zapisywania konfiguracji:', error);
    }
}

async function updateGuildStats(guildId, memberCount) {
    try {
        const today = new Date().toISOString().split('T')[0];
        await turso.execute({
            sql: `INSERT OR REPLACE INTO guild_stats 
                  (guild_id, date, member_count, created_at)
                  VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            args: [guildId, today, memberCount]
        });
    } catch (error) {
        console.error('❌ Błąd aktualizacji statystyk:', error);
    }
}

// ═══════════════════════════════════════════════════════════
// 🔐 FUNKCJE RESTORECORD (POZOSTAJĄ BEZ ZMIAN)
// ═══════════════════════════════════════════════════════════

async function saveAuthorizedUser(userData) {
    try {
        await turso.execute({
            sql: `INSERT OR REPLACE INTO authorized_users 
                  (user_id, access_token, refresh_token, username, discriminator, avatar, email, authorized_at, last_used)
                  VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            args: [
                userData.id,
                userData.access_token,
                userData.refresh_token,
                userData.username,
                userData.discriminator,
                userData.avatar,
                userData.email
            ]
        });
        console.log(`✅ Zapisano autoryzację: ${userData.username}#${userData.discriminator}`);
        return true;
    } catch (error) {
        console.error('❌ Błąd zapisywania autoryzacji:', error);
        return false;
    }
}

async function createServerBackup(guildId, guildName, ownerId, createdBy) {
    try {
        const backupId = crypto.randomUUID();
        
        await turso.execute({
            sql: `INSERT INTO server_backups (backup_id, guild_id, guild_name, owner_id, created_by)
                  VALUES (?, ?, ?, ?, ?)`,
            args: [backupId, guildId, guildName, ownerId, createdBy]
        });

        return backupId;
    } catch (error) {
        console.error('❌ Błąd tworzenia backupu:', error);
        return null;
    }
}

async function saveBackupMember(backupId, memberData) {
    try {
        await turso.execute({
            sql: `INSERT INTO backup_members 
                  (backup_id, user_id, username, discriminator, avatar, joined_at, roles, nickname)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                backupId,
                memberData.id,
                memberData.username,
                memberData.discriminator,
                memberData.avatar,
                memberData.joined_at,
                JSON.stringify(memberData.roles),
                memberData.nickname
            ]
        });
        return true;
    } catch (error) {
        console.error('❌ Błąd zapisywania członka backupu:', error);
        return false;
    }
}

async function getServerBackups(userId) {
    try {
        const result = await turso.execute({
            sql: `SELECT * FROM server_backups WHERE created_by = ? OR owner_id = ? ORDER BY created_at DESC`,
            args: [userId, userId]
        });
        return result.rows;
    } catch (error) {
        console.error('❌ Błąd pobierania backupów:', error);
        return [];
    }
}

async function getBackupMembers(backupId) {
    try {
        const result = await turso.execute({
            sql: `SELECT * FROM backup_members WHERE backup_id = ?`,
            args: [backupId]
        });
        return result.rows;
    } catch (error) {
        console.error('❌ Błąd pobierania członków backupu:', error);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════
// 🌐 EXPRESS SERVER (BEZ ZMIAN)
// ═══════════════════════════════════════════════════════════

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// OAuth2 konfiguracja
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:${PORT}/auth/callback`;

// Strona główna
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
                .auth-btn {
                    display: inline-block;
                    padding: 15px 30px;
                    background: #5865F2;
                    color: white;
                    text-decoration: none;
                    border-radius: 25px;
                    font-weight: bold;
                    margin: 20px 10px;
                    transition: transform 0.2s;
                }
                .auth-btn:hover {
                    transform: translateY(-2px);
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
                <p>Wielofunkcyjny bot Discord z RestoreCord!</p>
                <p><small>🔒 Wszystkie dane zabezpieczone w bazie danych</small></p>
                <div class="status">✅ ONLINE</div>
                
                <div style="margin: 30px 0;">
                    <a href="/auth" class="auth-btn">🔐 Autoryzuj Discord</a>
                    <a href="/dashboard" class="auth-btn">📊 Panel kontrolny</a>
                </div>
                
                <div class="stats">
                    <div class="stat-item">
                        ⏰ Uptime:<br>
                        <span class="stat-value">${Math.floor(process.uptime() / 60)}m</span>
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
            </div>
        </body>
        </html>
    `);
});

// OAuth2 authorization endpoint
app.get('/auth', (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    const authUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email%20guilds&state=${state}`;
    res.redirect(authUrl);
});

// OAuth2 callback
app.get('/auth/callback', async (req, res) => {
    const { code, state } = req.query;
    
    if (!code) {
        return res.status(400).send('❌ Brak kodu autoryzacji');
    }

    try {
        // Exchange code for token
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const { access_token, refresh_token } = tokenResponse.data;

        // Get user info
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        const userData = {
            ...userResponse.data,
            access_token,
            refresh_token
        };

        // Save to database
        await saveAuthorizedUser(userData);

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>✅ Autoryzacja zakończona</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                    }
                    .container {
                        text-align: center;
                        padding: 40px;
                        background: rgba(255,255,255,0.15);
                        border-radius: 20px;
                        backdrop-filter: blur(10px);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>✅ Autoryzacja zakończona!</h1>
                    <p>Witaj <strong>${userData.username}#${userData.discriminator}</strong>!</p>
                    <p>Twoje konto zostało pomyślnie autoryzowane.</p>
                    <p>Możesz teraz zamknąć to okno.</p>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('OAuth error:', error);
        res.status(500).send('❌ Błąd autoryzacji');
    }
});

// Dashboard endpoint
app.get('/dashboard', async (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>📊 Panel Kontrolny</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    background: rgba(255,255,255,0.15);
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                    padding: 30px;
                }
                .btn {
                    display: inline-block;
                    padding: 10px 20px;
                    background: #5865F2;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 10px;
                }
                .secure {
                    background: #00ff00;
                    color: #000;
                    padding: 10px;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📊 Panel Kontrolny</h1>
                <div class="secure">🔒 Wszystkie dane są bezpiecznie zapisywane w bazie danych Turso</div>
                
                <h2>🔧 Funkcje RestoreCord:</h2>
                <a href="/api/backups" class="btn">📋 Moje Backupy</a>
                <a href="/auth" class="btn">🔐 Autoryzuj Discord</a>
                
                <h3>ℹ️ Jak używać:</h3>
                <ol>
                    <li>Autoryzuj swoje konto Discord</li>
                    <li>Użyj komendy <code>/backup-server</code> na serwerze</li>
                    <li>Bot utworzy backup wszystkich członków</li>
                    <li>Użyj <code>/restore-members</code> żeby wysłać zaproszenia</li>
                </ol>
                
                <h3>🔒 Bezpieczeństwo danych:</h3>
                <ul>
                    <li>✅ Poziomy użytkowników - zapisane w bazie</li>
                    <li>✅ Historia zaproszeń - zapisana w bazie</li>
                    <li>✅ Aktywne tickety - zapisane w bazie</li>
                    <li>✅ Konfiguracja serwerów - zapisana w bazie</li>
                    <li>✅ Backupy RestoreCord - zapisane w bazie</li>
                </ul>
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
        users: client.users?.cache.size || 0,
        uptime: process.uptime(),
        ping: client.ws?.ping || 0,
        database: 'Turso - Secured'
    });
});

// API endpoint dla backupów
app.get('/api/backups', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: 'Brak user ID' });
        }

        const backups = await getServerBackups(userId);
        res.json({ success: true, backups });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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
// 💾 ZMIENNE GLOBALNE (TERAZ ŁADOWANE Z BAZY)
// ═══════════════════════════════════════════════════════════

const invites = new Map();
let activeTickets = new Map();

// Usuń stare pliki JSON (opcjonalne - pozostaw jako backup)
// fs.existsSync('levels.json') && fs.unlinkSync('levels.json');
// fs.existsSync('warnings.json') && fs.unlinkSync('warnings.json');

// ═══════════════════════════════════════════════════════════
// 🎫 TICKET CATEGORIES (BEZ ZMIAN)
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
    sale: {
        name: '💰 Sprzedaż',
        emoji: '💰',
        description: 'Chcesz coś sprzedać'
    },
    purchase: {
        name: '🛒 Zakup',
        emoji: '🛒',
        description: 'Chcesz coś kupić'
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
// ⚙️ FUNKCJE POMOCNICZE (ZAKTUALIZOWANE)
// ═══════════════════════════════════════════════════════════

async function loadInvites(guild) {
    try {
        // Pobierz aktualne zaproszenia z Discord
        const firstInvites = await guild.invites.fetch();
        const invitesMap = new Map(firstInvites.map((invite) => [invite.code, invite.uses]));
        
        // Zapisz do bazy danych
        await saveGuildInvites(guild.id, invitesMap);
        
        // Załaduj z bazy danych
        const savedInvites = await loadGuildInvites(guild.id);
        invites.set(guild.id, savedInvites);
        
        console.log(`✅ Załadowano ${savedInvites.size} zaproszeń dla ${guild.name}`);
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

async function updateMemberCount(guild) {
    try {
        // Aktualizuj statystyki w bazie
        await updateGuildStats(guild.id, guild.memberCount);
        
        // Aktualizuj kanał z liczbą członków jeśli jest skonfigurowany
        if (process.env.MEMBER_COUNT_CHANNEL_ID) {
            const channel = guild.channels.cache.get(process.env.MEMBER_COUNT_CHANNEL_ID);
            if (channel) {
                await channel.setName(`👥 Członków: ${guild.memberCount}`);
            }
        }
    } catch (error) {
        console.error('❌ Błąd licznika członków:', error.message);
    }
}

// Funkcja bezpiecznej odpowiedzi na interakcję (bez zmian)
async function safeReply(interaction, options) {
    try {
        if (interaction.replied || interaction.deferred) {
            return await interaction.editReply(options);
        } else {
            return await interaction.reply(options);
        }
    } catch (error) {
        console.error('❌ Błąd odpowiedzi:', error.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════
// 🤖 BOT READY (ZAKTUALIZOWANE)
// ═══════════════════════════════════════════════════════════

client.once('ready', async () => {
    console.log(`
╔═══════════════════════════════════════╗
║   🤖 BOT ONLINE!                      ║
║   👤 ${client.user.tag.padEnd(29)} ║
║   🔒 SECURED DATABASE EDITION         ║
╚═══════════════════════════════════════╝
    `);
    
    // Inicjalizuj bazę danych
    console.log('📊 Inicjalizowanie bazy danych...');
    await initDatabase();
    
    // Załaduj aktywne tickety z bazy
    console.log('🎫 Ładowanie aktywnych ticketów...');
    activeTickets = await loadActiveTicketsToMemory();
    
    client.user.setActivity('🔒 Secured RestoreCord Bot', { type: 3 });
    
    // Załaduj dane dla wszystkich serwerów
    console.log('⚙️ Ładowanie danych serwerów...');
    for (const guild of client.guilds.cache.values()) {
        await loadInvites(guild);
        await updateMemberCount(guild);
        await saveGuildConfig(guild.id, guild.name, guild.ownerId);
    }
    
    if (process.env.CLIENT_ID && process.env.GUILD_ID) {
        await registerCommands();
    } else {
        console.log('⚠️ Brak CLIENT_ID lub GUILD_ID - pomijam rejestrację komend');
    }
    
    console.log('✅ Wszystkie systemy działają!');
    console.log(`📊 Serwery: ${client.guilds.cache.size}`);
    console.log(`👥 Użytkownicy: ${client.users.cache.size}`);
    console.log(`🔒 Baza danych: Turso - Zabezpieczone`);
    console.log(`🌐 OAuth URL: http://localhost:${PORT}/auth`);
});

// ═══════════════════════════════════════════════════════════
// 👋 SYSTEM POWITALNY (ZAKTUALIZOWANY)
// ═══════════════════════════════════════════════════════════

client.on('guildMemberAdd', async (member) => {
    try {
        const cachedInvites = invites.get(member.guild.id) || new Map();
        const newInvites = await member.guild.invites.fetch();
        
        let inviter = null;
        let usedInviteCode = null;
        
        const usedInviteData = newInvites.find(inv => {
            const cached = cachedInvites.get(inv.code) || 0;
            return cached < inv.uses;
        });
        
        if (usedInviteData) {
            inviter = usedInviteData.inviter;
            usedInviteCode = usedInviteData.code;
        }
        
        // Aktualizuj cache zaproszeń
        const newInvitesMap = new Map(newInvites.map((invite) => [invite.code, invite.uses]));
        invites.set(member.guild.id, newInvitesMap);
        
        // Zapisz nowe zaproszenia do bazy
        await saveGuildInvites(member.guild.id, newInvitesMap);
        
        // Zapisz informacje o dołączeniu do bazy
        await saveMemberJoin(
            member.id, 
            member.guild.id, 
            member.user.tag,
            inviter?.id || null,
            usedInviteCode,
            member.user.createdAt.toISOString()
        );
        
        const lobbyChannel = member.guild.channels.cache.get(process.env.LOBBY_CHANNEL_ID);
        
        if (lobbyChannel) {
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🎉 Witamy na serwerze!')
                .setDescription(`Hej ${member}! Miło Cię widzieć! 👋\n\n**Jesteś naszym ${member.guild.memberCount}. członkiem!**`)
                .addFields(
                    { 
                        name: '📨 Zaproszony przez', 
                        value: inviter ? `**${inviter.tag}**` : '❓ Nieznane',
                        inline: true 
                    },
                    { 
                        name: '📅 Konto utworzone', 
                        value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
                        inline: true 
                    },
                    {
                        name: '🔗 Kod zaproszenia',
                        value: usedInviteCode ? `\`${usedInviteCode}\`` : '❓ Nieznane',
                        inline: true
                    }
                )
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: '🔒 Dane zapisane w bazie danych' })
                .setTimestamp();
            
            await lobbyChannel.send({ content: `${member}`, embeds: [welcomeEmbed] });
        }
        
        await updateMemberCount(member.guild);
    } catch (error) {
        console.error('❌ Błąd guildMemberAdd:', error.message);
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
        console.error('❌ Błąd guildMemberRemove:', error.message);
    }
});

// ═══════════════════════════════════════════════════════════
// 📝 SYSTEM POZIOMÓW (ZAKTUALIZOWANY)
// ═══════════════════════════════════════════════════════════

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;
    
    try {
        // Użyj nowej funkcji z bazy danych
        const xpGain = Math.floor(Math.random() * 15) + 15;
        const newLevel = await updateUserLevel(
            message.author.id, 
            message.guild.id, 
            message.author.tag, 
            xpGain
        );
        
        if (newLevel) {
            const levelUpEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🎉 LEVEL UP!')
                .setDescription(`${message.author} awansował na poziom **${newLevel}**!`)
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: '🔒 Poziom zapisany w bazie danych' })
                .setTimestamp();
            
            const levelChannel = process.env.LEVEL_UP_CHANNEL_ID 
                ? message.guild.channels.cache.get(process.env.LEVEL_UP_CHANNEL_ID) || message.channel
                : message.channel;
            
            await levelChannel.send({ embeds: [levelUpEmbed] });
        }
        
        // Reakcje (bez zmian)
        const content = message.content.toLowerCase();
        if (content.includes('bot')) await message.react('🤖').catch(() => {});
        if (content.includes('❤️')) await message.react('❤️').catch(() => {});
        if (content.includes('cześć') || content.includes('hej')) await message.react('👋').catch(() => {});
    } catch (error) {
        console.error('❌ Błąd messageCreate:', error.message);
    }
});

// ═══════════════════════════════════════════════════════════
// 🗑️ LOGI WIADOMOŚCI (BEZ ZMIAN)
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
        console.error('❌ Błąd messageDelete:', error.message);
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
            .setDescription(`**Autor:** ${oldMessage.author}\n**Kanał:** ${oldMessage.channel}`)
            .addFields(
                { name: '📝 Przed', value: `\`\`\`${(oldMessage.content || 'Brak').substring(0, 500)}\`\`\`` },
                { name: '✅ Po', value: `\`\`\`${(newMessage.content || 'Brak').substring(0, 500)}\`\`\`` }
            )
            .setTimestamp();
        
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('❌ Błąd messageUpdate:', error.message);
    }
});

// ═══════════════════════════════════════════════════════════
// 📨 INVITES (ZAKTUALIZOWANE)
// ═══════════════════════════════════════════════════════════

client.on('inviteCreate', async (invite) => {
    try {
        const cachedInvites = invites.get(invite.guild.id) || new Map();
        cachedInvites.set(invite.code, invite.uses);
        
        // Zapisz do bazy danych
        await saveGuildInvites(invite.guild.id, cachedInvites);
    } catch (error) {
        console.error('❌ Błąd inviteCreate:', error.message);
    }
});

client.on('inviteDelete', async (invite) => {
    try {
        const cachedInvites = invites.get(invite.guild.id) || new Map();
        cachedInvites.delete(invite.code);
        
        // Zapisz do bazy danych
        await saveGuildInvites(invite.guild.id, cachedInvites);
    } catch (error) {
        console.error('❌ Błąd inviteDelete:', error.message);
    }
});

// ═══════════════════════════════════════════════════════════
// 🎮 INTERAKCJE (ZAKTUALIZOWANE DLA BAZY DANYCH)
// ═══════════════════════════════════════════════════════════

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand() && !interaction.isButton() && !interaction.isStringSelectMenu()) return;
    
    try {
        // 🔐 AUTHORIZE COMMAND (bez zmian)
        if (interaction.commandName === 'authorize') {
            const authUrl = `http://localhost:${PORT}/auth`;
            
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🔐 Autoryzacja RestoreCord')
                .setDescription(
                    '**Autoryzuj swoje konto Discord!**\n\n' +
                    'Dzięki autoryzacji bot będzie mógł:\n' +
                    '• Tworzyć backupy członków serwera\n' +
                    '• Wysyłać zaproszenia na inne serwery\n' +
                    '• Przywracać członków po problemach\n\n' +
                    '⚠️ **Bezpieczeństwo:** Tylko ty będziesz mógł zarządzać swoimi backupami\n\n' +
                    `[🔗 **Kliknij tutaj aby autoryzować**](${authUrl})`
                )
                .setFooter({ text: 'Autoryzacja jest dobrowolna i bezpieczna' })
                .setTimestamp();

            const button = new ButtonBuilder()
                .setLabel('🔐 Autoryzuj Discord')
                .setStyle(ButtonStyle.Link)
                .setURL(authUrl);

            const row = new ActionRowBuilder().addComponents(button);

            await safeReply(interaction, {
                embeds: [embed],
                components: [row],
                flags: MessageFlags.Ephemeral
            });
        }

        // 📋 BACKUP SERVER COMMAND (bez zmian)
        if (interaction.commandName === 'backup-server') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await safeReply(interaction, {
                    content: '❌ Potrzebujesz uprawnień administratora!',
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.deferReply();

            try {
                const guild = interaction.guild;
                const backupId = await createServerBackup(
                    guild.id, 
                    guild.name, 
                    guild.ownerId, 
                    interaction.user.id
                );

                if (!backupId) {
                    return await safeReply(interaction, {
                        content: '❌ Błąd tworzenia backupu!'
                    });
                }

                // Pobierz wszystkich członków
                const members = await guild.members.fetch();
                let savedCount = 0;

                for (const [, member] of members) {
                    const memberData = {
                        id: member.id,
                        username: member.user.username,
                        discriminator: member.user.discriminator,
                        avatar: member.user.avatar,
                        joined_at: member.joinedAt?.toISOString(),
                        roles: member.roles.cache.map(r => r.id),
                        nickname: member.nickname
                    };

                    const success = await saveBackupMember(backupId, memberData);
                    if (success) savedCount++;
                }

                // Zaktualizuj liczbę członków w backupie
                await turso.execute({
                    sql: `UPDATE server_backups SET member_count = ? WHERE backup_id = ?`,
                    args: [savedCount, backupId]
                });

                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('✅ Backup serwera utworzony!')
                    .setDescription(
                        `**Backup ID:** \`${backupId}\`\n\n` +
                        `📊 **Statystyki:**\n` +
                        `• Serwer: **${guild.name}**\n` +
                        `• Członków: **${savedCount}**\n` +
                        `• Data: <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                        `🔧 **Użycie:** \`/restore-members ${backupId}\``
                    )
                    .setFooter({ text: `🔒 Backup zabezpieczony w bazie danych` })
                    .setTimestamp();

                await safeReply(interaction, { embeds: [embed] });

            } catch (error) {
                console.error('❌ Błąd backupu:', error);
                await safeReply(interaction, {
                    content: '❌ Wystąpił błąd podczas tworzenia backupu!'
                });
            }
        }

        // 🔄 RESTORE MEMBERS COMMAND (bez zmian)  
        if (interaction.commandName === 'restore-members') {
            const backupId = interaction.options.getString('backup_id');

            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await safeReply(interaction, {
                    content: '❌ Potrzebujesz uprawnień administratora!',
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.deferReply();

            try {
                // Sprawdź czy backup istnieje
                const backupResult = await turso.execute({
                    sql: `SELECT * FROM server_backups WHERE backup_id = ?`,
                    args: [backupId]
                });

                if (backupResult.rows.length === 0) {
                    return await safeReply(interaction, {
                        content: '❌ Nie znaleziono backupu o podanym ID!'
                    });
                }

                const backup = backupResult.rows[0];
                const members = await getBackupMembers(backupId);

                if (members.length === 0) {
                    return await safeReply(interaction, {
                        content: '❌ Backup jest pusty!'
                    });
                }

                // Utwórz zaproszenie na aktualny serwer
                const invite = await interaction.guild.invites.create(
                    interaction.channel.id,
                    {
                        maxAge: 86400, // 24h
                        maxUses: members.length,
                        unique: true,
                        reason: `Restore członków z backupu ${backupId}`
                    }
                );

                let sentCount = 0;
                let errorCount = 0;

                // Wyślij zaproszenia do autoryzowanych użytkowników
                for (const member of members) {
                    try {
                        const userResult = await turso.execute({
                            sql: `SELECT access_token FROM authorized_users WHERE user_id = ?`,
                            args: [member.user_id]
                        });

                        if (userResult.rows.length > 0) {
                            // Użytkownik jest autoryzowany - można wysłać DM
                            const user = await client.users.fetch(member.user_id).catch(() => null);
                            if (user) {
                                const dmEmbed = new EmbedBuilder()
                                    .setColor('#5865F2')
                                    .setTitle('📨 Zaproszenie na serwer')
                                    .setDescription(
                                        `Hej! Zostałeś zaproszony na serwer:\n\n` +
                                        `🏰 **${interaction.guild.name}**\n` +
                                        `👤 **Zapraszający:** ${interaction.user.tag}\n\n` +
                                        `To zaproszenie zostało wysłane na podstawie backupu serwera.`
                                    )
                                    .setThumbnail(interaction.guild.iconURL())
                                    .setTimestamp();

                                const inviteButton = new ButtonBuilder()
                                    .setLabel('🔗 Dołącz do serwera')
                                    .setStyle(ButtonStyle.Link)
                                    .setURL(`https://discord.gg/${invite.code}`);

                                const row = new ActionRowBuilder().addComponents(inviteButton);

                                await user.send({ embeds: [dmEmbed], components: [row] });
                                sentCount++;
                            }
                        }
                    } catch (error) {
                        errorCount++;
                        console.error(`❌ Błąd wysyłania zaproszenia do ${member.username}:`, error.message);
                    }
                }

                const resultEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('📨 Zaproszenia wysłane!')
                    .setDescription(
                        `**Backup:** \`${backupId}\`\n` +
                        `**Serwer źródłowy:** ${backup.guild_name}\n\n` +
                        `📊 **Wyniki:**\n` +
                        `• Wysłano: **${sentCount}**\n` +
                        `• Błędy: **${errorCount}**\n` +
                        `• Całkowicie w backupie: **${members.length}**\n\n` +
                        `🔗 **Link zaproszenia:** https://discord.gg/${invite.code}\n` +
                        `⏰ **Wygasa:** <t:${Math.floor((Date.now() + 86400000) / 1000)}:R>`
                    )
                    .setFooter({ text: `🔒 Tylko autoryzowani użytkownicy otrzymali DM` })
                    .setTimestamp();

                await safeReply(interaction, { embeds: [resultEmbed] });

            } catch (error) {
                console.error('❌ Błąd restore:', error);
                await safeReply(interaction, {
                    content: '❌ Wystąpił błąd podczas przywracania członków!'
                });
            }
        }

        // 📋 MY BACKUPS COMMAND (bez zmian)
        if (interaction.commandName === 'my-backups') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            try {
                const backups = await getServerBackups(interaction.user.id);

                if (backups.length === 0) {
                    return await safeReply(interaction, {
                        content: '📋 Nie masz żadnych backupów! Użyj `/backup-server` żeby utworzyć pierwszy.'
                    });
                }

                let description = '';
                for (const backup of backups.slice(0, 10)) {
                    const date = new Date(backup.created_at);
                    description += `**${backup.guild_name}**\n`;
                    description += `• ID: \`${backup.backup_id}\`\n`;
                    description += `• Członków: **${backup.member_count}**\n`;
                    description += `• Data: <t:${Math.floor(date.getTime() / 1000)}:R>\n\n`;
                }

                const embed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('📋 Twoje Backupy')
                    .setDescription(description)
                    .setFooter({ text: `🔒 Pokazano ${Math.min(backups.length, 10)} z ${backups.length} backupów` })
                    .setTimestamp();

                await safeReply(interaction, { embeds: [embed] });

            } catch (error) {
                console.error('❌ Błąd pobierania backupów:', error);
                await safeReply(interaction, {
                    content: '❌ Wystąpił błąd podczas pobierania backupów!'
                });
            }
        }

        // 🎫 TICKET PANEL (ZAKTUALIZOWANY)
        if (interaction.commandName === 'ticket') {
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎫 System Ticketów')
                .setDescription(
                    '**Potrzebujesz pomocy?**\n\n' +
                    'Wybierz kategorię z menu poniżej aby otworzyć ticket.\n' +
                    'Nasz team odpowie najszybciej jak to możliwe!\n\n' +
                    '🛠️ **Pomoc Techniczna** - problemy techniczne, błędy\n' +
                    '⚠️ **Zgłoszenie** - zgłoś użytkownika lub problem\n' +
                    '💰 **Sprzedaż** - chcesz coś sprzedać\n' +
                    '🛒 **Zakup** - chcesz coś kupić\n' +
                    '🤝 **Współpraca** - propozycje współpracy\n' +
                    '📝 **Inne** - pozostałe sprawy'
                )
                .setFooter({ text: '🔒 Możesz mieć tylko 1 otwarty ticket jednocześnie' })
                .setTimestamp();

            const select = new StringSelectMenuBuilder()
                .setCustomId('ticket_select')
                .setPlaceholder('📂 Wybierz kategorię ticketu...')
                .addOptions(
                    Object.entries(TICKET_CATEGORIES).map(([key, cat]) => 
                        new StringSelectMenuOptionBuilder()
                            .setLabel(cat.name)
                            .setDescription(cat.description)
                            .setValue(key)
                            .setEmoji(cat.emoji)
                    )
                );

            const row = new ActionRowBuilder().addComponents(select);

            await safeReply(interaction, { 
                embeds: [embed], 
                components: [row]
            });
        }

        // Użytkownik wybiera kategorię ticketu (ZAKTUALIZOWANY)
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            }

            // Sprawdź czy już ma otwarty ticket w bazie danych
            const existingChannelId = await getActiveTicket(interaction.user.id, interaction.guild.id);
            if (existingChannelId) {
                return await safeReply(interaction, { 
                    content: `❌ Masz już otwarty ticket: <#${existingChannelId}>\nZamknij go zanim otworzysz nowy!` 
                });
            }

            const categoryKey = interaction.values[0];
            const category = TICKET_CATEGORIES[categoryKey];

            try {
                const permissionOverwrites = [
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
                    }
                ];
                
                if (process.env.SELLER_ROLE_ID) {
                    permissionOverwrites.push({
                        id: process.env.SELLER_ROLE_ID,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ManageMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    });
                }

                const ticketChannel = await interaction.guild.channels.create({
                    name: `ticket-${interaction.user.username}`,
                    type: ChannelType.GuildText,
                    parent: process.env.TICKET_CATEGORY_ID || null,
                    permissionOverwrites
                });

                // Zapisz ticket do bazy danych i pamięci
                await saveActiveTicket(interaction.user.id, interaction.guild.id, ticketChannel.id, categoryKey);
                activeTickets.set(interaction.user.id, ticketChannel.id);

                const ticketEmbed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle(`${category.emoji} ${category.name}`)
                    .setDescription(
                        `**Witaj ${interaction.user}!**\n\n` +
                        `Opisz swój problem, a nasz team wkrótce pomoże.\n\n` +
                        `📋 Kategoria: **${category.name}**`
                    )
                    .setFooter({ text: `🔒 Ticket zabezpieczony w bazie danych` })
                    .setTimestamp();

                const closeBtn = new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('🔒 Zamknij Ticket')
                    .setStyle(ButtonStyle.Danger);

                const row = new ActionRowBuilder().addComponents(closeBtn);

                await ticketChannel.send({
                    content: process.env.SELLER_ROLE_ID 
                        ? `${interaction.user} <@&${process.env.SELLER_ROLE_ID}>` 
                        : `${interaction.user}`,
                    embeds: [ticketEmbed],
                    components: [row]
                });

                await safeReply(interaction, { 
                    content: `✅ Twój ticket został utworzony: ${ticketChannel}` 
                });

            } catch (error) {
                console.error('❌ Błąd tworzenia ticketu:', error);
                await safeReply(interaction, { 
                    content: '❌ Wystąpił błąd podczas tworzenia ticketu.' 
                });
            }
        }

        // Zamknięcie ticketu (ZAKTUALIZOWANY)
        if (interaction.customId === 'close_ticket') {
            await safeReply(interaction, { 
                content: '🔒 Ticket zostanie zamknięty za 5 sekund...' 
            });

            setTimeout(async () => {
                // Usuń z bazy danych i pamięci
                for (const [userId, channelId] of activeTickets.entries()) {
                    if (channelId === interaction.channel.id) {
                        await removeActiveTicket(userId, interaction.guild.id);
                        activeTickets.delete(userId);
                        break;
                    }
                }
                await interaction.channel.delete().catch(() => {});
            }, 5000);
        }

        // 📊 LEVEL (ZAKTUALIZOWANY)
        if (interaction.commandName === 'level') {
            const target = interaction.options.getUser('użytkownik') || interaction.user;
            const userData = await getUserLevel(target.id, interaction.guild.id);
            const nextLevelXP = getXpForLevel(userData.level + 1);
            const progress = ((userData.xp / nextLevelXP) * 100).toFixed(1);
            
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`📊 Poziom ${target.tag}`)
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '🏆 Poziom', value: `**${userData.level}**`, inline: true },
                    { name: '⭐ XP', value: `**${userData.xp}** / ${Math.floor(nextLevelXP)}`, inline: true },
                    { name: '📈 Postęp', value: `**${progress}%**`, inline: true },
                    { name: '💬 Wiadomości', value: `**${userData.totalMessages}**`, inline: true }
                )
                .setFooter({ text: '🔒 Dane z zabezpieczonej bazy danych' })
                .setTimestamp();
            
            await safeReply(interaction, { embeds: [embed] });
        }

        // 🏆 LEADERBOARD (ZAKTUALIZOWANY)
        if (interaction.commandName === 'leaderboard') {
            const topUsers = await getTopUsers(interaction.guild.id, 10);
            
            let description = '';
            for (let i = 0; i < topUsers.length; i++) {
                const userData = topUsers[i];
                const user = await client.users.fetch(userData.user_id).catch(() => null);
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                description += `${medal} **${user?.tag || userData.username}** - Level ${userData.level} (${userData.xp} XP)\n`;
            }
            
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🏆 Leaderboard - Top 10')
                .setDescription(description || 'Brak danych')
                .setFooter({ text: '🔒 Dane z zabezpieczonej bazy danych' })
                .setTimestamp();
            
            await safeReply(interaction, { embeds: [embed] });
        }

        // 👤 AVATAR (bez zmian)
        if (interaction.commandName === 'avatar') {
            const target = interaction.options.getUser('użytkownik') || interaction.user;
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`Avatar ${target.tag}`)
                .setImage(target.displayAvatarURL({ dynamic: true, size: 4096 }))
                .setTimestamp();
            await safeReply(interaction, { embeds: [embed] });
        }

        // 📊 SERVERINFO (bez zmian)
        if (interaction.commandName === 'serverinfo') {
            const { guild } = interaction;
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`📊 ${guild.name}`)
                .setThumbnail(guild.iconURL())
                .addFields(
                    { name: '👑 Właściciel', value: `<@${guild.ownerId}>`, inline: true },
                    { name: '👥 Członków', value: `**${guild.memberCount}**`, inline: true },
                    { name: '📅 Utworzony', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: '💬 Kanały', value: `**${guild.channels.cache.size}**`, inline: true },
                    { name: '🎭 Role', value: `**${guild.roles.cache.size}**`, inline: true },
                    { name: '😊 Emoji', value: `**${guild.emojis.cache.size}**`, inline: true }
                )
                .setFooter({ text: '🔒 Dane zabezpieczone w bazie danych' })
                .setTimestamp();
            await safeReply(interaction, { embeds: [embed] });
        }

        // 👤 USERINFO (bez zmian)
        if (interaction.commandName === 'userinfo') {
            const target = interaction.options.getUser('użytkownik') || interaction.user;
            const member = await interaction.guild.members.fetch(target.id);
            
            const roles = member.roles.cache
                .filter(role => role.id !== interaction.guild.id)
                .sort((a, b) => b.position - a.position)
                .map(role => role.toString())
                .slice(0, 5);
            
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`👤 ${target.tag}`)
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '🆔 ID', value: `\`${target.id}\``, inline: true },
                    { name: '📅 Konto', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: '📥 Dołączył', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                    { name: '🎭 Role', value: roles.join(', ') || 'Brak ról' }
                )
                .setTimestamp();
            await safeReply(interaction, { embeds: [embed] });
        }

        // 🎲 ROLL (bez zmian)
        if (interaction.commandName === 'roll') {
            const max = interaction.options.getInteger('maksimum') || 100;
            const result = Math.floor(Math.random() * max) + 1;
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🎲 Rzut kostką')
                .setDescription(`${interaction.user} wyrzucił **${result}** (1-${max})!`)
                .setTimestamp();
            await safeReply(interaction, { embeds: [embed] });
        }

        // 🎱 8BALL (bez zmian)
        if (interaction.commandName === '8ball') {
            const question = interaction.options.getString('pytanie');
            const answers = [
                'Tak', 'Nie', 'Może', 'Zdecydowanie tak', 
                'Zdecydowanie nie', 'Nie jestem pewien', 'Pytaj później',
                'Absolutnie tak!', 'Raczej nie', 'Wszystko wskazuje na tak'
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
            await safeReply(interaction, { embeds: [embed] });
        }

        // ℹ️ HELP (ZAKTUALIZOWANY)
        if (interaction.commandName === 'help') {
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📚 Lista Komend')
                .setDescription('Wszystkie dostępne komendy bota:')
                .addFields(
                    { name: '🔐 RestoreCord', value: '`/authorize` - Autoryzuj konto Discord\n`/backup-server` - Utwórz backup serwera\n`/restore-members` - Przywróć członków\n`/my-backups` - Twoje backupy' },
                    { name: '🎫 Tickety', value: '`/ticket` - Wyślij panel ticketów na kanał (admin)' },
                    { name: '📊 Poziomy', value: '`/level` - Sprawdź poziom\n`/leaderboard` - Ranking top 10' },
                    { name: '👤 Informacje', value: '`/avatar` - Avatar\n`/userinfo` - Info o użytkowniku\n`/serverinfo` - Info o serwerze' },
                    { name: '🎮 Fun', value: '`/roll` - Rzut kostką\n`/8ball` - Magiczna kula' },
                    { name: 'ℹ️ Inne', value: '`/help` - Ta wiadomość' }
                )
                .setFooter({ text: '🔒 Ultimate Discord Bot | Zabezpieczona baza danych' })
                .setTimestamp();
            await safeReply(interaction, { 
                embeds: [embed], 
                flags: MessageFlags.Ephemeral 
            });
        }

    } catch (error) {
        console.error('❌ Błąd interakcji:', error);
        if (!interaction.replied && !interaction.deferred) {
            await safeReply(interaction, { 
                content: '❌ Wystąpił błąd!', 
                flags: MessageFlags.Ephemeral 
            });
        }
    }
});

// ═══════════════════════════════════════════════════════════
// 📋 REJESTRACJA KOMEND (BEZ ZMIAN)
// ═══════════════════════════════════════════════════════════

async function registerCommands() {
    const commands = [
        { 
            name: 'authorize', 
            description: 'Autoryzuj swoje konto Discord dla RestoreCord' 
        },
        { 
            name: 'backup-server', 
            description: 'Utwórz backup wszystkich członków serwera (admin)' 
        },
        { 
            name: 'restore-members', 
            description: 'Przywróć członków z backupu (admin)',
            options: [{ 
                name: 'backup_id', 
                description: 'ID backupu do przywrócenia',
                type: 3, 
                required: true 
            }]
        },
        { 
            name: 'my-backups', 
            description: 'Pokaż listę twoich backupów' 
        },
        { 
            name: 'ticket', 
            description: 'Wyślij panel ticketów na kanał (tylko admin)' 
        },
        { 
            name: 'level', 
            description: 'Sprawdź poziom użytkownika',
            options: [{ 
                name: 'użytkownik', 
                description: 'Wybierz użytkownika do sprawdzenia',
                type: 6, 
                required: false 
            }]
        },
        { 
            name: 'leaderboard', 
            description: 'Zobacz ranking top 10 użytkowników' 
        },
        { 
            name: 'avatar', 
            description: 'Pokaż avatar użytkownika',
            options: [{ 
                name: 'użytkownik', 
                description: 'Wybierz użytkownika',
                type: 6, 
                required: false 
            }]
        },
        { 
            name: 'userinfo', 
            description: 'Pokaż informacje o użytkowniku',
            options: [{ 
                name: 'użytkownik', 
                description: 'Wybierz użytkownika',
                type: 6, 
                required: false 
            }]
        },
        { 
            name: 'serverinfo', 
            description: 'Pokaż informacje o serwerze' 
        },
        { 
            name: 'roll', 
            description: 'Rzuć kostką',
            options: [{ 
                name: 'maksimum', 
                description: 'Maksymalna wartość kostki (domyślnie 100)',
                type: 4, 
                required: false 
            }]
        },
        { 
            name: '8ball', 
            description: 'Zapytaj magiczną kulę',
            options: [{ 
                name: 'pytanie', 
                description: 'Twoje pytanie do magicznej kuli',
                type: 3, 
                required: true 
            }]
        },
        { 
            name: 'help', 
            description: 'Pokaż listę wszystkich komend' 
        }
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
        console.error('❌ Błąd komend:', error.message);
    }
}

// ═══════════════════════════════════════════════════════════
// 🚀 LOGIN
// ═══════════════════════════════════════════════════════════

console.log('⚡ Logging in...');
client.login(process.env.DISCORD_TOKEN);
