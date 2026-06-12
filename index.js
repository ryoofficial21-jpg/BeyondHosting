const {
    Client,
    GatewayIntentBits,
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const config = require('./config');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once(Events.ClientReady, () => {
    console.log(`${client.user.tag} is online!`);
});

/* =========================================================
   MESSAGE CREATE (WHITELIST ONLY)
========================================================= */

client.on(Events.MessageCreate, async (message) => {
    if (!message.guild || message.author.bot) return;

    const content = message.content;

    /* ================= WHITELIST ================= */

    if (
        content.includes("Name:") &&
        content.includes("Steam Link:") &&
        content.includes("Vouched by:")
    ) {
        const lines = content.split('\n');

        const name =
            lines.find(x => x.startsWith("Name:"))?.replace("Name:", "").trim() || "N/A";

        const steam =
            lines.find(x => x.startsWith("Steam Link:"))?.replace("Steam Link:", "").trim() || "N/A";

        const vouched =
            lines.find(x => x.startsWith("Vouched by:"))?.replace("Vouched by:", "").trim() || "No vouch";

        const mention = message.mentions.users.first();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`vouch_${mention?.id || "none"}_${message.author.id}`)
                .setLabel("Vouch")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId(`approve_${message.author.id}`)
                .setLabel("Approve")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(`deny_${message.author.id}`)
                .setLabel("Deny")
                .setStyle(ButtonStyle.Danger)
        );

        const embed = new EmbedBuilder()
            .setColor("Yellow")
            .setTitle(`Whitelist Request #${Math.floor(Math.random() * 9999)}`)
            .setThumbnail(config.images.thumbnail)
            .addFields(
                { name: "Applicant", value: `${message.author}`, inline: true },
                { name: "Submitted At", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                { name: "Name", value: name, inline: true },
                { name: "Steam Link", value: steam, inline: false },
                { name: "Status", value: "Pending", inline: true },
                { name: "Reviewed By", value: "N/A", inline: true },
                { name: "Reviewed At", value: "N/A", inline: true },
                { name: "Vouched By", value: vouched, inline: false }
            )
            .setFooter({ text: `User ID: ${message.author.id}` });

        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete().catch(() => {});
    }
});

/* =========================================================
   INTERACTIONS (WHITELIST ONLY)
========================================================= */

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;

    const parts = interaction.customId.split("_");
    const action = parts[0];

    const embed = interaction.message.embeds[0];
    if (!embed) return;

    const fields = [...embed.fields];

    /* ================= VOUCH ================= */

    if (action === "vouch") {
        const vouchUserId = parts[1];

        if (interaction.user.id !== vouchUserId) {
            return interaction.reply({
                content: "❌ Only assigned user can vouch.",
                ephemeral: true
            });
        }

        return interaction.update({
            content: "✅ Vouched successfully",
            components: []
        });
    }

    /* ================= APPROVE ================= */

    if (action === "approve") {
        const userId = parts[1];

        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);

        if (!member || !member.roles.cache.has(config.roles.headAdmin)) {
            return interaction.reply({
                content: "❌ Head Admin only.",
                ephemeral: true
            });
        }

        const target = await interaction.guild.members.fetch(userId).catch(() => null);

        if (!target) {
            return interaction.reply({
                content: "❌ User not found.",
                ephemeral: true
            });
        }

        if (config.serverRoles?.citizen) {
            await target.roles.add(config.serverRoles.citizen).catch(() => {});
        }

        if (config.serverRoles?.unverified) {
            await target.roles.remove(config.serverRoles.unverified).catch(() => {});
        }

        const updated = EmbedBuilder.from(embed).setColor("Green");

        return interaction.update({
            embeds: [updated],
            components: []
        });
    }

    /* ================= DENY ================= */

    if (action === "deny") {
        const updated = EmbedBuilder.from(embed).setColor("Red");

        return interaction.update({
            embeds: [updated],
            components: []
        });
    }
});

client.login(process.env.TOKEN);