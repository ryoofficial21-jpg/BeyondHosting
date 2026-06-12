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

/* ================= READY ================= */
client.once(Events.ClientReady, async () => {
    console.log(`${client.user.tag} is online!`);

    const guild = client.guilds.cache.first();
    if (!guild) return console.log("No guild found");

    await guild.commands.create({
        name: "grole",
        description: "Request a role",
        options: [
            { name: "ingame_name", type: 3, required: true },
            { name: "role", type: 8, required: true },
            { name: "approved_by", type: 6, required: true }
        ]
    });

    console.log("Slash command registered!");
});

/* ================= MESSAGE SYSTEM ================= */
client.on(Events.MessageCreate, async (message) => {
    if (!message.guild || message.author.bot) return;

    const content = message.content;

    if (
        content.includes("Name:") &&
        content.includes("Steam Link:") &&
        content.includes("Vouched by:")
    ) {
        const lines = content.split('\n');

        const name = lines.find(x => x.startsWith("Name:"))?.replace("Name:", "").trim() || "N/A";
        const steam = lines.find(x => x.startsWith("Steam Link:"))?.replace("Steam Link:", "").trim() || "N/A";
        const vouched = lines.find(x => x.startsWith("Vouched by:"))?.replace("Vouched by:", "").trim() || "No vouch";

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
            .setTitle(`Whitelist Request`)
            .setThumbnail(config.images.thumbnail)
            .addFields(
                { name: "Applicant", value: `${message.author}`, inline: true },
                { name: "Name", value: name, inline: true },
                { name: "Steam Link", value: steam, inline: false },
                { name: "Vouched By", value: vouched, inline: false }
            );

        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete().catch(() => {});
    }
});

/* ================= INTERACTIONS ================= */
client.on(Events.InteractionCreate, async (interaction) => {

    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "grole") {

            const ign = interaction.options.getString("ingame_name");
            const role = interaction.options.getRole("role");
            const voucher = interaction.options.getUser("approved_by");

            if (!voucher) {
                return interaction.reply({ content: "Invalid voucher", ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor("#00ff44")
                .setTitle("Role Request")
                .addFields(
                    { name: "Requester", value: `${interaction.user}`, inline: true },
                    { name: "IGN", value: ign, inline: true },
                    { name: "Role", value: `${role}`, inline: true },
                    { name: "Approved By", value: `${voucher}`, inline: false }
                );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`rolevouch_${voucher.id}_${interaction.user.id}`)
                    .setLabel("Vouch Approve")
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId(`roledeny_${interaction.user.id}`)
                    .setLabel("Deny")
                    .setStyle(ButtonStyle.Danger)
            );

            return interaction.reply({ embeds: [embed], components: [row] });
        }
    }

    if (!interaction.isButton()) return;
    if (!interaction.guild) return;

    const parts = interaction.customId.split("_");
    const action = parts[0];

    const member = await interaction.guild.members.fetch(interaction.user.id);

    /* ================= VOUCH ================= */
    if (action === "vouch") {
        const vouchUserId = parts[1];

        if (interaction.user.id !== vouchUserId) {
            return interaction.reply({ content: "Not your voucher", ephemeral: true });
        }

        return interaction.update({ content: "Vouched successfully", components: [] });
    }

    /* ================= APPROVE ================= */
    if (action === "approve") {

        const userId = parts[1];

        if (!member.roles.cache.has(config.roles.headAdmin)) {
            return interaction.reply({ content: "Head Admin only", ephemeral: true });
        }

        const target = await interaction.guild.members.fetch(userId);

        await target.roles.add(config.serverRoles.citizen);
        await target.roles.remove(config.serverRoles.unverified);

        return interaction.update({ content: "Approved", components: [] });
    }

    /* ================= DENY ================= */
    if (action === "deny") {
        return interaction.update({ content: "Denied", components: [] });
    }

    /* ================= ROLE VOUCH ================= */
    if (action === "rolevouch") {
        const voucherId = parts[1];

        if (interaction.user.id !== voucherId) {
            return interaction.reply({ content: "Not authorized", ephemeral: true });
        }

        return interaction.update({ content: "Role approved by voucher", components: [] });
    }

    /* ================= ROLE DENY ================= */
    if (action === "roledeny") {
        return interaction.update({ content: "Role Request Denied", components: [] });
    }
});

client.login(process.env.TOKEN);