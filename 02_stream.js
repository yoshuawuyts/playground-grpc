const grpc = require('grpc')
const path = require('path')
const pump = require('pump')

const uri = 'localhost:50051'
const proto = grpc.load(path.join(__dirname, '02_stream.proto'))
const messageproto = proto.messages

const serverCreds = grpc.ServerCredentials.createInsecure()
const methods = { echoHello: echoHello }
const server = new grpc.Server()
server.addProtoService(messageproto.MessageThing.service, methods)
server.bind(uri, serverCreds)
server.start()

function echoHello (call) {
  pump(call, call)
}

const clientCreds = grpc.credentials.createInsecure()
const client = new messageproto.MessageThing(uri, clientCreds)

const msg = { msg: 'oi mate' }
const ws = client.echoHello()
ws.on('data', console.log)
ws.on('end', () => {
  server.tryShutdown(function (err, res) {
    if (err) throw err
    console.log('server shut down')
  })
})
ws.write(msg)
ws.write(msg)
ws.write(msg)
ws.end()
