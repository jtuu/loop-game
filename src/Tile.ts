export enum TerrainKind {
    Empty,
    Floor,
    Error
}

export enum BuildingKind {
    None,
    Camp
}

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
}
