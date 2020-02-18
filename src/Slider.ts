import { htmlColor } from "./htmlColor";
import { ColorRange } from "./ColorRange";
import { glColor } from "./glColor";

/**
 * Interface for data passed to the Slider constructor
 */
export interface ISliderSetup {
   id: string,
   label: string,
   min: number,
   max: number,
   value: number,
   colors: htmlColor[],
   oninput?: () => void,
   getText?: (slider: Slider) => string,
}

/**
 * Class representing a slider composed of a label, input range, color span and value span
 */
export class Slider {

   private _range: HTMLInputElement;
   private _colorSpan: HTMLSpanElement;
   private _valueSpan: HTMLSpanElement;
   private _colors: ColorRange;
   private _getText: (slider: Slider) => string;

   /**
    * @param parent The parent html object.
    * @param setup The setup data object
    */
   public constructor(parent: HTMLElement, setup: ISliderSetup) {
      this._getText = setup.getText;

      let label = document.createElement('label');
      label.id = setup.id + 'Label';
      label.className = 'SliderLabel';
      label.innerText = setup.label;
      parent.appendChild(label);

      this._range = document.createElement('input');
      this._range.type = 'range';
      this._range.id = setup.id + 'Range';
      this._range.className = 'SliderRange';
      this._range.min = setup.min.toString();
      this._range.max = setup.max.toString();
      this._range.value = setup.value.toString();
      this._range.addEventListener('input', () => this.updateSpanColor());
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
      this.colors = setup.colors;

      this._range.oninput = setup.oninput;
   }

   /**
    * Sets the span color to the currently selected color.
    */
   private updateSpanColor(): void {
      let val = (this.value - this.min) / (this.max - this.min);
      let color = htmlColor.fromColor(this._colors.get(val));
      this._colorSpan.style.backgroundColor = color.toHex()
      if (this._getText) {
         this._valueSpan.innerText = this._getText(this);
      }
   }

   /**
    * Gets the html range object
    * 
    * @returns The html range object.
    */
   public get range(): HTMLInputElement {
      return this._range;
   }

   /**
    * Gets the current slider value
    * 
    * @returns the current slider value
    */
   public get value(): number {
      return this._range.valueAsNumber;
   }

   /**
    * Gets the min slider value.
    * 
    * @returns The min slider value.
    */
   public get min(): number {
      return parseFloat(this._range.min);
   }

   /**
    * Gets the max slider value.
    *
    * @returns The max slider value.
    */
   public get max(): number {
      return parseFloat(this._range.max);
   }

   /**
    * Sets the color for the slider
    */
   public set colors(colors: htmlColor[]) {

      // store the colors
      this._colors = new ColorRange(colors);

      // build the gradient style for the range object
      let gradientStr = '90deg';
      for (let i = 0; i < colors.length; i++) {
         gradientStr += ', ' + colors[i].toHex();
      }
      this._range.style.background = 'linear-gradient(' + gradientStr + ')';

      // update the span color too
      this.updateSpanColor();
   }

   /**
    * Gets the current color as an htmlColor object.
    *
    * @returns The current color.
    */
   public get htmlColor(): htmlColor {
      let val = (this.value - this.min) / (this.max - this.min);
      return this._colors.get(val);
   }

   /**
    * Gets the current color as a glColor object.
    * 
    * @returns The current color.
    */
   public get glColor(): glColor {
      let val = (this.value - this.min) / (this.max - this.min);
      return this._colors.get(val).toGlColor();
   }
}