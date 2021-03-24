import { Creature, weak_enemy } from "./Creature";
import { empty_equipment_sprites, EquipmentSlot, equipment_slots, equipment_slot_names, generate_equipment, generate_random_equipment } from "./Equipment";
import { FloorLoop } from "./FloorLoop";
import { Player } from "./Player";
import { add_indefinite_article, clamp, Vec2 } from "./utils";

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
    "sprites/empty_amulet.png",
    "sprites/rubble1.png",
    "sprites/rubble2.png"
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
    protected text_line_spacing = 4;

    protected message_log_element: HTMLElement;
    protected message_log_scrollback = 100;

    protected floor_size = 13;
    protected current_floor: FloorLoop | null = null;

    protected sprites: Map<SpriteName, HTMLImageElement> = new Map();

    protected paused = true;

    protected player_: Player | null = null;

    protected equipment_start_tile_y = 2;

    protected current_fight_duration = 0;

    protected cursor_canvas_pos: Vec2 = [0, 0];

    protected base_drop_rate = 0.5;

    constructor(parent_element: HTMLElement) {
        this.canvas = parent_element.appendChild(document.createElement("canvas"));
        const renderer = this.canvas.getContext("2d");
        if (!renderer) {
            throw new Error("Failed to create renderer");
        }

        this.renderer = renderer;
        
        this.canvas.width = this.floor_size * tile_px_size + 500;
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

    public async start() {
        await this.load_assets();

        // Init event handlers
        this.canvas.addEventListener("mousedown", () => {
            this.paused = !this.paused;
            this.player_!.ticks_since_move = 0;
        });

        this.canvas.addEventListener("mousemove", e => {
            this.cursor_canvas_pos[0] = e.offsetX;
            this.cursor_canvas_pos[1] = e.offsetY;
        });

        // Init floor and player
        const player = this.player_ = new Player();
        this.current_floor = new FloorLoop(this.floor_size);

        // Give player starting equipment
        player.equip(generate_equipment(EquipmentSlot.Mainhand, 1));

        this.log_message(`Hello and welcome to the Loop!`);

        // Start ticking
        this.run();
    }

    public tick() {
        this.update_player();

        // Drawing stuff
        this.clear_canvas();
        this.current_floor!.render(this.renderer);
        this.render_game_status();
        this.render_equipment();
        this.describe_tile_under_cursor();
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

    protected render_equipment() {
        this.renderer.strokeStyle = gray_color;
        let equipment_slot_tile_y = this.equipment_start_tile_y;
        for (const slot of equipment_slots) {
            const equipment = this.player_!.get_equipment(slot);
            if (equipment) {
                equipment.render(this.renderer, 0, equipment_slot_tile_y);
            } else {
                this.renderer.drawImage(this.get_sprite(empty_equipment_sprites[slot]), 0, equipment_slot_tile_y * tile_px_size);
            }

            this.draw_tile_border(0, equipment_slot_tile_y);
            equipment_slot_tile_y++;
        }
    }

    protected describe_tile_under_cursor() {
        const floor = this.current_floor;
        if (!floor) {
            return;
        }

        const tile_coord = this.canvas_coord_to_tile_coord(...this.cursor_canvas_pos);
        if (tile_coord[0] >= 0 && tile_coord[0] < this.floor_size &&
                tile_coord[1] >= 0 && tile_coord[1] < this.floor_size) {
            // Describe what is under the cursor
            const cursor_tile = floor.tile_at(...tile_coord);
            let tile_description = "";

            const player_tile = floor.player_tile();
            const enemies = floor.enemies_at(cursor_tile.x(), cursor_tile.y());
            
            // Prioritize equipment slots then enemies then buildings then terrain
            if (cursor_tile.x() == 0 && cursor_tile.y() >= this.equipment_start_tile_y &&
                    cursor_tile.y() < this.equipment_start_tile_y + equipment_slots.length) {
                const equipment_slot = equipment_slots[cursor_tile.y() - this.equipment_start_tile_y];
                const item = this.player_!.get_equipment(equipment_slot);
                if (item) {
                    tile_description += item.to_string();
                } else {
                    tile_description += `${equipment_slot_names[equipment_slot]} (Empty)`;
                }
            } else if (enemies.length > 0) {
                const enemy_descriptions = new Map<string, number>();

                for (const enemy of enemies) {
                    const text = `${enemy.name()}(${enemy.hp_string()})`;
                    let count = enemy_descriptions.get(text);
                    if (!count) {
                        count = 0;
                    }
                    enemy_descriptions.set(text, ++count);
                }

                tile_description += Array.from(enemy_descriptions.entries())
                    .map(([text, count]) => count > 1 ? `${text}(x${count})` : text).join(", ");
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

    protected render_game_status() {
        this.renderer.fillStyle = offwhite_color;
        this.renderer.font = this.big_font_style;
        this.renderer.fillText(`LOOP#${this.current_floor!.loop_count() + 1}`, this.canvas_border_padding, this.big_font_size);

        const play_state_icon = this.paused ? this.get_sprite("sprites/pause.png") : this.get_sprite("sprites/play.png");
        this.renderer.drawImage(play_state_icon, this.floor_size * tile_px_size / 2 - tile_px_size / 2, 0);

        const player_stats = this.player_!.stats_to_strings()
        for (let i = 0; i < player_stats.length; i++) {
            const y = (i + 1) * this.big_font_size + i * this.text_line_spacing + this.canvas_border_padding;
            this.renderer.fillText(player_stats[i], this.floor_size * tile_px_size, y);
        }
    }

    protected update_fight(enemies: Array<Creature>) {
        const player = this.player_;
        const floor = this.current_floor;

        if (!player) {
            throw new Error("Missing player object");
        }

        if (!floor) {
            throw new Error("Missing floor object");
        }

        if (this.current_fight_duration++ == 0) {
            // Describe enemies
            const counts_by_name = new Map();
            for (const enemy of enemies) {
                let count = counts_by_name.get(enemy.name());
                if (!count) {
                    count = 1;
                } else {
                    count += 1;
                }
                counts_by_name.set(enemy.name(), count);
            }

            let enemies_list_text = "";
            let first = true;

            for (const [name, count] of counts_by_name.entries()) {
                let text = "";

                if (count == 1) {
                    text = add_indefinite_article(name);
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
            player.ticks_since_attack = Math.floor(Math.random() * player.attack_interval());
        }

        // Add a small delay at the beginning of a fight to make it look a bit nicer
        if (this.current_fight_duration < 20) {
            return;
        }

        if (++player.ticks_since_attack >= player.attack_interval()) {
            player.ticks_since_attack = 0;

            const target = enemies.find(e => !e.dead());
            if (target) {
                const damage = player.attack_damage();
                target.take_damage(damage);
                this.log_message(`You hit the ${target.name()} for ${damage} damage!`);

                if (target.dead()) {
                    this.log_message(`You kill the ${target.name()}!`, LogStyle.Good);

                    enemies.splice(0, 1);

                    const drop_rate = this.base_drop_rate + (Math.log2(floor.loop_count()) * 5);
                    if (Math.random() < drop_rate) {
                        const item_level = floor.loop_count() + 1;
                        const item = generate_random_equipment(item_level);
                        player.equip(item);
                        this.log_message(`You have found ${item.to_string_with_indefinite_article()}`, LogStyle.Good);
                    }
                }
            }
        }

        let all_dead = true;

        for (const enemy of enemies) {
            if (enemy.dead()) {
                continue;
            }

            all_dead = false;

            if (++enemy.ticks_since_attack < enemy.attack_interval()) {
                continue;
            }

            enemy.ticks_since_attack = 0;

            const damage = enemy.attack_damage();
            player.take_damage(damage);
            this.log_message(`The ${enemy.name()} hits you for ${damage} damage!`, LogStyle.Bad);

            if (player.dead()) {
                this.log_message("Oh dear! You have died!", LogStyle.VeryBad);
                break;
            }
        }

        if (all_dead) {
            // Dead enemies don't unspawn until all enemies are dead
            for (const enemy of enemies) {
                floor.unspawn_enemy(enemy);
            }
        }
    }

    protected update_player() {
        const player = this.player_;
        const floor = this.current_floor;

        if (this.paused || !player || player.dead() || !floor) {
            return;
        }

        const player_tile = floor.player_tile();
        const enemies = floor.enemies_at(player_tile.x(), player_tile.y());

        // Can't move until there are no enemies on this tile
        if (enemies.length > 0) {
            this.update_fight(enemies);
        } else if (++player.ticks_since_move >= player.movement_interval()) {
            player.ticks_since_move = 0;
            this.current_fight_duration = 0;

            if (floor.advance_player()) {
                player.heal_to_full();
                this.log_message("You have completed a loop. Health restored!", LogStyle.VeryGood);
            }

            this.after_player_move();
        }
    }

    protected after_player_move() {
        const floor = this.current_floor;

        if (!floor) {
            return;
        }

        const max_tile_enemies = 5;
        const weak_enemy_spawn_rate = 0.1;
        
        if (Math.random() < weak_enemy_spawn_rate) {
            const num_enemies = clamp(Math.floor(Math.random() * floor.loop_count()), 1, max_tile_enemies);
            const enemies = Array(num_enemies);

            for (let i = 0; i < num_enemies; i++) {
                enemies[i] = weak_enemy();
            }

            floor.spawn_enemies_in_random_location(enemies);
        }
    }

    public player(): Player {
        return this.player_!;
    }
}
