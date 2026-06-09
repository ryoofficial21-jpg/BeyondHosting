module.exports = {
  token: process.env.TOKEN,
  clientId: '1513530505734389862',

  /* =========================================================
     ROLES (PERMISSIONS)
  ========================================================= */

  roles: {
    // WHITELIST APPROVAL ONLY
    headAdmin: '1513509659934330890',

    // ROLE / UNROLE APPROVAL ONLY
    admin: '1513509662505304106',

    // OPTIONAL MODERATOR
    moderator: '1513509664971817020',
  },

  monitoring: {
    channelId: '1513805023941754890'
  },


  /* =========================================================
     REQUEST SETTINGS
  ========================================================= */

  requests: {
    roleRequestAdminRoleId: '1513509662505304106',
    unroleRequestChannelId: '1513509530842038363',
  },

  /* =========================================================
     VISUALS
  ========================================================= */

  images: {
    thumbnail:
      'https://media.discordapp.net/attachments/1508361405907079182/1513509171268423710/content.png?ex=6a27fcc2&is=6a26ab42&hm=85af0d2c49cfc340a1a3e8d93952761ae489cac0e3a4fd8501fca7a030d3654f&=&format=webp&quality=lossless&width=350&height=350',
  },

  /* =========================================================
     SERVER ROLES
  ========================================================= */

  serverRoles: {
    citizen: '1513509705232683068',
    unverified: '1513509723532558456',
  },
};