require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const konten = {};
const gesperrteKonten = new Set();

const commands = [
    {
        name: 'konto_erstellen',
        description: 'Erstelle ein neues Konto mit 5000 Euro Startguthaben.',
        options: [
            { name: 'name', type: 3, description: 'Dein Vorname', required: true },
            { name: 'nachname', type: 3, description: 'Dein Nachname', required: true },
            { name: 'alter', type: 4, description: 'Dein Alter', required: true },
        ],
    },
    {
        name: 'konto_sperren',
        description: 'Sperrt das Konto eines Benutzers (nur für Admins).',
        options: [
            { name: 'benutzer', type: 6, description: 'Der Benutzer, dessen Konto gesperrt werden soll.', required: true },
        ],
    },
    {
        name: 'konto',
        description: 'Zeigt deinen Kontostand oder den eines anderen Benutzers an.',
        options: [
            { name: 'benutzer', type: 6, description: 'Der Benutzer, dessen Konto angezeigt werden soll.', required: false },
        ],
    },
    {
        name: 'muenzwurf',
        description: 'Wette auf Kopf oder Zahl.',
        options: [
            { name: 'wette', type: 3, description: 'Wette auf Kopf oder Zahl', required: true },
        ],
    },
    {
        name: 'roulette',
        description: 'Setze auf eine Zahl (0-36) oder auf rot/schwarz.',
        options: [
            { name: 'wette', type: 3, description: 'Die Zahl oder Farbe, auf die du setzen möchtest.', required: true },
        ],
    },
    {
        name: 'blackjack',
        description: 'Spiele ein Spiel Blackjack gegen den Bot.',
        options: [
            { name: 'wette', type: 4, description: 'Der Betrag, den du setzen möchtest.', required: true },
        ],
    },
    {
        name: 'slots',
        description: 'Spiele an der Slot-Maschine.',
        options: [
            { name: 'wette', type: 4, description: 'Der Betrag, den du setzen möchtest.', required: true },
        ],
    },
    {
        name: 'konto_loeschen',
        description: 'Löscht dein Konto.',
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('✅ Slash-Commands erfolgreich registriert.');
    } catch (error) {
        console.error(error);
    }
})();

