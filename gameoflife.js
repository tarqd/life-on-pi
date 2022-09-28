import { variation } from './ld.js'


export default class GameOfLife {
    constructor({ height, width, variation }) {
        Object.assign(this, { height, width })
        this.reset()
    }

    cellIndexToCoordinates(index) {
        const x = index % this.width
        const y = (index - x) / this.width
        return [x, y]
    }
    cellCoordinatesToIndex(x, y) {
        return (y * this.width) + x
    }

    getCell(x, y) {
        return this.state[this.cellCoordinatesToIndex(x, y)]
    }

    async step() {
        this.state = await Promise.all(
            this.state.map(async ({ alive, since }, index) => {
                const liveNeighbors = this.neighborsForCellByIndex(index)
                    .map(i => this.state[i])
                    .reduce((liveCount, cell) => {
                        return liveCount + cell.alive
                    }, 0)

                const [column, row] = this.cellIndexToCoordinates(index)
                
                const defaultState = liveNeighbors === 3 || (alive && liveNeighbors === 2)
                const nextState = await variation('config-cell-alive', this.cellUser({
                    column, row,
                    alive,
                    since,
                    neighbors: liveNeighbors,
                    age: Math.min(0, this.iteration - since),
                }), defaultState)

                return {
                    alive: nextState,
                    since: nextState == alive ? since : this.iteration
                }

            }))
        // this.state = nextState
        this.iteration += 1
    }
    neighborsForCellByIndex(index) {
        return this.neighborsForCell(...this.cellIndexToCoordinates(index))
    }

    neighborsForCell(x,y) {
        const { height, width } = this
        const totalCells = height * width
        
        return [
            // west
            [x - 1, y],
            // east
            [x + 1, y],
            // south
            [x, y - 1],
            // north
            [x, y + 1],
            // north west
            [x - 1, y + 1],
            // north east
            [x + 1, y + 1],
            // south west
            [x - 1, y - 1],
            // south east,
            [x + 1, y - 1]

        ].map(([x, y]) => this.cellCoordinatesToIndex((x + width) % width, ((y + height) % height)))

    }

    cellUser(cell) {
        return {
            key: `cell/${cell.column}_${cell.row}`,
            secondary: this.seed,
            name: `Cell: ${cell.column} , ${cell.row}`,
            anonymous: true,
            custom: Object.assign({
                alive: false,
                since: 0,
                liveNeighbors: null,
                deadNeighbors: null,
                iteration: this.iteration,
                age: Math.min(0, this.iteration - (cell.since || 0))
            }, cell)
        }
    }

    reset() {
        this.state = []
        this.iteration = 0
        this.seed = +(new Date())
        const { height, width } = this
        const totalCells = height * width

        for (let i = 0; i < totalCells; i++) {
            const [column, row] = this.cellIndexToCoordinates(i, height, width)
            const cellState = {
                alive: false,
                since: 0,
            }
            this.state[i] = cellState
        }

    }
}