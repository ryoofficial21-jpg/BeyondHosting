module.exports = {
  token: process.env.TOKEN,
  clientId: '1513530505734389862',

  /* =========================================================
     ROLES (PERMISSIONS)
  ========================================================= */

  roles: {
    // WHITELIST APPROVAL ONLY
    headAdmin: '1513509662505304106',

    // ROLE REQUEST APPROVAL
    admin: '1513509662505304106',
  },

  /* =========================================================
     VISUALS
  ========================================================= */

  images: {
    thumbnail:
      'https://media.discordapp.net/attachments/1513509486462242926/1513861665421262888/content.png?ex=6a2c90cb&is=6a2b3f4b&hm=b9e443eeb703a4bb3ed35944dbdbb487b6c709eafa97da69da3e23b0e80e8746&=&format=webp&quality=lossless&width=968&height=968'
  },

  /* =========================================================
     SERVER ROLES
  ========================================================= */

  serverRoles: {
    citizen: '1513509705232683068',
    unverified: '1513509723532558456',
  }
};