client.once('ready', () => {
    console.log(`✅ Eingeloggt als ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const userId = interaction.user.id;

    if (!konten[userId] && interaction.commandName !== 'konto_erstellen') {
        await interaction.reply({ content: '❌ Du hast noch kein Konto! Erstelle eins mit `/konto_erstellen`.', ephemeral: true });
        return;
    }

    if (gesperrteKonten.has(userId)) {
        await interaction.reply({ content: '❌ Dein Konto ist gesperrt!', ephemeral: true });
        return;
    }

    switch (interaction.commandName) {
        case 'konto_erstellen':
            if (konten[userId]) {
                await interaction.reply({ content: '❌ Du hast bereits ein Konto!', ephemeral: true });
                return;
            }

            const name = interaction.options.getString('name');
            const nachname = interaction.options.getString('nachname');
            const alter = interaction.options.getInteger('alter');

            konten[userId] = { wallet: 5000, bank: 0, name, nachname, alter };
            await interaction.reply({
                content: `✅ Konto erfolgreich erstellt!\n👤 **Name:** ${name} ${nachname}\n🎂 **Alter:** ${alter}\n💰 **Startguthaben:** 5000 Euro`,
                ephemeral: true,
            });
            break;

        case 'konto_sperren':
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                await interaction.reply({ content: '❌ Du hast keine Berechtigung dazu.', ephemeral: true });
                return;
            }

            const benutzer = interaction.options.getUser('benutzer');
            if (!benutzer) {
                await interaction.reply({ content: '❌ Du musst einen Benutzer angeben, dessen Konto gesperrt werden soll.', ephemeral: true });
                return;
            }

            gesperrteKonten.add(benutzer.id);
            await interaction.reply({
                content: `✅ Das Konto von ${benutzer.username} wurde erfolgreich gesperrt.`,
                ephemeral: true,
            });
            break;

        case 'muenzwurf':
            const wetteMuenze = interaction.options.getString('wette').toLowerCase();
            if (wetteMuenze !== 'kopf' && wetteMuenze !== 'zahl') {
                await interaction.reply({ content: '❌ Du musst entweder auf Kopf oder Zahl wetten.', ephemeral: true });
                return;
            }

            const muenzeErgebnis = Math.random() < 0.5 ? 'kopf' : 'zahl';
            const gewonnen = wetteMuenze === muenzeErgebnis;

            await interaction.reply({
                content: `🪙 Das Ergebnis ist **${muenzeErgebnis}**! ${gewonnen ? '✅ Du hast gewonnen!' : '❌ Du hast verloren.'}`,
                ephemeral: true,
            });
            break;

        case 'roulette':
            const wetteRoulette = interaction.options.getString('wette').toLowerCase();
            const rouletteErgebnis = Math.floor(Math.random() * 37);
            const rouletteFarbe = rouletteErgebnis === 0 ? 'grün' : (rouletteErgebnis % 2 === 0 ? 'schwarz' : 'rot');

            if (wetteRoulette === 'rot' || wetteRoulette === 'schwarz') {
                const gewonnenFarbe = wetteRoulette === rouletteFarbe;
                await interaction.reply({
                    content: `🎰 Das Ergebnis ist **${rouletteErgebnis}** (${rouletteFarbe})! ${gewonnenFarbe ? '✅ Du hast gewonnen!' : '❌ Du hast verloren.'}`,
                    ephemeral: true,
                });
            } else if (parseInt(wetteRoulette) >= 0 && parseInt(wetteRoulette) <= 36) {
                const gewonnenNummer = parseInt(wetteRoulette) === rouletteErgebnis;
                await interaction.reply({
                    content: `🎰 Das Ergebnis ist **${rouletteErgebnis}**! ${gewonnenNummer ? '✅ Du hast gewonnen!' : '❌ Du hast verloren.'}`,
                    ephemeral: true,
                });
            } else {
                await interaction.reply({ content: '❌ Ungültige Wette. Setze entweder auf eine Zahl (0-36) oder rot/schwarz.', ephemeral: true });
            }
            break;

        case 'blackjack':
            const bet = interaction.options.getInteger('wette');
            if (bet > konten[userId].wallet) {
                await interaction.reply({ content: '❌ Du kannst nicht mehr setzen, als du hast.', ephemeral: true });
                return;
            }

            const userCards = [drawCard(), drawCard()];
            const botCards = [drawCard(), drawCard()];

            let userScore = getScore(userCards);
            let botScore = getScore(botCards);

            while (botScore < 17) {
                botCards.push(drawCard());
                botScore = getScore(botCards);
            }

            const result = getBlackjackResult(userScore, botScore);

            konten[userId].wallet += result === 'Gewonnen' ? bet : -bet;

            await interaction.reply({
                content: `🃏 Deine Karten: ${userCards.join(' ')} (Gesamt: ${userScore})\n🤖 Bot Karten: ${botCards.join(' ')} (Gesamt: ${botScore})\n\n${result === 'Gewonnen' ? '✅ Du hast gewonnen!' : '❌ Du hast verloren.'}`,
                ephemeral: true,
            });
            break;

        case 'slots':
            const slotWette = interaction.options.getInteger('wette');
            if (slotWette > konten[userId].wallet) {
                await interaction.reply({ content: '❌ Du kannst nicht mehr setzen, als du hast.', ephemeral: true });
                return;
            }

            const slotErgebnisse = ['🍒', '🍋', '🍊', '🍉', '🍇'];
            const slotResultat = [getRandomSlot(), getRandomSlot(), getRandomSlot()];
            const slotGewinn = calculateSlotWin(slotResultat);

            konten[userId].wallet += slotGewinn;

            await interaction.reply({
                content: `🎰 Die Slot-Ergebnisse: ${slotResultat.join(' ')}\n💰 Du hast ${slotGewinn > 0 ? `gewonnen: ${slotGewinn} Euro` : 'nichts gewonnen!'}`,
                ephemeral: true,
            });
            break;

        case 'konto_loeschen':
            delete konten[userId];
            await interaction.reply({ content: '✅ Dein Konto wurde erfolgreich gelöscht.', ephemeral: true });
            break;

        default:
            await interaction.reply({ content: '❌ Unbekannter Befehl.', ephemeral: true });
            break;
    }
});

function drawCard() {
    const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    return cards[Math.floor(Math.random() * cards.length)];
}

function getScore(cards) {
    let score = 0;
    let aceCount = 0;

    cards.forEach(card => {
        if (card === 'J' || card === 'Q' || card === 'K') score += 10;
        else if (card === 'A') {
            score += 11;
            aceCount++;
        } else {
            score += parseInt(card);
        }
    });

    while (score > 21 && aceCount) {
        score -= 10;
        aceCount--;
    }

    return score;
}

function getBlackjackResult(userScore, botScore) {
    if (userScore > 21) return 'Verloren';
    if (botScore > 21) return 'Gewonnen';
    if (userScore > botScore) return 'Gewonnen';
    if (userScore < botScore) return 'Verloren';
    return 'Unentschieden';
}

function getRandomSlot() {
    const slotItems = ['🍒', '🍋', '🍊', '🍉', '🍇'];
    return slotItems[Math.floor(Math.random() * slotItems.length)];
}

function calculateSlotWin(slotResultat) {
    const uniqueItems = new Set(slotResultat);
    if (uniqueItems.size === 1) {
        return 100;
    } else if (uniqueItems.size === 2) {
        return 20;
    } else {
        return 0;
    }
}

client.login(process.env.DISCORD_TOKEN);
