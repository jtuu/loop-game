import { SpriteName, tile_px_size } from "./Game";
import { game } from "./main";
import { Serializable, SerializationBlacklist } from "./serialization";
import { add_indefinite_article, CanvasImage, clamp, colorize, format_name_and_stats, get_keys, hsv2rgb, Vec3 } from "./utils";

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
    AddedHealth,
    IncreasedHealth,
    AddedMinDamage,
    AddedVariableDamage,
    IncreasedDamage,
    IncreasedAttackSpeed
}

@Serializable
export class Equipment {
    public stats: Map<Stat, number> = new Map();

    @SerializationBlacklist protected sprite_drawn = false;
    @SerializationBlacklist public sprite: CanvasImage;

    constructor(
        public name: string,
        public slot: EquipmentSlot,
        public color: Vec3
    ) {
        // Assure tsc that sprite is assigned
        this.sprite = this.redraw_sprite();
    }

    public redraw_sprite(): CanvasImage {
        const orig_sprite = game.get_sprite(empty_equipment_sprites[this.slot]);
        this.sprite = colorize(orig_sprite, ...this.color);
        this.sprite_drawn = true;
        return this.sprite;
    }

    public render(renderer: CanvasRenderingContext2D, tile_x: number, tile_y: number) {
        if (!this.sprite_drawn) {
            this.redraw_sprite();
        }
        renderer.drawImage(this.sprite, tile_x * tile_px_size, tile_y * tile_px_size);
    }

    public stats_to_strings(): Array<string> {
        const add_hp = this.stats.get(Stat.AddedHealth);
        const inc_hp = this.stats.get(Stat.IncreasedHealth);
        const min_dmg = this.stats.get(Stat.AddedMinDamage);
        const var_dmg = this.stats.get(Stat.AddedVariableDamage);
        const inc_dmg = this.stats.get(Stat.IncreasedDamage);
        const inc_atk_spd = this.stats.get(Stat.IncreasedAttackSpeed);

        const stats: Array<string> = [];

        if (add_hp) {
            stats.push(`HP+${add_hp}`);
        }

        if (inc_hp) {
            stats.push(`HP+${inc_hp}%`);
        }

        if (min_dmg) {
            if (var_dmg) {
                stats.push(`DMG+${min_dmg}-${min_dmg + var_dmg}`);
            } else {
                stats.push(`DMG+${min_dmg}`);
            }
        } else if (var_dmg) {
            stats.push(`DMG+0-${var_dmg}`);
        }

        if (inc_dmg) {
            stats.push(`DMG+${inc_dmg}%`)
        }

        if (inc_atk_spd) {
            stats.push(`SPD+${inc_atk_spd}%`)
        }

        return stats;
    }

    public to_string_with_indefinite_article(): string {
        return format_name_and_stats(add_indefinite_article(this.name), this.stats_to_strings());
    }

    public to_string(): string {
        return format_name_and_stats(this.name, this.stats_to_strings());
    }
}

const armor_slots = [
    EquipmentSlot.Helmet,
    EquipmentSlot.Cloak,
    EquipmentSlot.Armor,
    EquipmentSlot.Gloves,
    EquipmentSlot.Boots
];

