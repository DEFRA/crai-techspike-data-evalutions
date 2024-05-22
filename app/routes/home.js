module.exports = {
  method: 'GET',
  path: '/',
  options: {
    handler: async (request, h) => {
      return { status: '200 ok' }
    }
  }
}