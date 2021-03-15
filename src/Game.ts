import { Creature, player, weak_enemy } from "./Creature";
import { FloorLoop } from "./FloorLoop";

export const tile_px_size = 64;
export const offwhite_color = "#e3e2e8";

const sprite_paths = [
    "sprites/player.png",
    "sprites/camp.png",
    "sprites/play.png",
    "sprites/pause.png",
    "sprites/weak_creature.png"
] as const;

type SpriteName = typeof sprite_paths[number];


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
    protected font_size = 40;
    protected screen_border_padding = 5;
    protected text_line_padding = 1;

    protected message_log_element: HTMLElement;
    protected message_log_scrollback = 100;

    protected floor_size = 13;
    protected current_floor: FloorLoop | null = null;

    protected sprites: Map<SpriteName, HTMLImageElement> = new Map();

    protected paused = true;

    protected player: Creature | null = null;

    protected current_fight_duration = 0;

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
            this.renderer.font = `${this.font_size}px ${font.family}`;
        });

        const assets = sprites.concat(font);
        
        assets.map(load => {
            load.then(() => {
                num_loaded++;
                this.clear_canvas();
                this.renderer.fillText(`LOADING ${num_loaded}/${num_assets}`, this.screen_border_padding, this.font_size);
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

        this.current_floor!.render(this.renderer);

        this.renderer.fillStyle = offwhite_color;
        this.renderer.fillText(`LOOP#${this.current_floor!.loop_count() + 1}`, this.screen_border_padding, this.font_size);

        this.renderer.fillText(`HP${this.player!.hp}/${this.player!.max_hp}`, this.screen_border_padding, this.font_size * 2 + this.text_line_padding);

        const play_state_icon = this.paused ? this.get_sprite("sprites/pause.png") : this.get_sprite("sprites/play.png");
        this.renderer.drawImage(play_state_icon, 0, this.font_size * 2);
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
}
