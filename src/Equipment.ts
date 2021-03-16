import { SpriteName, tile_px_size } from "./Game";
import { game } from "./main";
import { colorize, hsv2rgb } from "./utils";

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

export enum Stat {
    HP,

}

export class Equipment {
    constructor(
        public name: string,
        public readonly slot: EquipmentSlot,
        public sprite: CanvasImageSource
    ) {

    }

    public render(renderer: CanvasRenderingContext2D, tile_x: number, tile_y: number) {
        renderer.drawImage(this.sprite, tile_x * tile_px_size, tile_y * tile_px_size);
    }

    public to_string(): string {
        return this.name;
    }
}

const armor_slots = [
    EquipmentSlot.Helmet,
    EquipmentSlot.Cloak,
    EquipmentSlot.Armor,
    EquipmentSlot.Gloves,
    EquipmentSlot.Boots
];

const general_prefixes = [
    "Big",
    "Small",
    "Large",
    "Light",
    "Heavy",
    "Worn",
    "Rusty",
    "Broken",
    "Wooden",
    "Shiny",
    "Ornate",
    "Spiked",
    "Copper",
    "Bronze",
    "Iron",
    "Steel",
    "Menacing",
    "Painted",
    "Plain",
    "Simple",
    "Ornamental",
    "Replica",
    "Enhanced",
    "Enchanted",
    "Gilded",
    "Jewelled",
    "Dark",
    "Damaged",
    "Torn",
    "Split",
    "Fractured",
    "Rough",
    "Jagged",
    "Smooth",
    "Blessed",
    "Ominous",
    "Magical",
    "Crimson",
    "Cerulean",
    "Viridian",
    "Black",
    "White",
    "Gray",
    "Gleaming",
    "Lucky",
    "Imbued",
    "Unusual",
    "New",
    "Old",
    "Remarkable",
    "Unremarkable",
    "Special",
    "Unique",
    "Exceptional",
    "Used",
    "Battleworn",
    "Weighted",
    "King's",
    "Queen's",
    "Knight's"
];

const jewellery_prefixes = [
    "Pearl",
    "Ivory",
    "Gemstone",
    "Jewel",
    "Diamond",
    "Ruby",
    "Sapphire",
    "Emerald",
    "Topaz",
    "Amethyst",
    "Silver",
    "Golden",
    "Murmuring",
    "Whispering",
    "Ritual",
    "Bone",
    "Glass",
    "Eerie",
    "Macabre",
    "Grim",
    "Strange",
    "Mysterious",
    "Spectral",
    "Eldritch",
    "Haunted"
];

const armor_prefixes = [
    "Sturdy",
    "Bulky",
    "Strong",
    "Studded",
    "Leather",
    "Banded",
    "Chain",
    "Plated",
    "Splinted",
    "Dragonhide",
    "Silk",
    "Cotton",
    "Lacy",
    "Embroidered",
    "Tan",
    "Tough",
    "Warm",
    "Waterproof"
];

const specific_prefixes: Record<EquipmentSlot, Array<string>> = {
    [EquipmentSlot.Helmet]: ["Brimmed", "Visored"],
    [EquipmentSlot.Gloves]: ["Fingerless"],
    [EquipmentSlot.Cloak]: ["Long", "Short"],
    [EquipmentSlot.Ring1]: ["Spiral"],
    [EquipmentSlot.Ring2]: [],
    [EquipmentSlot.Amulet]: [],
    [EquipmentSlot.Boots]: ["Suede", "Steel-toed", "Strapped", "Buckled", "Comfy", "Thigh-high"],
    [EquipmentSlot.Armor]: [],
    [EquipmentSlot.Mainhand]: [
        "Sharp",
        "Blunt",
        "Bone",
        "Obsidian",
        "Sharpened",
        "Chipped",
        "Bloodstained",
        "Bloody",
        "Ensanguined",
        "Bloodthirsty",
        "Intimidating",
        "Formidable",
        "Feared",
        "Dread",
        "Vicious",
        "Ruthless",
        "Merciless",
        "Savage",
        "Brutal",
        "Deadly",
        "Cruel",
        "Improvised",
        "Strong",
        "Weak",
        "Polished",
    ],
    [EquipmentSlot.Offhand]: []
};
specific_prefixes[EquipmentSlot.Ring2] = specific_prefixes[EquipmentSlot.Ring1];

