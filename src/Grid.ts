import { Serializable } from "./serialization";

@Serializable
export class Grid<T> {
    protected elements_: Array<T>;

    constructor(protected width_: number, protected height_: number) {
        this.elements_ = new Array(width_ * height_);
    }

    public index(x: number, y: number): number {
        return this.width_ * y + x;
    }

    public within_bounds(x: number, y: number): boolean {
        return x >= 0 && x < this.width_ && y >= 0 && y < this.height_;
    }

    public get(x: number, y: number): T {
        return this.elements_[this.index(x, y)];
    }

    public set(x: number, y: number, value: T): void {
        this.elements_[this.index(x, y)] = value;
    }

    public geti(idx: number): T {
        return this.elements_[idx];
    }

    public seti(idx: number, value: T): void {
        this.elements_[idx] = value;
    }

    public fill(value: T): void {
        this.elements_.fill(value);
    }

    public elements(): ReadonlyArray<T> {
        return this.elements_;
    }

    public width(): number {
        return this.width_;
    }

    public height(): number {
        return this.height_;
    }
}
