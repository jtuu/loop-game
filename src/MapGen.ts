import { Grid } from "./Grid";
import { linear_scale, Vec2 } from "./utils";

export const moore_neighborhood: Array<Vec2> = [
    [-1, -1], [ 0, -1], [ 1, -1],
    [-1,  0],           [ 1,  0],
    [-1,  1], [ 0,  1], [ 1,  1]
];

export const vn_neighborhood: Array<Vec2> = [
              [ 0, -1],
    [-1,  0],           [ 1,  0],
              [ 0,  1]
];

export class MapGen {
    protected read_grid: Grid<number>;
    protected write_grid: Grid<number>;

    constructor(protected width_: number, protected height_: number) {
        this.read_grid = new Grid(width_, height_);
        this.write_grid = new Grid(width_, height_);
    }

    public swap_buffers(): void {
        const temp = this.read_grid;
        this.read_grid = this.write_grid;
        this.write_grid = temp;
    }

    public fill(value: number): void {
        this.read_grid.fill(value);
        this.write_grid.fill(value);
    }

    public circle_fill(cx: number, cy: number, r: number, fill_value: number): number {
        r = Math.abs(r);
        
        if (r < Number.EPSILON) {
            return 0;
        }
        
        let num_filled = 0;
        const r2 = r * r;

        for (let ox = -r; ox <= r; ox++) {
            for (let oy = -r; oy <= r; oy++) {
                if (Math.abs(ox * ox + oy * oy) <= r2) {
                    const x = cx + ox;
                    const y = cy + oy;
                    this.write_grid.set(x, y, fill_value);
                    num_filled++;
                }
            }
        }

        this.swap_buffers();

        return num_filled;
    }

    public noisy_circle(cx: number, cy: number, r: number, p0: number, p1: number, fill_value: number): number {
        r = Math.abs(r);

        if (r < Number.EPSILON) {
            return 0;
        }

        let num_filled = 0;

        for (let ox = -r; ox <= r; ox++) {
            for (let oy = -r; oy <= r; oy++) {
                const dist2 = Math.abs(ox * ox + oy * oy);
                const delta = r - Math.sqrt(dist2);
                const p = linear_scale(delta, r, 0, p0, p1);
                if (Math.random() < p) {
                    const x = cx + ox;
                    const y = cy + oy;
                    this.write_grid.set(x, y, fill_value);
                    num_filled++;
                }
            }
        }

        this.swap_buffers();

        return num_filled;
    }

    public rule_grow(dead_value = 0): number {
        let num_grew = 0;

        for (let x = 0; x < this.width_; x++) {
            for (let y = 0; y < this.height_; y++) {
                const cell = this.read_grid.get(x, y);
                if (cell != dead_value) {
                    for (const [ox, oy] of moore_neighborhood) {
                        const nx = x + ox;
                        const ny = y + oy;
                        if (this.read_grid.within_bounds(nx, ny) && this.read_grid.get(nx, ny) != cell) {
                            this.write_grid.set(nx, ny, cell);
                            num_grew++;
                        }
                    }
                }
            }
        }

        this.swap_buffers();

        return num_grew;
    }

    public rule_xor(xor_rhs = 1): void {
        for (let x = 0; x < this.width_; x++) {
            for (let y = 0; y < this.height_; y++) {
                this.write_grid.set(x, y, this.read_grid.get(x, y) ^ xor_rhs);
            }
        }

        this.swap_buffers();
    }

    public rule_smooth(dead_value = 0, alive_value = 1): void {
        for (let x = 0; x < this.width_; x++) {
            for (let y = 0; y < this.height_; y++) {
                const cell = this.read_grid.get(x, y);

                let num_alive_neighbors = 0;
                for (const [ox, oy] of moore_neighborhood) {
                    const nx = x + ox;
                    const ny = y + oy;
                    if (this.read_grid.within_bounds(nx, ny) && this.read_grid.get(nx, ny) != dead_value) {
                        num_alive_neighbors++;
                    }
                }

                if ((cell == dead_value && num_alive_neighbors >= 5) ||
                    (cell != dead_value && num_alive_neighbors >= 4)) {
                    this.write_grid.set(x, y, alive_value);
                } else {
                    this.write_grid.set(x, y, dead_value);
                }
            }
        }

        this.swap_buffers();
    }

    public subtract(rhs: Array<number>): void {
        if (rhs.length != this.width_ * this.height_) {
            throw new Error("Operands must have equal size");
        }

        for (let i = 0; i < rhs.length; i++) {
            this.write_grid.seti(i, this.read_grid.geti(i) - rhs[i]);
        }

        this.swap_buffers();
    }

    public find_nearest(cx: number, cy: number, needle: number): Vec2 {
        let step = 0;
        let dir = 1;
        let i = 0;
        const coords: Vec2 = [cx, cy];

        // Iterate in a spiral outwards
        while (true) {
            let which_coord = 0;
            if (i % 2 == 0) {
                which_coord = 1;
                dir *= -1;
                step++;
            }

            const end = coords[which_coord] + step * dir;
            for (; coords[which_coord] != end; coords[which_coord] += dir) {
                if (this.read_grid.within_bounds(coords[0], coords[1]) && this.read_grid.get(coords[0], coords[1]) == needle) {
                    // Found needle
                    return coords;
                }
            }

            i++;
            if (i > 100) {
                throw new Error("uhh");
            }
        }
    }

    public copy_values(): Array<number> {
        return Array.from(this.read_grid.elements());
    }

    public width(): number {
        return this.width_;
    }

    public height(): number {
        return this.height_;
    }
}
