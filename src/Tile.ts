import { SpriteName, tile_px_size } from "./Game";
import { game } from "./main";
import { CanvasImage } from "./utils";

export enum TerrainKind {
    Empty,
    Floor,
    Error
}

export enum BuildingKind {
    None,
    Camp
}

const rubble_sprites: Array<SpriteName> = [
    "sprites/rubble1.png",
    "sprites/rubble2.png"
];

export class Tile {
    protected x_: number;
    protected y_: number;
    protected terrain_: TerrainKind;
    protected building_: BuildingKind;

    constructor(x: number, y: number, terrain: TerrainKind, building: BuildingKind = BuildingKind.None) {
        this.x_ = x;
        this.y_ = y;
        this.terrain_ = terrain;
        this.building_ = building;
    }

    public x(): number {
        return this.x_;
    }

    public y(): number {
        return this.y_;
    }

    public terrain(): TerrainKind {
        return this.terrain_;
    }

    public building(): BuildingKind {
        return this.building_;
    }

    public desciption(): string {
        if (this.building_ == BuildingKind.None) {
            switch (this.terrain_) {
                case TerrainKind.Floor:
                    return "The floor. You can walk on this."
                case TerrainKind.Error:
                    return "!!ERROR!!";
            }
        } else {
            switch (this.building_) {
                case BuildingKind.Camp:
                    return "This is your camp.";
            }
        }

        return "";
    }

    public render(renderer: CanvasRenderingContext2D) {
        let terrain_sprite: CanvasImage | null = null;

        const render_x = this.x_ * tile_px_size;
        const render_y = this.y_ * tile_px_size;

        switch (this.terrain_) {
            case TerrainKind.Empty:
                renderer.fillStyle = "hsl(0, 0%, 10%)";
                break;
            case TerrainKind.Floor: {
                renderer.fillStyle = "hsl(30, 35%, 35%)";
                // Pick random sprite
                terrain_sprite = game.get_sprite(rubble_sprites[this.x_ * 42643801 % this.y_ * 68718952447 % rubble_sprites.length]);
                break;
            }
            case TerrainKind.Error:
                renderer.fillStyle = "red";
                break;
        }

        renderer.fillRect(render_x, render_y, tile_px_size, tile_px_size);

        if (terrain_sprite) {
            // Rotate sprite randomly
            const half_tile_size = tile_px_size / 2;
            renderer.setTransform(1, 0, 0, 1, render_x + half_tile_size, render_y + half_tile_size);
            renderer.rotate(this.x_ * 739397 % this.y_ * 374321 % 4 * (Math.PI / 2));
            renderer.drawImage(terrain_sprite, -half_tile_size, -half_tile_size);
            renderer.setTransform(1, 0, 0, 1, 0, 0);
        }

        switch (this.building_) {
            case BuildingKind.Camp:
                renderer.drawImage(game.get_sprite("sprites/camp.png"), render_x, render_y);
                break;
        }
    }
}
