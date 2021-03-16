import { Creature, player, weak_enemy } from "./Creature";
import { empty_equipment_sprites, Equipment, EquipmentSlot, equipment_slots, equipment_slot_names, generate_armor, generate_equipment } from "./Equipment";
import { FloorLoop } from "./FloorLoop";
import { Vec2 } from "./utils";

export const tile_px_size = 64;
export const offwhite_color = "#e3e2e8";
export const gray_color = "#c5c5c5";

const sprite_paths = [
    "sprites/player.png",
    "sprites/camp.png",
    "sprites/play.png",
    "sprites/pause.png",
    "sprites/weak_creature.png",
    "sprites/empty_helmet.png",
    "sprites/empty_cloak.png",
    "sprites/empty_gloves.png",
    "sprites/empty_boots.png",
    "sprites/empty_armor.png",
    "sprites/empty_mainhand.png",
    "sprites/empty_offhand.png",
    "sprites/empty_ring.png",
    "sprites/empty_amulet.png"
] as const;

export type SpriteName = typeof sprite_paths[number];

function load_image(src: string): Promise<HTMLImageElement> {
    const img = new Image();
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
    img.src = src;
    return promise;
}

export enum LogStyle {
    Neutral,
    Good,
    VeryGood,
    Bad,
    VeryBad
}

const log_style_classnames = {
    [LogStyle.Neutral]: "neutral",
    [LogStyle.Good]: "good",
    [LogStyle.VeryGood]: "very-good",
    [LogStyle.Bad]: "bad",
    [LogStyle.VeryBad]: "very-bad",
};
export class Game {
    protected canvas: HTMLCanvasElement;
    protected renderer: CanvasRenderingContext2D;
    protected current_animation_frame: number | null = null;
    
    protected font_name = "puny8x10";
    protected big_font_size = 40;
    protected small_font_size = 20;
    protected big_font_style = `${this.big_font_size}px ${this.font_name}`;
    protected small_font_style = `${this.small_font_size}px ${this.font_name}`;

    protected canvas_border_padding = 5;
    protected text_line_padding = 1;

    protected message_log_element: HTMLElement;
    protected message_log_scrollback = 100;

    protected floor_size = 13;
    protected current_floor: FloorLoop | null = null;

    protected sprites: Map<SpriteName, HTMLImageElement> = new Map();

    protected paused = true;

    protected player: Creature | null = null;
    protected equipment: Map<EquipmentSlot, Equipment> = new Map();

    protected equipment_start_tile_y = 2;

    protected current_fight_duration = 0;

    protected cursor_canvas_pos: Vec2 = [0, 0];

    constructor(parent_element: HTMLElement) {
        this.canvas = parent_element.appendChild(document.createElement("canvas"));
        const renderer = this.canvas.getContext("2d");
        if (!renderer) {
            throw new Error("Failed to create renderer");
        }

        this.renderer = renderer;
        
        this.canvas.width = this.floor_size * tile_px_size;
        this.canvas.height = this.floor_size * tile_px_size;

        this.message_log_element = parent_element.appendChild(document.createElement("div"));
        this.message_log_element.className = "message-log";
    }

