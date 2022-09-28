import { default as express } from 'express'
import { conf, sleep } from './app.js'


const app = express();
let server = null;
app.use(express.static('public'));
app.get('/stream', asyncHandler(handleStream))

const clients = new Set()

export function getApplication() {
    return app
}

export async function startServer() {
    const {PORT, HOST} = process.env

    
    return new Promise((resolve, reject) => {

         server = app.listen(+PORT || 0, HOST || '127.0.0.1', () => {
            const address = server.address()
            console.log(`Listening on http://${address.address}:${address.port}`)
            app.off('error', reject)
            resolve()
        })
        app.once('error', reject)
    })
}

export function stopServer() {
   return Promise.any([killClients(), sleep(500)]).then(closeApplication)
}

function killClients() {
    return Promise.all([...clients].map(kill))
}

function closeApplication() {
    console.log("closing application....")
    return new Promise((resolve, reject) => {
        server.close((err) => {
            console.log('i am close')
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

function asyncHandler(fn) {
    return function (req, res, next) {
        return Promise.resolve(fn(req, res, next)).catch(next);
    };
}

async function handleStream(req, res) {
    register(res)
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    })
    res.flushHeaders()

    res.on('close', () => {
        clients.delete(res)
    })

}
export function setGame(game) {
    app.set('game', game)
}

export function broadcast(event, data) {
    clients.forEach((client) => {
        client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    })
}

export function broadcastState() {
    const {event, data} = createGameStateEvent()
    return broadcast(event, data)

}

function kill(client) {
    return new Promise((resolve, reject) => {
        console.log('in kill')
        client.end('event: kill\n\n', (err) => {
            if (err) reject(err)
            else resolve()
        })
    })
}

export function sendHeartbeat() {
    clients.forEach((client) => {
        client.write(':\n\n')
        client.flush()
    })
}

function createGameStateEvent() {
    const game = app.get('game')
    return {
        event: 'state',
        data: {
            cells: game.state,
            iteration: game.iteration,
            width: game.width,
            height: game.height
        }
    }
}

function register(client) {
    const cleanup = () => unregister(client)
    clients.add(client)

    client.on('close', () => unregister(client))
    client.on('error', (e) => console.error('client error: ', e))
}

function unregister(client) {
    clients.delete(client)
    console.debug('client disconnected: ', client.add)
}
