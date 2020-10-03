
export type StatusFunction = (status: string) => void;

export const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export let env = {
   isTesting: false
}

export function getEmPixels(): number {
   let style = getComputedStyle(document.body);
   return Number.parseFloat(style.fontSize.substr(0, style.fontSize.length - 2));
}

export function pxToNumber(pxValue: string): number {
   if (pxValue.endsWith('px')) {
      return Number.parseFloat(pxValue.substr(0, pxValue.length - 2));
   }
   else {
      return Number.NaN;
   }
}


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

export function toSizeStr(val: number): string {
   if (val < 1024) {
      return val + ' bytes';
   }
   else if (val < 1024 * 1024) {
      return (val / 1024).toFixed(1) + ' kb';
   }
   else {
      return (val / (1024 * 1024)).toFixed(1) + ' mb';
   }
}

export function toTimeStr(val: number): string {
   if (val < 1000) {
      return val.toFixed(0) + ' ms';
   }
   else {
      return (val / 1000).toFixed(1) + ' s';
   }
}

export function getBooleanValue(value: boolean | (() => boolean) | undefined | null): boolean {
   if (value === undefined || value === null) {
      return false;
   }
   else if (typeof value === 'boolean') {
      return value;
   }
   else if (typeof value === 'function') {
      return value();
   }
   else {
      return false;
   }
}

export function iOS(): boolean {
   return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
   ].includes(navigator.platform)
      // iPad on iOS 13 detection
      || (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
}