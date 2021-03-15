import { FloorLoop } from "./FloorLoop";

export const tile_px_size = 50;

export class Game {
    public canvas: HTMLCanvasElement;
    public renderer: CanvasRenderingContext2D;

    constructor(parent_element: HTMLElement) {
        this.canvas = parent_element.appendChild(document.createElement("canvas"));
        this.renderer = this.canvas.getContext("2d")!;

        const floor_size = 15;
        this.canvas.width = floor_size * tile_px_size;
        this.canvas.height = floor_size * tile_px_size;

        const floor = new FloorLoop(floor_size);
        floor.render(this.renderer);
    }
}
