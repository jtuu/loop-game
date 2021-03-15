import { Grid } from "./Grid";
import { MapGen, vn_neighborhood } from "./MapGen";
import { BuildingKind, TerrainKind, Tile } from "./Tile";
import { Vec2 } from "./utils";

type LoopMapGenResult = {
    tiles: Grid<Tile>;
    path: Array<Vec2>;
    loop_start: Vec2;
};

export class LoopMapGen extends MapGen {
    constructor(protected size: number) {
        super(size, size);
    }

    public generate(): LoopMapGenResult {
        const padding = 2;
        const inner_size = this.size - padding * 2;

        const cx = Math.floor(this.size / 2);
        const cy = cx;
        const r = Math.floor(inner_size / 2);
        const empty_value = 0;
        const floor_value = 1;

        this.fill(empty_value);
        
        // Create loop shape
        this.noisy_circle(cx, cy, r, 1, 0.5, floor_value);

        const smooth_amount = Math.max(1, this.size / 3);
        for (let i = 0; i < smooth_amount; i++) {
            this.rule_smooth(empty_value, floor_value);
        }

        const cut_shape = this.copy_values();

        this.rule_grow();
        this.subtract(cut_shape);

        // Ensure loop is pathable
        let path: Array<Vec2> = [];
        let pathable = false;
        let loop_start: Vec2 = [0, 0];

        // Work around rare bug where we fail to find a path depending on the starting location
        let i = 0;
        while (!pathable && path.length < this.size && ++i < 1000) {
            // Pick loop starting poing
            const rx = Math.floor(Math.random() * this.size);
            const ry = Math.floor(Math.random() * this.size);
            loop_start = this.find_nearest(rx, ry, floor_value);
            
            // Init pathfinding
            path = [loop_start];
            const frontier: Array<Vec2> = [];
            const came_from: Array<[Vec2, Vec2 | null]> = [[loop_start, null]];

            let cur: Vec2 | undefined = undefined;
            for (const [ox, oy] of vn_neighborhood) {
                const nx = loop_start[0] + ox;
                const ny = loop_start[1] + oy;

                if (this.read_grid.get(nx, ny) == floor_value) {
                    cur = [nx, ny];
                    break;
                }
            }

            if (!cur) {
                throw new Error("Loop start has no valid neighbors");
            }

            came_from.push([cur, loop_start]);

            // Search path
            do {
                let num_unvisited_neighbors = 0;
                let neighboring_start = false;
                for (const [ox, oy] of vn_neighborhood) {
                    const nx = cur[0] + ox;
                    const ny = cur[1] + oy;

                    if (!this.read_grid.within_bounds(nx, ny) || this.read_grid.get(nx, ny) != floor_value) {
                        continue;
                    }

                    let found = false;
                    for (const [[x, y], _] of came_from) {
                        if (nx == x && ny == y) {
                            found = true;
                            break;
                        }
                    }

                    if (!found) {
                        const n: Vec2 = [nx, ny];
                        frontier.push(n);
                        came_from.push([n, cur]);
                        num_unvisited_neighbors++;
                    }

                    if (nx == loop_start[0] && ny == loop_start[1]) {
                        neighboring_start = true;
                    }
                }

                if (num_unvisited_neighbors == 0 && neighboring_start) {
                    pathable = true;
                    came_from.push([loop_start, cur]);
                    break;
                }

                cur = frontier.pop();
            } while (cur);

            // Remove everything and add back only path tiles
            this.fill(empty_value);

            // Construct path
            construct_path:
            while (true) {
                const next = path[path.length - 1];
                this.read_grid.set(next[0], next[1], floor_value);

                for (const [to, from] of came_from) {
                    if (next[0] == to[0] && next[1] == to[1]) {
                        if (from) {
                            if (from[0] == loop_start[0] && from[1] == loop_start[1]) {
                                break construct_path;
                            }
                            path.push(from);
                            break;
                        }
                    }
                }
            }
        }

        if (!pathable) {
            throw new Error("Malformed loop");
        }

        // Create tiles
        const tiles = new Grid<Tile>(this.size, this.size);

        for (let x = 0; x < this.width_; x++) {
            for (let y = 0; y < this.height_; y++) {
                let kind = TerrainKind.Empty;

                switch (this.read_grid.get(x, y)) {
                    case empty_value:
                        kind = TerrainKind.Empty;
                        break;
                    case floor_value:
                        kind = TerrainKind.Floor;
                        break;
                    default:
                        kind = TerrainKind.Error;
                        break;
                }

                const tile = new Tile(x, y, kind);
                tiles.set(x, y, tile);
            }
        }

        tiles.set(loop_start[0], loop_start[1], new Tile(loop_start[0], loop_start[1], TerrainKind.Floor, BuildingKind.Camp));

        return {
            tiles,
            path,
            loop_start
        };
    }
}
