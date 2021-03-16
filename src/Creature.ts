import { FloorLoop } from "./FloorLoop";
import { tile_px_size } from "./Game";
import { game } from "./main";

export class Creature {
    public x = -1;
    public y = -1;

    public hp: number;

    public floor: FloorLoop | null = null;
    public ticks_since_attack = 0;
    public ticks_since_move = 0;

    constructor(
        public name: string,
        public sprite: CanvasImageSource,
        public max_hp: number,
        public hit_dice: number[],
        public attack_interval: number,
        public movement_interval: number
    ) {
        this.hp = max_hp;
    }

    public take_damage(damage: number) {
        this.hp -= damage;
    }

    public attack_damage(): number {
        let damage = 0;

        for (const die of this.hit_dice) {
            damage += Math.floor(Math.random() * die) + 1;
        }

        return damage;
    }

    public dead(): boolean {
        return this.hp <= 0;
    }

    public render(renderer: CanvasRenderingContext2D) {
        renderer.drawImage(this.sprite, this.x * tile_px_size, this.y * tile_px_size);
    }
}

export function player(): Creature {
    return new Creature("You", game.get_sprite("sprites/player.png"), 20, [2, 2], 100, 30);
}

export function weak_enemy(): Creature {
    return new Creature("Weak creature", game.get_sprite("sprites/weak_creature.png"), 5, [2], 100, Infinity);
}