const jewellery_slots = [
    EquipmentSlot.Ring1,
    EquipmentSlot.Amulet
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

// Stat, weight, base_min_roll, base_range, scaling_value
type StatWeightInfo = [Stat, number, number, number, number];

const equipment_stat_weights: Record<EquipmentSlot, Array<StatWeightInfo>> = {
    [EquipmentSlot.Helmet]: [
        [Stat.AddedHealth, 10, 1, 2, 0.5],
        [Stat.IncreasedHealth, 1, 1, 1, 0.3]
    ],
    [EquipmentSlot.Cloak]: [
        [Stat.AddedHealth, 10, 1, 2, 0.5],
        [Stat.IncreasedHealth, 1, 1, 1, 0.3]
    ],
    [EquipmentSlot.Armor]: [
        [Stat.AddedHealth, 10, 5, 2, 1],
        [Stat.IncreasedHealth, 1, 1, 2, 0.6]
    ],
    [EquipmentSlot.Gloves]: [
        [Stat.AddedHealth, 10, 1, 2, 0.5],
        [Stat.IncreasedHealth, 1, 1, 1, 0.3],
        [Stat.IncreasedAttackSpeed, 1, 3, 3, 0.5]
    ],
    [EquipmentSlot.Boots]: [
        [Stat.AddedHealth, 10, 1, 2, 0.5],
        [Stat.IncreasedHealth, 1, 1, 1, 0.3]
    ],
    [EquipmentSlot.Mainhand]: [
        [Stat.IncreasedAttackSpeed, 1, 5, 3, 0.75]
    ],
    [EquipmentSlot.Offhand]: [
        [Stat.AddedHealth, 10, 3, 2, 0.75],
        [Stat.IncreasedHealth, 1, 1, 2, 0.6]
    ],
    [EquipmentSlot.Ring1]: [
        [Stat.IncreasedAttackSpeed, 1, 3, 3, 0.5],
        [Stat.AddedMinDamage, 5, 1, 2, 0.5],
        [Stat.AddedVariableDamage, 10, 2, 2, 0.75],
        [Stat.IncreasedDamage, 10, 3, 3, 1],
        [Stat.AddedHealth, 10, 1, 2, 0.5]
    ],
    [EquipmentSlot.Ring2]: [],
    [EquipmentSlot.Amulet]: [
        [Stat.IncreasedDamage, 1, 5, 3, 0.75],
        [Stat.IncreasedHealth, 1, 2, 2, 0.75]
    ],
};
equipment_stat_weights[EquipmentSlot.Ring2] = equipment_stat_weights[EquipmentSlot.Ring1];

// Calculate weight sums for all slots
const equipment_stat_weight_sums = get_keys(equipment_stat_weights).reduce((acc, cur) => {
    let sum = 0;
    for (const [_, weight] of equipment_stat_weights[cur]) {
        sum += weight;
    }
    acc[cur] = sum;
    return acc;
}, {} as Record<EquipmentSlot, number>);

// For debugging purposes
(window as any).print_equipment_stat_weight_info = function print_equipment_stat_weight_info() {
    for (const slot of get_keys(equipment_stat_weights)) {
        console.groupCollapsed(EquipmentSlot[slot]);

        for (const [stat, weight] of equipment_stat_weights[slot]) {
            const percent = weight / equipment_stat_weight_sums[slot] * 100;
            console.log(`${Stat[stat]}: ${percent.toFixed(2)}% (${weight})`);
        }

        console.groupEnd();
    }
}

export function generate_equipment(slot: EquipmentSlot, item_level: number): Equipment {
    const color = hsv2rgb(Math.random(), 0.3 + Math.random() * 0.7, 0.3 + Math.random() * 0.7);

    const stats: Array<StatWeightInfo> = [];
    const available_stats = Array.from(equipment_stat_weights[slot]);
    
    let min_num_stats = 1;
    if (slot == EquipmentSlot.Mainhand) {
        // Weapons must always have AddedMinDamage and AddedVariableDamage
        // They are also less likely to have extra stats
        min_num_stats = 0;

        stats.push([Stat.AddedMinDamage, 0, 1, 0.1, 1]);
        stats.push([Stat.AddedVariableDamage, 0, 1, 0.1, 0.85]);
    }

    // Choose how many different stats to add to item
    let num_stats = clamp(Math.round(Math.random() * item_level / 2), min_num_stats, available_stats.length);

    // Choose which stats to add based on stat weighting
    let weight_sum = equipment_stat_weight_sums[slot];
    for (let i = 0; i < num_stats; i++) {
        let rand = Math.floor(Math.random() * weight_sum + 1);

        let added_stat = false;
        for (let j = 0; j < available_stats.length; j++) {
            const weight = available_stats[j][1];

            if (rand <= weight) {
                stats.push(available_stats[j]);
                available_stats.splice(j, 1);
                weight_sum -= weight;
                added_stat = true;
                break;
            }

            rand -= weight;
        }

        if (!added_stat) {
            throw new Error("Failed to add stat to item");
        }
    }

    const item = new Equipment(generate_equipment_name(slot), slot, color);

    // Roll stat values
    for (const [stat, _, base_min_roll, base_range, scaling_value] of stats) {
        const min_roll = base_min_roll + (item_level - 1) * scaling_value;
        const range = (base_range + (item_level - 1) * scaling_value) * 2;
        const roll = Math.floor(min_roll + Math.random() * range);
        item.stats.set(stat, roll);
    }

    return item;
}

export function generate_random_equipment(item_level: number): Equipment {
    return generate_equipment(equipment_slots[Math.floor(Math.random() * equipment_slots.length)], item_level);
}
