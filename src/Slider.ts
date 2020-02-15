import { htmlColor } from "./htmlColor";
import { ColorRange } from "./ColorRange";

export interface ISliderSetup {
   id: string,
   label: string,
   min: number,
   max: number,
   value: number,
   colors: htmlColor[]
}

export class Slider {

   private _range: HTMLInputElement;
   private _colorSpan: HTMLSpanElement;
   private _valueSpan: HTMLSpanElement;
   private _colors: ColorRange;

   public constructor(parent: HTMLElement, setup: ISliderSetup) {
      let label = document.createElement('label');
      label.id = setup.id + 'Label';
      label.className = 'SliderLabel';
      label.innerText = setup.label;
      parent.appendChild(label);

      this._colors = new ColorRange(setup.colors);

      this._range = document.createElement('input');
      this._range.type = 'range';
      this._range.id = setup.id + 'Range';
      this._range.className = 'SliderRange';
      this._range.min = setup.min.toString();
      this._range.max = setup.max.toString();
      this._range.value = setup.value.toString();
      this._range.addEventListener('input', () => this.onInput());

      let gradientStr = '90deg';
      for (let i = 0; i < setup.colors.length; i++) {
         gradientStr += ', ' + setup.colors[i].toHex();
      }
      this._range.style.background = 'linear-gradient(' + gradientStr + ')';

      parent.appendChild(this._range);

      this._colorSpan = document.createElement('span');
      this._colorSpan.id = setup.id + 'ColorSpan';
      this._colorSpan.className = 'SliderColorSpan';
      parent.appendChild(this._colorSpan);

      this._valueSpan = document.createElement('span');
      this._valueSpan.id = setup.id + 'ValueSpan';
      this._valueSpan.className = 'SliderValueSpan';
      //      this._valueSpan.innerText = setup.value.toString();
      parent.appendChild(this._valueSpan);

      // set the initial color
      this.onInput();
   }

   private onInput(): void {
      let val = (this.value - this.min) / (this.max - this.min);
      let color = htmlColor.fromColor(this._colors.get(val));
      this._colorSpan.style.backgroundColor = color.toHex()
   }

   get range(): HTMLInputElement {
      return this._range;
   }

   get value(): number {
      return this._range.valueAsNumber;
   }

   get min(): number {
      return parseFloat(this._range.min);
   }

   get max(): number {
      return parseFloat(this._range.max);
   }

   set color(color: htmlColor) {
      this._colorSpan.style.backgroundColor = color.toHex();
   }

   set text(value: string) {
      this._valueSpan.innerText = value;
   }

   set background(value: string) {
      this._range.style.background = value;
   }
}