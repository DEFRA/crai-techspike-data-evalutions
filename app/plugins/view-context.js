module.exports = {
  plugin: {
    name: 'view-context',
    register: (server, _) => {
      server.ext('onPreResponse', function (request, h) {
        const response = request.response

        if (response.variety === 'view') {
          const ctx = response.source.context || {}

          ctx.serviceName = 'crai techspike data evaluations'
          ctx.serviceUrl = '/'

          response.source.context = ctx
        }

        return h.continue
      })
    }
  }
}