    public clear_canvas() {
        this.renderer.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    public load_assets(): Promise<void> {
        let num_loaded = 0;
        const num_assets = sprite_paths.length;

        const sprites: Promise<any>[] = sprite_paths.map(path => load_image(path).then(img => {
            this.sprites.set(path, img);
        }));

        const font: Promise<any> = new FontFace(this.font_name, "url(puny8x10.ttf)").load().then(font => {
            document.fonts.add(font);
            this.renderer.font = this.big_font_style;
        });

        const assets = sprites.concat(font);
        
        assets.map(load => {
            load.then(() => {
                num_loaded++;
                this.clear_canvas();
                this.renderer.fillText(`LOADING ${num_loaded}/${num_assets}`, this.canvas_border_padding, this.big_font_size);
            })
        });

        return Promise.all(assets).then(() => {
            this.clear_canvas();
        });
    }

    public start() {
        this.load_assets().then(() => {
            this.current_floor = new FloorLoop(this.floor_size);
            this.player = player();

            this.canvas.addEventListener("mousedown", () => {
                this.paused = !this.paused;
                this.player!.ticks_since_move = 0;
            });

            this.canvas.addEventListener("mousemove", e => {
                this.cursor_canvas_pos[0] = e.offsetX;
                this.cursor_canvas_pos[1] = e.offsetY;
            });

            this.equipment.set(EquipmentSlot.Mainhand, generate_equipment(EquipmentSlot.Mainhand));
            this.log_message(`Hello and welcome to the Loop!`);

            this.run();
        });
    }

    public tick() {
        if (!this.paused) {
            const player_tile = this.current_floor!.player_tile();
            const enemies = this.current_floor!.enemies_at(player_tile.x(), player_tile.y());

            if (enemies.length > 0) {
                // Fight!

                if (this.current_fight_duration++ == 0) {
                    // Describe enemies
                    const counts_by_name = new Map();
                    for (const enemy of enemies) {
                        let count = counts_by_name.get(enemy.name);
                        if (!count) {
                            count = 1;
                        } else {
                            count += 1;
                        }
                        counts_by_name.set(enemy.name, count);
                    }

                    let enemies_list_text = "";
                    let first = true;

                    for (const [name, count] of counts_by_name.entries()) {
                        let text = "";

                        if (count == 1) {
                            text = `a ${name}`;
                        } else {
                            // TODO: pluralize properly?
                            text = `${count} ${name}s`;
                        }

                        if (first) {
                            first = false;
                        } else {
                            enemies_list_text += ", ";
                        }

                        enemies_list_text += text;
                    }

                    this.log_message(`You have encountered ${enemies_list_text}!`);

                    // Player's initial attack has lower delay
                    this.player!.ticks_since_attack = Math.floor(Math.random() * this.player!.attack_interval);
                }

                if (++this.player!.ticks_since_attack >= this.player!.attack_interval) {
                    this.player!.ticks_since_attack = 0;

                    const target = enemies[0];
                    const damage = this.player!.attack_damage();
                    target.take_damage(damage);
                    this.log_message(`You hit the ${target.name} for ${damage} damage!`);

                    if (target.dead()) {
                        this.current_floor!.unspawn_enemy(target);
                        this.log_message(`You kill the ${target.name}!`, LogStyle.Good);

                        enemies.splice(0, 1);
                    }
                }

                for (const enemy of enemies) {
                    if (++enemy.ticks_since_attack >= enemy.attack_interval) {
                        enemy.ticks_since_attack = 0;

                        const damage = enemy.attack_damage();
                        this.player!.take_damage(damage);
                        this.log_message(`The ${enemy.name} hits you for ${damage} damage!`, LogStyle.Bad);

                        if (this.player!.dead()) {
                            this.log_message("Oh dear! You have died!", LogStyle.VeryBad);
                            this.stop();
                            break;
                        }
                    }
                }
            }
            // Allowed to move if no enemies here
            else if (++this.player!.ticks_since_move >= this.player!.movement_interval) {
                this.player!.ticks_since_move = 0;
                this.current_fight_duration = 0;
                if (this.current_floor!.advance_player()) {
                    this.log_message("You have completed a loop.", LogStyle.VeryGood);
                }

                const weak_enemy_spawn_rate = 0.1;
                if (Math.random() < weak_enemy_spawn_rate) {
                    this.current_floor!.spawn_enemy_in_random_location(weak_enemy());
                }
            }
        }

        // Drawing stuff
        this.current_floor!.render(this.renderer);

        this.renderer.fillStyle = offwhite_color;
        this.renderer.font = this.big_font_style;
        this.renderer.fillText(`LOOP#${this.current_floor!.loop_count() + 1}`, this.canvas_border_padding, this.big_font_size);

        this.renderer.fillText(`HP${this.player!.hp}/${this.player!.max_hp}`, this.canvas_border_padding, this.big_font_size * 2 + this.text_line_padding);

        const play_state_icon = this.paused ? this.get_sprite("sprites/pause.png") : this.get_sprite("sprites/play.png");
        this.renderer.drawImage(play_state_icon, this.canvas.width / 2 - tile_px_size / 2, 0);

        // Draw equipment
        this.renderer.strokeStyle = gray_color;
        let equipment_slot_tile_y = this.equipment_start_tile_y;
        for (const slot of equipment_slots) {
            const equipment = this.equipment.get(slot);
            if (equipment) {
                equipment.render(this.renderer, 0, equipment_slot_tile_y);
            } else {
                this.renderer.drawImage(this.get_sprite(empty_equipment_sprites[slot]), 0, equipment_slot_tile_y * tile_px_size);
            }

            this.draw_tile_border(0, equipment_slot_tile_y);
            equipment_slot_tile_y++;
        }

        if (this.cursor_canvas_pos[0] >= 0 && this.cursor_canvas_pos[0] < this.canvas.width &&
                this.cursor_canvas_pos[1] >= 0 && this.cursor_canvas_pos[1] < this.canvas.height) {
            // Describe what is under the cursor
            const cursor_tile = this.current_floor!.tile_at(...this.canvas_coord_to_tile_coord(...this.cursor_canvas_pos));
            let tile_description = "";

            const player_tile = this.current_floor!.player_tile();
            const enemies = this.current_floor!.enemies_at(cursor_tile.x(), cursor_tile.y());
            
            // Prioritize equipment slots then enemies then buildings then terrain
            if (cursor_tile.x() == 0 && cursor_tile.y() >= this.equipment_start_tile_y &&
                    cursor_tile.y() <= this.equipment_start_tile_y + equipment_slots.length) {
                const equipment_slot = equipment_slots[cursor_tile.y() - this.equipment_start_tile_y];
                const equipment = this.equipment.get(equipment_slot);
                if (equipment) {
                    tile_description += equipment.to_string();
                } else {
                    tile_description += `${equipment_slot_names[equipment_slot]} (Empty)`;
                }
            } else if (enemies.length > 0) {
                tile_description += enemies.map(e => `${e.name} (HP${e.hp}/${e.max_hp})`).join(", ");
            } else if (cursor_tile == player_tile) {
                tile_description += "That's you!";
            } else {
                tile_description += cursor_tile.desciption();
            }

            if (tile_description) {
                tile_description = tile_description.toUpperCase();
                this.renderer.font = this.small_font_style;
                this.renderer.fillText(tile_description, this.canvas_border_padding, this.canvas.height - this.canvas_border_padding);

                // Highlight tile
                this.renderer.strokeStyle = offwhite_color;
                this.draw_tile_border(cursor_tile.x(), cursor_tile.y());
            }
        }
    }

    public run = () => {
        this.current_animation_frame = requestAnimationFrame(this.run);
        this.tick();
    }

    public stop() {
        if (this.current_animation_frame !== null) {
            cancelAnimationFrame(this.current_animation_frame);
            this.current_animation_frame = null;
        }
    }

    public get_sprite(name: SpriteName): HTMLImageElement {
        const sprite = this.sprites.get(name);

        if (!sprite) {
            throw new Error(`No such sprite "${name}"`);
        }

        return sprite;
    }

    public log_message(message: string, style = LogStyle.Neutral) {
        const style_classname = log_style_classnames[style] ?? log_style_classnames[LogStyle.Neutral];
        const msg_el = document.createElement("div");
        msg_el.className = "log-message " + style_classname;
        msg_el.textContent = message.toUpperCase();
        this.message_log_element.appendChild(msg_el);

        this.message_log_element.scrollTo(0, this.message_log_element.scrollHeight);

        if (this.message_log_element.childElementCount > this.message_log_scrollback) {
            this.message_log_element.removeChild(this.message_log_element.firstChild!);
        }
    }

    public canvas_coord_to_tile_coord(canvas_x: number, canvas_y: number): Vec2 {
        return [
            Math.floor(canvas_x / tile_px_size),
            Math.floor(canvas_y / tile_px_size)
        ];
    }

    public draw_tile_border(tile_x: number, tile_y: number) {
        this.renderer.strokeRect(tile_x * tile_px_size + 0.5, tile_y * tile_px_size + 0.5, tile_px_size - 1, tile_px_size - 1);
    }
}
