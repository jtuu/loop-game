import { Creature } from "./Creature";
import { Equipment, EquipmentSlot, Stat } from "./Equipment";
import { SpriteName } from "./Game";
import { game } from "./main";
import { Serializable, SerializationBlacklist } from "./serialization";
import { CanvasImage, colorize } from "./utils";

const player_equipment_sprites = new Map<EquipmentSlot, SpriteName>([
    [EquipmentSlot.Armor, "sprites/player_armor.png"],
    [EquipmentSlot.Boots, "sprites/player_boots.png"],
    [EquipmentSlot.Helmet, "sprites/player_helmet.png"],
    [EquipmentSlot.Cloak, "sprites/player_cloak.png"],
    [EquipmentSlot.Mainhand, "sprites/player_mainhand.png"],
    [EquipmentSlot.Offhand, "sprites/player_offhand.png"]
]);

@Serializable
export class Player extends Creature {
    protected equipment: Map<EquipmentSlot, Equipment> = new Map();

    @SerializationBlacklist protected sprite_drawn = false;
    
    constructor() {
        super("You", "sprites/player.png", 20, [], 100, 30);
    }

    /**
     * Returns total increased attack speed as a multiplier
     */
    protected total_increased_attack_speed(): number {
        let inc_attack_speed = 100;

        for (const item of this.equipment.values()) {
            inc_attack_speed += item.stats.get(Stat.IncreasedAttackSpeed) ?? 0;
        }

        inc_attack_speed /= 100;

        return inc_attack_speed;
    }

    public attack_interval(): number {
        const inc_attack_speed = this.total_increased_attack_speed();

        return this.base_attack_interval / inc_attack_speed;
    }

    /**
     * Returns total minimum damage and variable damage
     */
    protected total_damage_stats(): [number, number] {
        let added_min_dmg = 0;
        let added_var_dmg = 0;
        let inc_dmg = 100;

        // Get total stats from equipment
        for (const item of this.equipment.values()) {
            added_min_dmg += item.stats.get(Stat.AddedMinDamage) ?? 0;
            added_var_dmg += item.stats.get(Stat.AddedVariableDamage) ?? 0;
            inc_dmg += item.stats.get(Stat.IncreasedDamage) ?? 0;
        }

        inc_dmg /= 100;

        // Apply increased damage
        const min_dmg = Math.round(added_min_dmg * inc_dmg);
        const var_dmg = Math.round(added_var_dmg * inc_dmg);

        return [min_dmg, var_dmg];
    }

    public attack_damage(): number {
        const [min_dmg, var_dmg] = this.total_damage_stats();

        let var_dmg_roll = 0;
        if (var_dmg > 0) {
            var_dmg_roll = Math.round(Math.random() * var_dmg);
        }

        return min_dmg + var_dmg_roll;
    }

    /**
     * Returns item that was in slot
     */
    public equip(item: Equipment): Equipment | undefined {
        if (item.slot == EquipmentSlot.Ring1 || item.slot == EquipmentSlot.Ring2) {
            // Put ring in empty slot
            if (!this.equipment.has(EquipmentSlot.Ring1)) {
                item.slot = EquipmentSlot.Ring1;
            } else if (!this.equipment.has(EquipmentSlot.Ring2)) {
                item.slot = EquipmentSlot.Ring2;
            }
        }

        const old = this.unequip(item.slot);
        this.equipment.set(item.slot, item);

        this.redraw_sprite();

        return old;
    }

    /**
     * Returns unequipped item
     */
    public unequip(slot: EquipmentSlot): Equipment | undefined {
        const item = this.equipment.get(slot);
        this.equipment.delete(slot);

        if (!item) {
            return undefined;
        }

        const max_hp = this.max_hp();
        if (this.hp_ > max_hp) {
            this.hp_ = max_hp;
        }
    }

    public get_equipment(slot: EquipmentSlot): Equipment | undefined {
        return this.equipment.get(slot);
    }

    public max_hp(): number {
        let added_hp = 0;
        let inc_hp = 100;
        
        for (const item of this.equipment.values()) {
            added_hp += item.stats.get(Stat.AddedHealth) ?? 0;
            inc_hp += item.stats.get(Stat.IncreasedHealth) ?? 0;
        }

        inc_hp /= 100;

        return Math.floor((this.base_max_hp + added_hp) * inc_hp);
    }

    public stats_to_strings(): Array<string> {
        const [min_dmg, var_dmg] = this.total_damage_stats();
        const inc_attack_speed = Math.floor(this.total_increased_attack_speed() * 100);

        const stats: Array<string> = [
            this.hp_string(),
            `DMG${min_dmg}-${min_dmg + var_dmg}`,
            `SPD${inc_attack_speed}%`
        ];

        return stats;
    }

    protected render_equipment(renderer: CanvasRenderingContext2D, slot: EquipmentSlot) {
        const item = this.equipment.get(slot);
        if (!item) {
            return;
        }

        const sprite_name = player_equipment_sprites.get(slot);
        if (!sprite_name) {
            return;
        }

        const colorized = colorize(game.get_sprite(sprite_name), ...item.color);
        renderer.drawImage(colorized, 0, 0);
    }

    protected redraw_sprite() {
        const canvas = document.createElement("canvas");
        const renderer = canvas.getContext("2d");

        if (!renderer) {
            throw new Error("Failed to create renderer");
        }

        const base_sprite = game.get_sprite(this.base_sprite_name);

        canvas.width = base_sprite.width;
        canvas.height = base_sprite.height;

        this.render_equipment(renderer, EquipmentSlot.Cloak);
        renderer.drawImage(base_sprite, 0, 0);
        this.render_equipment(renderer, EquipmentSlot.Boots);
        this.render_equipment(renderer, EquipmentSlot.Armor);
        this.render_equipment(renderer, EquipmentSlot.Helmet);
        this.render_equipment(renderer, EquipmentSlot.Mainhand);
        this.render_equipment(renderer, EquipmentSlot.Offhand);

        this.sprite_drawn = true;
        this.sprite = canvas;
    }

    public render_center(renderer: CanvasRenderingContext2D) {
        if (!this.sprite_drawn) {
            this.redraw_sprite();
        }

        super.render_center(renderer);
    }

    public render_fight_left(renderer: CanvasRenderingContext2D) {
        if (!this.sprite_drawn) {
            this.redraw_sprite();
        }

        super.render_fight_left(renderer);
    }
}
