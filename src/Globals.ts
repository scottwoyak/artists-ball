import { htmlColor } from "./htmlColor";

export type StatusFunction = (status: string) => void;

export let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export function clamp(value: number, min: number, max: number): number {
   if (value < min) {
      return min;
   }
   else if (value > max) {
      return max;
   }
   else {
      return value;
   }
}

export function toDeg(rad: number): number {
   return (180 / Math.PI) * rad;
}

export function toRad(deg: number): number {
   return (Math.PI / 180) * deg;
}

export function mix(v1: number, v2: number, mix: number): number {
   return v1 + clamp(mix, 0, 1) * (v2 - v1);
}

export function toCss(r: number, g: number, b: number, a?: number): string {
   return 'rgb(' + r + ',' + g + ',' + b + (a === undefined ? '' : ',' + a) + ')';
}


export class Globals {

   // Values we use for white and black. White is warmer than pure white
   static readonly WHITE = new htmlColor([255, 250, 242]).toGlColor();
   static readonly BLACK = new htmlColor([0, 0, 0]).toGlColor();

}
