module.exports = {
  plugin: require('@hapi/yar'),
  options: {
    name: 'crai_techspike_data_evaluations',
    maxCookieSize: 1024,
    storeBlank: true,
    cache: {
      expiresIn: 1000 * 3600 * 24 * 3
    },
    cookieOptions: {
      isHttpOnly: true,
      isSameSite: 'Lax',
      isSecure: true,
      password: 'password0123456789password0123456789password0123456789',
      ttl: 1000 * 3600 * 24 * 3
    }
  }
}
