import { SpriteName, tile_px_size } from "./Game";
import { game } from "./main";

export enum EquipmentSlot {
    Helmet,
    Cloak,
    Armor,
    Gloves,
    Boots,
    Mainhand,
    Offhand,
    Ring1,
    Ring2,
    Amulet
}

export const equipment_slots = [
    EquipmentSlot.Helmet,
    EquipmentSlot.Cloak,
    EquipmentSlot.Armor,
    EquipmentSlot.Gloves,
    EquipmentSlot.Boots,
    EquipmentSlot.Mainhand,
    EquipmentSlot.Offhand,
    EquipmentSlot.Ring1,
    EquipmentSlot.Ring2,
    EquipmentSlot.Amulet
];

export const equipment_slot_names = {
    [EquipmentSlot.Helmet]: "Helmet",
    [EquipmentSlot.Cloak]: "Cloak",
    [EquipmentSlot.Gloves]: "Gloves",
    [EquipmentSlot.Boots]: "Boots",
    [EquipmentSlot.Armor]: "Armor",
    [EquipmentSlot.Mainhand]: "Main hand",
    [EquipmentSlot.Offhand]: "Off-hand",
    [EquipmentSlot.Ring1]: "Ring",
    [EquipmentSlot.Ring2]: "Ring",
    [EquipmentSlot.Amulet]: "Amulet",
}

export const empty_equipment_sprites: Record<EquipmentSlot, SpriteName> = {
    [EquipmentSlot.Helmet]: "sprites/empty_helmet.png",
    [EquipmentSlot.Cloak]: "sprites/empty_cloak.png",
    [EquipmentSlot.Gloves]: "sprites/empty_gloves.png",
    [EquipmentSlot.Boots]: "sprites/empty_boots.png",
    [EquipmentSlot.Armor]: "sprites/empty_armor.png",
    [EquipmentSlot.Mainhand]: "sprites/empty_mainhand.png",
    [EquipmentSlot.Offhand]: "sprites/empty_offhand.png",
    [EquipmentSlot.Ring1]: "sprites/empty_ring.png",
    [EquipmentSlot.Ring2]: "sprites/empty_ring.png",
    [EquipmentSlot.Amulet]: "sprites/empty_amulet.png"
};

export class Equipment {
    constructor(
        public name: string,
        public readonly slot: EquipmentSlot,
        public sprite: HTMLImageElement
    ) {

    }

    public render(renderer: CanvasRenderingContext2D, tile_x: number, tile_y: number) {
        renderer.drawImage(this.sprite, tile_x * tile_px_size, tile_y * tile_px_size);
    }

    public to_string(): string {
        return this.name;
    }
}