const equipment_names: Record<EquipmentSlot, Array<String>> = {
    [EquipmentSlot.Helmet]: ["Helmet", "Cap", "Hat", "Hood", "Burgonet", "Great helm", "Coif", "Sallet", "Bascinet", "Mask"],
    [EquipmentSlot.Cloak]: ["Cape", "Cloak", "Mantle", "Hooded cloak"],
    [EquipmentSlot.Armor]: ["Breastplate", "Mail shirt", "Armor", "Shirt", "Tunic", "Coat", "Hauberk", "Cuirass"],
    [EquipmentSlot.Gloves]: ["Gloves", "Gauntlets", "Mittens", "Mitts", "Vambraces"],
    [EquipmentSlot.Boots]: ["Shoes", "Boots", "Greaves", "Chausses", "Sandals", "Socks"],
    [EquipmentSlot.Mainhand]: ["Sword", "Dagger", "Axe", "Spear", "Halberd", "Scimitar", "Katana",
                               "Knife", "Saber", "Cutlass", "Gladius", "Estoc", "Claymore", "Longsword",
                               "Dirk", "Rapier", "Machete", "Falchion", "Mace", "Morning star", "Mallet",
                               "Club", "War hammer", "Battle axe", "Flail", "Maul", "Whip", "Partisan",
                               "Halberd", "Lance", "Pike", "Hasta", "Quarterstaff", "Glaive", "Trident",
                               "Trishula", "Hatchet", "Blade"],
    [EquipmentSlot.Offhand]: ["Shield", "Buckler", "Kite shield", "Targe", "Heater shield"],
    [EquipmentSlot.Ring1]: ["Ring", "Band", "Hoop", "Loop"],
    [EquipmentSlot.Ring2]: [],
    [EquipmentSlot.Amulet]: ["Amulet", "Necklace", "Brooch", "Torc", "Beads", "Chain", "Ribbon",
                             "Talisman", "Charm", "Badge", "Sigil", "Earring", "Bracelet", "Pendant"]
};
equipment_names[EquipmentSlot.Ring2] = equipment_names[EquipmentSlot.Ring1];

function generate_equipment_name(slot: EquipmentSlot): string {
    let prefixes = general_prefixes;

    switch (slot) {
        case EquipmentSlot.Helmet:
        case EquipmentSlot.Cloak:
        case EquipmentSlot.Armor:
        case EquipmentSlot.Gloves:
        case EquipmentSlot.Boots:
            prefixes = prefixes.concat(armor_prefixes);
            break;
        case EquipmentSlot.Ring1:
        case EquipmentSlot.Ring2:
        case EquipmentSlot.Amulet:
            prefixes = prefixes.concat(jewellery_prefixes);
            break;
    }

    prefixes = prefixes.concat(specific_prefixes[slot]);

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

    const base_names = equipment_names[slot];
    const base_name = base_names[Math.floor(Math.random() * base_names.length)];

    return `${prefix} ${base_name}`;
}

export function generate_equipment(slot: EquipmentSlot) {
    const orig_sprite = game.get_sprite(empty_equipment_sprites[slot]);
    const color = hsv2rgb(Math.random(), 0.3 + Math.random() * 0.7, 0.3 + Math.random() * 0.7);
    const colorized_sprite = colorize(orig_sprite, ...color);
    return new Equipment(generate_equipment_name(slot), slot, colorized_sprite);
}

export function generate_armor(): Equipment {
    const slot = armor_slots[Math.floor(Math.random() * armor_slots.length)];
    return generate_equipment(slot);
}
