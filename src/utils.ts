export function linear_scale(n: number, src_min: number, src_max: number, dst_min: number, dst_max: number): number {
    return (n - src_min) / (src_max - src_min) * (dst_max - dst_min) + dst_min;
}

export type Vec2 = [number, number];

export type Vec3 = [number, number, number];

export function hsv2rgb(h: number, s: number, v: number): Vec3 {
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    let r = 0;
    let g = 0;
    let b = 0;
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function colorize(img: HTMLImageElement | HTMLCanvasElement, r: number, g: number, b: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Failed to create renderer");
    }

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);
    const img_data = ctx.getImageData(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < img_data.data.length; i += 4) {
        if (img_data.data[i + 3] > 0) {
            img_data.data[i + 0] = r;
            img_data.data[i + 1] = g;
            img_data.data[i + 2] = b;
        }
    }

    ctx.putImageData(img_data, 0, 0);

    return canvas;
}

export const get_keys = Object.keys as <T extends object>(obj: T) => Array<keyof T>;

export function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
}

const vowels = "aeiou";

export function is_vowel(char: string): boolean {
    return vowels.indexOf(char.toLowerCase()) > -1;
}

export function is_plural(word: string): boolean {
    return word[word.length - 1].toLowerCase() == "s" &&
            (word.length < 2 || word[word.length - 2].toLowerCase() != "s");
}

export function add_indefinite_article(word: string): string {
    if (is_plural(word)) {
        return word;
    }

    if (is_vowel(word[0])) {
        return "an " + word;
    }

    return "a " + word;
}

export function format_name_and_stats(name: string, stats: Array<string>): string {
    return `${name} (${stats.join(",")})`;
}
