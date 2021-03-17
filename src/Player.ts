import { Creature } from "./Creature";
import { Equipment, EquipmentSlot, Stat } from "./Equipment";
import { game } from "./main";

export class Player extends Creature {
    protected equipment: Map<EquipmentSlot, Equipment> = new Map();
    
    constructor() {
        super("You", game.get_sprite("sprites/player.png"), 20, [], 100, 30);
    }

    public attack_interval(): number {
        let inc_attack_speed = 100;

        for (const item of this.equipment.values()) {
            inc_attack_speed += item.stats.get(Stat.IncreasedAttackSpeed) ?? 0;
        }

        inc_attack_speed /= 100;

        return this.base_attack_interval / inc_attack_speed;
    }

    public attack_damage(): number {
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
        const var_dmg = added_var_dmg * inc_dmg;

        let var_dmg_roll = 0;
        if (added_var_dmg > 0) {
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
}
