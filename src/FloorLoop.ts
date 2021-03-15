import { Creature } from "./Creature";
import { tile_px_size } from "./Game";
import { Grid } from "./Grid";
import { LoopMapGen } from "./LoopMapGen";
import { game } from "./main";
import { Tile, TerrainKind, BuildingKind } from "./Tile";
import { Vec2 } from "./utils";

export class FloorLoop {
    protected tiles: Grid<Tile>;
    protected path: Array<Vec2>;
    protected loop_start: Vec2;
    protected empty_floor_tiles: Array<Vec2>;
    protected player_tile_index = 0;
    protected loop_count_: number = 0;
    protected enemies: Array<Creature> = [];

    constructor(size: number) {
        const gen = new LoopMapGen(size);
        const result = gen.generate();

        this.tiles = result.tiles;
        this.path = result.path;
        this.loop_start = result.loop_start;

        this.empty_floor_tiles = this.path.map(loc => [loc[0], loc[1]]);
        
        const start_idx = this.empty_floor_tiles.findIndex(loc => loc[0] == this.loop_start[0] && loc[1] == this.loop_start[1]);
        this.empty_floor_tiles.splice(start_idx, 1);
    }

    public player_tile(): Tile {
        const loc = this.path[this.player_tile_index];
        return this.tiles.get(loc[0], loc[1]);
    }

    /**
     * Returns true if looped.
     */
    public advance_player(): boolean {
        if (++this.player_tile_index >= this.path.length) {
            this.player_tile_index = 0;
            this.loop_count_++;
            return true;
        }
        return false;
    }

    public loop_count(): number {
        return this.loop_count_;
    }

    public spawn_enemy_in_random_location(enemy: Creature) {
        if (this.empty_floor_tiles.length < 1) {
            return;
        }

        const player_tile = this.player_tile();

        if (this.empty_floor_tiles.length == 1 &&
            this.empty_floor_tiles[0][0] == player_tile.x() &&
            this.empty_floor_tiles[0][1] == player_tile.y()) {
            return;
        }

        let loc_idx = Math.floor(Math.random() * this.empty_floor_tiles.length);
        let loc = this.empty_floor_tiles[loc_idx];
        while (loc[0] == player_tile.x() && loc[1] == player_tile.y()) {
            loc_idx = Math.floor(Math.random() * this.empty_floor_tiles.length);
            loc = this.empty_floor_tiles[loc_idx];
        }

        this.empty_floor_tiles.splice(loc_idx, 1);
        
        enemy.floor = this;
        enemy.x = loc[0];
        enemy.y = loc[1];
        this.enemies.push(enemy);
    }

    public unspawn_enemy(enemy: Creature) {
        const idx = this.enemies.indexOf(enemy);
        enemy.floor = null;
        this.enemies.splice(idx, 1);

        this.empty_floor_tiles.push([enemy.x, enemy.y]);
    }

    public enemies_at(x: number, y: number): Array<Creature> {
        const enemies = [];

        for (const enemy of this.enemies) {
            if (enemy.x == x && enemy.y == y) {
                enemies.push(enemy);
            }
        }

        return enemies;
    }

    public render(renderer: CanvasRenderingContext2D): void {
        const player_sprite = game.get_sprite("sprites/player.png");
        const camp_sprite = game.get_sprite("sprites/camp.png");

        for (let x = 0; x < this.tiles.width(); x++) {
            for (let y = 0; y < this.tiles.height(); y++) {
                const tile = this.tiles.get(x, y);
                const render_x = x * tile_px_size;
                const render_y = y * tile_px_size;

                switch (tile.terrain()) {
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

                renderer.fillRect(render_x, render_y, tile_px_size, tile_px_size);

                switch (tile.building()) {
                    case BuildingKind.Camp:
                        renderer.drawImage(camp_sprite, render_x, render_y);
                        break;
                }
            }
        }

        for (const enemy of this.enemies) {
            enemy.render(renderer);
        }

        const player_tile = this.player_tile();
        renderer.drawImage(player_sprite, player_tile.x() * tile_px_size, player_tile.y() * tile_px_size);
    }
}
