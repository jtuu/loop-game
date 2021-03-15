import { tile_px_size } from "./Game";
import { Grid } from "./Grid";
import { LoopMapGen } from "./LoopMapGen";
import { MapGen } from "./MapGen";
import { Tile, TerrainKind, BuildingKind } from "./Tile";
import { Vec2 } from "./utils";

export class FloorLoop {
    protected tiles: Grid<Tile>;
    protected path: Array<Vec2>;
    protected player_tile_index: number;

    constructor(size: number) {
        const gen = new LoopMapGen(size);
        let result;
        result = gen.generate();
        this.tiles = result.tiles;
        this.path = result.path;
        this.player_tile_index = 0;
    }

    public player_tile(): Tile {
        const loc = this.path[this.player_tile_index];
        return this.tiles.get(loc[0], loc[1]);
    }

    public advance_player(): void {
        if (++this.player_tile_index >= this.path.length) {
            this.player_tile_index = 0;
        }
    }

    public render(renderer: CanvasRenderingContext2D): void {
        for (let x = 0; x < this.tiles.width(); x++) {
            for (let y = 0; y < this.tiles.height(); y++) {
                switch (this.tiles.get(x, y).terrain()) {
                    case TerrainKind.Empty:
                        renderer.fillStyle = "hsl(0, 0%, 10%)";
                        break;
                    case TerrainKind.Floor:
                        renderer.fillStyle = "hsl(30, 35%, 35%)";
                        break;
                    case TerrainKind.Error:
                        renderer.fillStyle = "red";
                        break;
                }

                renderer.fillRect(x * tile_px_size, y * tile_px_size, tile_px_size, tile_px_size);
            }
        }
    }
}
