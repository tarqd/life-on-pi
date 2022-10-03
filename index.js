import { default as GOL } from './gameoflife.js'
import { variation , initialize, getLDClient , getLDConfig} from './ld.js'
import { conf,createContext, sleep } from './app.js'

import {default as neopixel } from 'rpi-ws281x-native'



async function main() {
    const client = initialize(...getLDConfig())
    await client.waitForInitialization()
    const game = new GOL(
        {
            height: await conf('number-of-rows', 8),
            width: await conf('number-of-columns', 8)
        }
    )

    const options = {
        dma: 10,
        freq: 800000,
        gpio: 18,
        invert: false,
        brightness: await conf('led-brightness', 100),
        stripType: neopixel.stripType.WS2812
      };

      const channel = neopixel(game.height * game.width, options);
      const pixels = channel.array;
   



    let running = true 
    

    async function renderPixels() {
	const isSerpentine = await variation('enable-serpentine-matrix-remap', createContext(), false);

        for(let i = 0; i < game.state.length; i++) {
            const cell = game.state[i];
	    const [x,y] = game.cellIndexToCoordinates(i)
            const color = await variation(`config-cell-color`, game.cellUser({row: y, column: x, age: game.iteration - cell.since, ...cell}), cell.alive ? 0x00ff00 : 0x000000)
            const colorNumber = typeof color == 'string' ? parseInt(color, 16) : color

            // Seperentine matrixes require remapping on even rows
	    const needsRemap = isSerpentine && y % 2 == 0
	    if (needsRemap) {
		const remapX = (game.width - x - 1) % game.width
		const remapIndex = game.cellCoordinatesToIndex(remapX, y)
		pixels[remapIndex] = colorNumber
	    } else {
            	pixels[i] = colorNumber
	    }
        }
	neopixel.render()
    }
    async function runGame() {
        while(running) {
            //if (await conf('game-running', true)) {
                game.step()
            //}
	    
	    await renderPixels()
	    const population = game.state.filter(x => x.alive).length
	    if(population == 0) game.reset()
            await sleep(1000 / await conf('steps-per-second', 1))
        }
        console.log('done running')
    }

    const runner = runGame()
    
    await waitForShutdown()
    console.log("shutting down..")
    running = false
    
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
