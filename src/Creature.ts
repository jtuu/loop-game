import { FloorLoop } from "./FloorLoop";
import { SpriteName, tile_px_size } from "./Game";
import { game } from "./main";
import { Serializable, SerializationBlacklist } from "./serialization";
import { CanvasImage } from "./utils";

const formation_sprite_margin = 1;
const formation_max_per_column = 3;
const max_per_formation = 6;

@Serializable
export class Creature {
    public x = -1;
    public y = -1;

    protected hp_: number;

    public ticks_since_attack = 0;
    public ticks_since_move = 0;

    @SerializationBlacklist protected sprite: CanvasImage;

    constructor(
        protected name_: string,
        protected base_sprite_name: SpriteName,
        protected base_max_hp: number,
        protected hit_dice: number[],
        protected base_attack_interval: number,
        protected base_movement_interval: number
    ) {
        this.hp_ = base_max_hp;
        this.sprite = game.get_sprite(this.base_sprite_name);
    }

    public take_damage(damage: number) {
        this.hp_ -= damage;
    }

    public attack_damage(): number {
        let damage = 0;

        for (const die of this.hit_dice) {
            damage += Math.floor(Math.random() * die) + 1;
        }

        return damage;
    }

    public attack_interval(): number {
        return this.base_attack_interval;
    }

    public movement_interval(): number {
        return this.base_movement_interval;
    }

    public max_hp(): number {
        return this.base_max_hp;
    }

    public name(): string {
        return this.name_;
    }

    public dead(): boolean {
        return this.hp_ <= 0;
    }

    public heal_to_full() {
        this.hp_ = this.max_hp();
    }

    protected ensure_sprite_exists() {
        if (!this.sprite) {
            this.sprite = game.get_sprite(this.base_sprite_name);
        }
    }

    public render_center(renderer: CanvasRenderingContext2D) {
        this.ensure_sprite_exists();

        const half_width = this.sprite.width / 2;
        const half_height = this.sprite.height / 2;
        const half_tile = tile_px_size / 2;
        const render_x = this.x * tile_px_size + half_tile - half_width;
        const render_y = this.y * tile_px_size + half_tile - half_height;
        renderer.drawImage(this.sprite, render_x, render_y);
    }

    public render_fight_left(renderer: CanvasRenderingContext2D) {
        this.ensure_sprite_exists();

        const half_height = this.sprite.height / 2;
        const half_tile = tile_px_size / 2;
        const render_x = this.x * tile_px_size + formation_sprite_margin;
        const render_y = this.y * tile_px_size + half_tile - half_height;
        renderer.drawImage(this.sprite, render_x, render_y);
    }

    protected render_formation(renderer: CanvasRenderingContext2D, position: number, num_allies: number, offset_left: number) {
        if (position + 1 > max_per_formation || num_allies < 1) {
            return;
        }

        if (num_allies > max_per_formation) {
            num_allies = max_per_formation;
        }

        let num_per_column = formation_max_per_column;

        // Figure out position in battle formation
        let row = position % num_per_column;
        let column = Math.floor(position / num_per_column);
        let num_allies_in_column = Math.min(num_allies - column * num_per_column, num_per_column);

        // Distribute equally in last 2 columns
        const num_columns = Math.ceil(num_allies / formation_max_per_column);
        if (num_columns > 1) {
            const half = (num_allies - Math.max(0, num_columns - 2) * num_per_column) / 2;
            if (column + 1 == num_columns) {
                num_allies_in_column = Math.floor(half);
            } else if (column + 2 == num_columns) {
                num_allies_in_column = Math.ceil(half);
            }

            if (row >= num_allies_in_column) {
                row = position % num_allies_in_column + 1;
                column = Math.floor(position / num_allies_in_column);
            }
        }

        const half_tile = tile_px_size / 2;
        const column_height = (this.sprite.height + formation_sprite_margin) * num_allies_in_column;
        const column_y = half_tile - Math.floor(column_height / 2);
        const render_x = offset_left - (this.sprite.width + formation_sprite_margin) * (column + 1);
        const render_y = this.y * tile_px_size + column_y + (this.sprite.height + formation_sprite_margin) * row;
        renderer.drawImage(this.sprite, render_x, render_y);
    }

    public render_formation_center(renderer: CanvasRenderingContext2D, position: number, num_allies: number) {
        this.ensure_sprite_exists();

        const num_columns = Math.ceil(num_allies / formation_max_per_column);
        const width = num_columns * this.sprite.width + (num_columns - 1) * formation_sprite_margin;
        const render_x = this.x * tile_px_size + tile_px_size / 2 + Math.floor(width / 2);
        this.render_formation(renderer, position, num_allies, render_x);
    }

    public render_fight_right(renderer: CanvasRenderingContext2D, position: number, num_allies: number) {
        this.ensure_sprite_exists();

        const render_x = this.x * tile_px_size + tile_px_size;
        this.render_formation(renderer, position, num_allies, render_x);
    }

    public hp_string(): string {
        return `HP${this.hp_}/${this.max_hp()}`;
    }
}

export function weak_enemy(): Creature {
    return new Creature("Weak creature", "sprites/weak_creature.png", 5, [2], 100, Infinity);
}
