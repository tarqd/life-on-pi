import { default as GOL } from './gameoflife.js'
import { variation , initialize, getLDClient , getLDConfig} from './ld.js'
import { getApplication, setGame , startServer, stopServer, sendHeartbeat, broadcastState } from './server.js';
import { conf, sleep } from './app.js'



async function main() {
    const client = initialize(...getLDConfig())
    await client.waitForInitialization()
    const app = getApplication()
    const game = new GOL(
        {
            height: await conf('number-of-rows', 8),
            width: await conf('number-of-columns', 8)
        }
    )
    setGame(game)
    await startServer()

    let running = true 

    async function startHeartbeat() {
        while (running) {
            sendHeartbeat()
            await sleep(await conf('heartbeat-interval', 3 * 60 * 1000))
        }
        console.log('done heartbeat')
    }

    async function runGame() {
        while(running) {
            game.step()
            broadcastState()
            await sleep(1000 / await conf('steps-per-second', 1))
        }
        console.log('done running')
    }

    const heartbeat = startHeartbeat()
    const runner = runGame()
    
    await waitForShutdown()
    console.log("shutting down..")
    running = false
    
    await stopServer()
    console.log('done with stop')
    client.close()
    process.exit(0)
    
}



function waitForShutdown() {
    return new Promise(resolve => {
        process.on('SIGINT', resolve)
        process.on('SIGTERM', resolve)
    })
}

main().finally(() => {
    console.log('goodbye.')
}).catch(err => {
    console.error(err)
    process.exit(1)
})