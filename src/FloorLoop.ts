import { Creature } from "./Creature";
import { Grid } from "./Grid";
import { LoopMapGen } from "./LoopMapGen";
import { game } from "./main";
import { BuildingKind, Tile } from "./Tile";
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

        game.player().x = this.loop_start[0];
        game.player().y = this.loop_start[1];
    }

    public player_tile(): Tile {
        const loc = this.path[this.player_tile_index];
        return this.tiles.get(loc[0], loc[1]);
    }

    /**
     * Returns true if looped.
     */
    public advance_player(): boolean {
        const did_loop = ++this.player_tile_index >= this.path.length;

        if (did_loop) {
            this.player_tile_index = 0;
            this.loop_count_++;
        }

        game.player().x = this.player_tile().x();
        game.player().y = this.player_tile().y();

        return did_loop;
    }

    public loop_count(): number {
        return this.loop_count_;
    }

    public spawn_enemies_in_random_location(enemies: Array<Creature>) {
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
        
        for (const enemy of enemies) {
            enemy.floor = this;
            enemy.x = loc[0];
            enemy.y = loc[1];
            this.enemies.push(enemy);
        }
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

    public tile_at(x: number, y: number): Tile {
        return this.tiles.get(x, y);
    }

    public render(renderer: CanvasRenderingContext2D): void {
        for (let x = 0; x < this.tiles.width(); x++) {
            for (let y = 0; y < this.tiles.height(); y++) {
                this.tiles.get(x, y).render(renderer);
            }
        }

        const player = game.player();
        const player_tile = this.player_tile();

        for (const [x, y] of this.path) {
            const enemies = this.enemies_at(x, y).reverse();
            const is_fight = x == player_tile.x() && y == player_tile.y();
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                if (enemy.dead()) {
                    continue;
                }
                if (is_fight) {
                    enemy.render_fight_right(renderer, i, enemies.length);
                } else {
                    enemy.render_formation_center(renderer, i, enemies.length);
                }
            }
        }

        if (player_tile.building() == BuildingKind.Camp ||
                this.enemies_at(player_tile.x(), player_tile.y()).length > 0) {
            player.render_fight_left(renderer);
        } else {
            player.render_center(renderer);
        }
    }
}
