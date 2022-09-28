import { default as GOL } from './gameoflife.js';
import {jest, test} from '@jest/globals'

const HEIGHT = 8
const WIDTH = 8

function createGame() {
  return new GOL({ height: HEIGHT, width: WIDTH });
}




test('initial state is all dead', () => {
  const game = createGame();
  // game.reset()

  const expected = Array.from(new Array(HEIGHT * WIDTH).fill({ alive: false, since: 0 }))
  expect(game.state).toEqual(expected);
});

test('cellIndexToCoordinates', () => {
  const game = createGame();
  const expected = [
    [0, [0, 0]],
    [1, [1, 0]],
    [8, [0, 1]],
    [(HEIGHT * WIDTH) - WIDTH, [0, HEIGHT - 1]],
  ]
  const results = expected.map(([index, coords]) => [index, game.cellIndexToCoordinates(index)])
  expect(results).toEqual(expected)
})

test('cellCoordinatesToIndex', () => {
  const game = createGame();
  const expected = [
    [0, [0, 0]],
    [1, [1, 0]],
    [8, [0, 1]],
    [(HEIGHT * WIDTH) - WIDTH, [0, HEIGHT - 1]],
  ]
  const results = expected.map(([index, coords]) => [game.cellCoordinatesToIndex(...coords), coords])
  expect(results).toEqual(expected)
})

test('getCell', () => {
  const game = createGame();
  expect(game.getCell(0, 1)).toBe(game.state[8])
})

test('neighborsForCell', () => {
  const game = createGame();
  const cell = game.getCell(1,1)
  const neighbors = game.neighborsForCell(1,1).map(i => game.cellIndexToCoordinates(i))
  expect(neighbors.length).toBe(8)

  expect(neighbors).toEqual([
    [0, 1],
    [2, 1],
    [1, 0],
    [1, 2],
    [0, 2],
    [2, 2],
    [0, 0],
    [2, 0]
  ]
  )
})

test('neighborsForCell wrap-around', () => {
  const game = createGame();
  const cell = game.getCell(0,0)
  const neighbors = game.neighborsForCell(0,0).map(i => game.cellIndexToCoordinates(i))
  expect(neighbors.length).toBe(8)

  expect(neighbors).toEqual([
    [7, 0],
    [1, 0],
    [0, 7],
    [0, 1],
    [7, 1],
    [1, 1],
    [7, 7],
    [1, 7]
  ]
  )
})

// Any live cell with fewer than two live neighbours dies, as if by underpopulation.
test('underpopulation', async () => {
  const game = createGame();
  game.state[0] = { alive: true, since: 0 }
  await game.step()
  expect(game.state[0]).toEqual({ alive: false, since: 0 })
  game.reset()
  game.state[0] = { alive: true, since: 0 }
  game.state[1] = { alive: true, since: 0 }
  await game.step()
  expect(game.state[0]).toEqual({ alive: false, since: 0 })
  expect(game.state[1]).toEqual({ alive: false, since: 0 })
})
// Any live cell with two or three live neighbours lives on to the next generation.
test('survive', async () => {
  const game = createGame();
  game.state[0] = { alive: true, since: 0 }
  game.state[1] = { alive: true, since: 0 }
  game.state[2] = { alive: true, since: 0 }
  await game.step()
  expect(game.state[0]).toEqual({ alive: false, since: 0 })
  expect(game.state[1]).toEqual({ alive: true, since: 0 })
  expect(game.state[2]).toEqual({ alive: false, since: 0 })
  game.reset()
  game.state[0] = { alive: true, since: 0 }
  game.state[1] = { alive: true, since: 0 }
  game.state[8] = { alive: true, since: 0 }
  game.state[9] = { alive: true, since: 0 }
  await game.step()
  expect(game.state[0]).toEqual({ alive: true, since: 0 })
  expect(game.state[1]).toEqual({ alive: true, since: 0 })
  expect(game.state[8]).toEqual({ alive: true, since: 0 })
  expect(game.state[9]).toEqual({ alive: true, since: 0 })
})
// Any live cell with more than three live neighbours dies, as if by overpopulation.
test('overpopulation', async () => {  
  const game = createGame();
  game.state[0] = { alive: true, since: 0 }
  game.state[2] = { alive: true, since: 0 }
  game.state[9] = { alive: true, since: 0 }
  game.state[16] = { alive: true, since: 0 }
  game.state[18] = { alive: true, since: 0 }
  await game.step()
  expect(game.state[9]).toEqual({ alive: false, since: 0 })
})
//Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
test('reproduction', async () => {  
  const game = createGame();
  game.state[0] = { alive: true, since: 0 }
  game.state[2] = { alive: true, since: 0 }
  game.state[17] = { alive: true, since: 0 }
  await game.step()
  expect(game.state[9]).toEqual({ alive: true, since: 0 })
})

