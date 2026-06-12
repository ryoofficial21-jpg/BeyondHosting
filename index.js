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
   MESSAGE CREATE
========================================================= */

client.on(Events.MessageCreate, async (message) => {
if (!message.guild || message.author.bot) return;


const content = message.content;

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

    await message.channel.send({
        embeds: [embed],
        components: [row]
    });

    await message.delete().catch(() => {});
}


});

client.on(Events.InteractionCreate, async (interaction) => {
if (!interaction.isButton()) return;

const embed = interaction.message.embeds[0];
if (!embed) return;

const fields = [...embed.fields];
const parts = interaction.customId.split("_");
const action = parts[0];

if (action === "vouch") {
    const vouchUserId = parts[1];

    if (interaction.user.id !== vouchUserId) {
        return interaction.reply({
            content: "❌ Only vouched user can approve.",
            ephemeral: true
        });
    }

    const newFields = [...fields];

    newFields[7] = {
        name: "✅ Vouched By",
        value: newFields[7]?.value || "No vouch",
        inline: false
    };

    return interaction.update({
        embeds: [EmbedBuilder.from(embed).setFields(newFields)],
        components: [
            new ActionRowBuilder().addComponents(
                ButtonBuilder.from(interaction.message.components[0].components[0])
                    .setDisabled(true),

                ButtonBuilder.from(interaction.message.components[0].components[1]),

                ButtonBuilder.from(interaction.message.components[0].components[2])
            )
        ]
    });
}

if (action === "approve") {
    const userId = parts[1];

    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (!member.roles.cache.has(config.roles.headAdmin)) {
        return interaction.reply({
            content: "❌ Head Admin only.",
            ephemeral: true
        });
    }

    const target = await interaction.guild.members.fetch(userId);

    await target.roles.add(config.serverRoles.citizen).catch(() => {});
    await target.roles.remove(config.serverRoles.unverified).catch(() => {});
    await target.setNickname(fields[2].value).catch(() => {});

    const updated = EmbedBuilder.from(embed)
        .setColor("Green")
        .setFields(
            ...fields.slice(0, 4),
            { name: "Status", value: "Approved", inline: true },
            { name: "Reviewed By", value: `${interaction.user}`, inline: true },
            { name: "Reviewed At", value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: true },
            fields[7]
        );

    return interaction.update({
        embeds: [updated],
        components: []
    });
}

if (action === "deny") {
    const updated = EmbedBuilder.from(embed)
        .setColor("Red")
        .setFields(
            ...fields.slice(0, 4),
            { name: "Status", value: "Denied", inline: true },
            { name: "Reviewed By", value: `${interaction.user}`, inline: true },
            { name: "Reviewed At", value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: true },
            { name: "❌ Vouched By", value: fields[7]?.value || "No vouch", inline: false }
        );

    return interaction.update({
        embeds: [updated],
        components: []
    });
}

});

client.login(process.env.TOKEN);