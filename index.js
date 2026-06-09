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

const channel = await client.channels
    .fetch(config.monitoring.channelId)
    .catch(() => null);

if (!channel) {
    return console.log("Monitoring channel not found.");
}

const monitorMessage = await channel.send({
    embeds: [
        new EmbedBuilder()
            .setColor("Blue")
            .setTitle("🖥️ Server Monitoring")
            .setDescription("Loading...")
    ]
});

setInterval(async () => {
    const mem = process.memoryUsage();

    const rss = (mem.rss / 1024 / 1024).toFixed(2);
    const heapUsed = (mem.heapUsed / 1024 / 1024).toFixed(2);
    const heapTotal = (mem.heapTotal / 1024 / 1024).toFixed(2);
    const external = (mem.external / 1024 / 1024).toFixed(2);

    const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);

    const uptime = process.uptime();

    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const mins = Math.floor((uptime % 3600) / 60);

    const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("🖥️ Railway Live Monitoring")
        .setThumbnail(config.images.thumbnail)

        .addFields(
            {
                name: "🤖 Bot",
                value: client.user.tag,
                inline: true
            },
            {
                name: "📡 Ping",
                value: `${client.ws.ping}ms`,
                inline: true
            },
            {
                name: "🟢 Status",
                value: "Online",
                inline: true
            },

            {
                name: "🏠 Servers",
                value: `${client.guilds.cache.size}`,
                inline: true
            },
            {
                name: "👥 Users Cached",
                value: `${client.users.cache.size}`,
                inline: true
            },
            {
                name: "🔧 Channels Cached",
                value: `${client.channels.cache.size}`,
                inline: true
            },

            {
                name: "💾 RAM Usage",
                value: `${rss} MB`,
                inline: true
            },
            {
                name: "📦 Heap Used",
                value: `${heapUsed} MB`,
                inline: true
            },
            {
                name: "📂 Heap Total",
                value: `${heapTotal} MB`,
                inline: true
            },

            {
                name: "🌐 External Memory",
                value: `${external} MB`,
                inline: true
            },
            {
                name: "🖥️ CPU Cores",
                value: `${os.cpus().length}`,
                inline: true
            },
            {
                name: "⚙️ Architecture",
                value: os.arch(),
                inline: true
            },

            {
                name: "🧠 Host RAM",
                value: `${freeRam} GB Free / ${totalRam} GB`,
                inline: true
            },
            {
                name: "📦 Node.js",
                value: process.version,
                inline: true
            },
            {
                name: "🐧 Platform",
                value: os.platform(),
                inline: true
            },

            {
                name: "⏱️ Uptime",
                value: `${days}d ${hours}h ${mins}m`,
                inline: false
            }
        )

        .setFooter({
            text: "Updates every 30 seconds"
        })
        .setTimestamp();

    await monitorMessage.edit({
        embeds: [embed]
    }).catch(() => {});
}, 30000);

/* =========================================================
   MESSAGE CREATE
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
                { name: "☑️ Vouched By", value: vouched, inline: false }
            )
            .setFooter({ text: `User ID: ${message.author.id}` });

        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete().catch(() => {});
        return;
    }

/* ================= ROLE / UNROLE ================= */

const nameMatch = content.match(/Name:\s*([^\n]+)/i);
const approvedByMatch = content.match(/Approved\s*By:\s*<@!?(\d+)>/i);

if (!nameMatch || !approvedByMatch) return;

let type = null;
let roleId = null;

/*
FORMAT:

ROLE REQUEST
Name:
Role: @Role
Approved By: @User

UNROLE REQUEST
Name:
Unrole: @Role
Approved By: @User
*/

if (message.channel.id === config.requests.unroleRequestChannelId) {

    const match = content.match(/Unrole:\s*<@&(\d+)>/i);

    if (!match) return;

    type = "unrole";
    roleId = match[1];

} else {

    const match = content.match(/Role:\s*<@&(\d+)>/i);

    if (!match) return;

    type = "role";
    roleId = match[1];
}

const embed = new EmbedBuilder()
    .setTitle(
        type === "unrole"
            ? "❌ Unrole Request"
            : "✅ Role Request"
    )
    .setColor("#ffaa00")
    .setThumbnail(config.images.thumbnail)
    .addFields(
        {
            name: "Requester",
            value: `${message.author}`,
            inline: true
        },
        {
            name: "IGN",
            value: nameMatch[1].trim(),
            inline: true
        },
        {
            name: type === "unrole"
                ? "Unrole"
                : "Role",
            value: `<@&${roleId}>`,
            inline: true
        },
        {
            name: "Approved by",
            value: "⏳ Waiting for approval",
            inline: false
        },
        {
            name: "Approval Status",
            value: "⏳ Waiting for Admin Approval",
            inline: false
        }
    )
    .setFooter({
        text: `Requested by: ${message.author.username}`
    })
    .setTimestamp();

const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setCustomId(
            `nonadmin_${type}_${message.author.id}_${roleId}_${approvedByMatch[1]}`
        )
        .setLabel("Vouch")
        .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
        .setCustomId(
            `admin_${type}_${message.author.id}_${roleId}`
        )
        .setLabel("Approve")
        .setStyle(ButtonStyle.Success)
);

await message.channel.send({
    embeds: [embed],
    components: [row]
});

await message.delete().catch(() => {});
});

/* =========================================================
   INTERACTION CREATE
========================================================= */

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;

    const embed = interaction.message.embeds[0];
    if (!embed) return;

    const fields = [...embed.fields];
    const parts = interaction.customId.split("_");

    const action = parts[0];

    /* ================= VOUCH ================= */

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
            embeds: [EmbedBuilder.from(embed).setFields(newFields)]
        });
    }

    /* ================= WHITELIST APPROVE ================= */

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

    /* ================= DENY ================= */

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

        return interaction.update({ embeds: [updated] });
    }

    /* ================= ROLE / UNROLE ================= */

    if (action === "nonadmin" || action === "admin") {
        const roleType = parts[1];
        const userId = parts[2];
        const roleId = parts[3];

        const member = await interaction.guild.members.fetch(userId);

        /* NON ADMIN */
        if (action === "nonadmin") {
            const approverId = parts[4];

            if (interaction.user.id !== approverId) {
                return interaction.reply({
                    content: "❌ Only assigned Vouch approve.",
                    ephemeral: true
                });
            }

            const updatedEmbed = EmbedBuilder.from(embed);

            const newFields = [...fields];
            newFields[3] = {
                name: "Approved by",
                value: `${interaction.user}`,
                inline: false
            };

            updatedEmbed.setFields(newFields);

            return interaction.update({ embeds: [updatedEmbed] });
        }

/* ADMIN */
if (action === "admin") {

    if (!interaction.member.roles.cache.has(config.roles.admin)) {
        return interaction.reply({
            content: "❌ Admin only.",
            ephemeral: true
        });
    }

    if (roleType === "role") {
        await member.roles.add(roleId).catch(() => {});
    }

    if (roleType === "unrole") {
        await member.roles.remove(roleId).catch(() => {});
    }

    const newFields = [...fields];

    newFields[4] = {
        name: "Approval Status",
        value: `✅ Approved by ${interaction.user}\n🕒 <t:${Math.floor(Date.now() / 1000)}:F>`,
        inline: false
    };

    const updatedEmbed = EmbedBuilder.from(embed)
        .setColor("Green")
        .setFields(newFields);

    return interaction.update({
        embeds: [updatedEmbed],
        components: []
    });
}

    }
});

client.login(process.env.TOKEN);