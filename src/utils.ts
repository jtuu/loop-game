export function linear_scale(n: number, src_min: number, src_max: number, dst_min: number, dst_max: number): number {
    return (n - src_min) / (src_max - src_min) * (dst_max - dst_min) + dst_min;
}

export type Vec2 = [number, number];
