const grpc = require('grpc')
const path = require('path')

// this is the part where we set some config and load the protobuf schema
const uri = 'localhost:50051'
const proto = grpc.load(path.join(__dirname, '01_reqrep.proto'))
const messagething = proto.messagething

// now let's create a server and define which methods are available for rpc
// then create some credentials for our secure http2 connection and boot it up
const serverCreds = grpc.ServerCredentials.createInsecure()
const methods = { sayHello: sayHello }
const server = new grpc.Server()
server.addProtoService(messagething.MessageThing.service, methods)
server.bind(uri, serverCreds)
server.start()

// so whenever .sayHello is called over the network we log the request and
// reply with a message
function sayHello (call, done) {
  console.log('request: ', call.request)
  done(null, { msg: 'yeah whats happening?' })
}

// now let's create the client with some encrypted credentials. They're
// insecure because we're signing them rather than having some third party
// authority create them and promise us it's cool (e.g. "certificate
// authority")
const clientCreds = grpc.credentials.createInsecure()
const client = new messagething.MessageThing(uri, clientCreds)

// now send a message as defined in our protobuf schema to .sendHello on the
// server. Listen for the reply, log it and then shut down the server. The
// client doesn't pool connections so is shut down the second it's done with
// the request
const msg = { msg: 'oi mate' }
client.sayHello(msg, function (err, res) {
  if (err) throw err
  console.log('all ok: ', res)

  server.tryShutdown(function (err, res) {
    if (err) throw err
    console.log('server shut down')
  })
})
