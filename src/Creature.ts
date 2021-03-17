import { FloorLoop } from "./FloorLoop";
import { tile_px_size } from "./Game";
import { game } from "./main";

export class Creature {
    public x = -1;
    public y = -1;

    protected hp_: number;

    public floor: FloorLoop | null = null;
    public ticks_since_attack = 0;
    public ticks_since_move = 0;

    constructor(
        protected name_: string,
        protected sprite: CanvasImageSource,
        protected base_max_hp: number,
        protected hit_dice: number[],
        protected base_attack_interval: number,
        protected base_movement_interval: number
    ) {
        this.hp_ = base_max_hp;
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

    public render(renderer: CanvasRenderingContext2D) {
        renderer.drawImage(this.sprite, this.x * tile_px_size, this.y * tile_px_size);
    }

    public hp_string(): string {
        return `HP${this.hp_}/${this.max_hp()}`;
    }
}

export function weak_enemy(): Creature {
    return new Creature("Weak creature", game.get_sprite("sprites/weak_creature.png"), 5, [2], 100, Infinity);
}
