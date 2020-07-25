import { htmlColor } from "../Util/htmlColor";
import { ICtrl } from "./ICtrl";
import { ColorRange } from "./ColorRange";
import { htmlColorWithAlpha } from "../Util/htmlColorWithAlpha";
import { glColor3 } from "../gl/glColor";

/**
 * Interface for data passed to the Slider constructor
 */
export interface ISliderSetup {
   id?: string,
   label: string,
   min: number,
   max: number,
   value: number,
   colors?: htmlColor[],
   oninput?: (slider: Slider) => void,
   getText?: (slider: Slider) => string,
}

class RangeMapper {
   public readonly sliderMin = 0;
   public readonly sliderMax = 1000;
   public readonly realMin: number;
   public readonly realMax: number;

   public get realRange(): number {
      return this.realMax - this.realMin;
   }

   public get sliderRange(): number {
      return this.sliderMax - this.sliderMin;
   }

   public constructor(realMin: number, realMax: number) {
      this.realMin = realMin;
      this.realMax = realMax;
   }

   public sliderToReal(sliderValue: number): number {
      return this.realMin + ((sliderValue - this.sliderMin) / this.sliderRange) * this.realRange;
   }

   public realToSlider(realValue: number): number {
      return this.sliderMin + ((realValue - this.realMin) / this.realRange) * this.sliderRange;
   }
}

/**
 * Class representing a slider composed of a label, input range, color span and value span
 */
export class Slider implements ICtrl {

   private _label: HTMLLabelElement;
   private _range: HTMLInputElement;
   private _colorSpan: HTMLSpanElement;
   private _valueSpan: HTMLSpanElement;
   private _colors: ColorRange;
   private _getText: (slider: Slider) => string;
   private _rangeMapper: RangeMapper;

   public set enabled(value: boolean) {
      this._range.disabled = !value;
      if (value) {
         this._label.classList.remove('disabled');
         this._valueSpan.classList.remove('disabled');
         this._range.classList.remove('disabled');
      }
      else {
         this._label.classList.add('disabled');
         this._valueSpan.classList.add('disabled');
         this._range.classList.add('disabled');
      }
   }
   public get enabled(): boolean {
      return !this._range.disabled;
   }


   /**
    * @param parent The parent html object.
    * @param setup The setup data object
    */
   public constructor(parent: HTMLElement, setup: ISliderSetup) {

      let id = setup.id ?? 'Slider';
      this._getText = setup.getText;

      let div = document.createElement('div');
      div.id = id;
      div.className = 'SliderDiv';
      parent.appendChild(div);

      this._label = document.createElement('label');
      this._label.id = id + 'Label';
      this._label.className = 'SliderLabel';
      this._label.innerText = setup.label ?? '';
      div.appendChild(this._label);

      this._rangeMapper = new RangeMapper(setup.min, setup.max);

      this._range = document.createElement('input');
      this._range.type = 'range';
      this._range.id = id + 'Range';
      this._range.className = 'SliderRange';
      this._range.min = this._rangeMapper.sliderMin.toString();
      this._range.max = this._rangeMapper.sliderMax.toString();
      this._range.value = this._rangeMapper.realToSlider(setup.value).toString();
      this._range.addEventListener('input', () => {
         this.updateSpanColor();
         this.updateSpanText()
      });
      this._label.htmlFor = this._range.id;
      div.appendChild(this._range);

      if (setup.colors) {
         this._colorSpan = document.createElement('span');
         this._colorSpan.id = id + 'ColorSpan';
         this._colorSpan.className = 'SliderColorSpan';
         div.appendChild(this._colorSpan);

         // set the initial color.
         this.colors = setup.colors;
      }

      this._valueSpan = document.createElement('span');
      this._valueSpan.id = id + 'ValueSpan';
      this._valueSpan.className = 'SliderValueSpan';
      //      this._valueSpan.innerText = setup.value.toString();
      div.appendChild(this._valueSpan);

      // set the initial span text
      this.updateSpanText();

      if (setup.oninput) {
         this._range.oninput = () => setup.oninput(this);
      }
   }

   /**
    * Sets the span color to the currently selected color.
    */
   private updateSpanColor(): void {
      if (this._colors) {
         let val = (this.value - this.min) / (this.max - this.min);
         let color = htmlColor.fromColor(this._colors.get(val));
         this._colorSpan.style.backgroundColor = color.toHex()
      }
   }

   /**
 * Sets the span color to the currently selected color.
 */
   private updateSpanText(): void {
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
      return this._rangeMapper.sliderToReal(this._range.valueAsNumber);
   }

   /**
    * Sets the value of the slider (and associated content)
    * 
    * @param val the desired slider value
    */
   public set value(val: number) {
      this._range.valueAsNumber = this._rangeMapper.realToSlider(val);
      this.updateSpanColor();
      this.updateSpanText();
   }

   /**
    * Gets the value of the slider as a percent [0-1] of the range
    * 
    * @returns the value of the slider as a percent
    */
   public get valueAsPercent(): number {
      return this.value / (this.max - this.min);
   }

   /**
    * Gets the min slider value.
    * 
    * @returns The min slider value.
    */
   public get min(): number {
      return this._rangeMapper.realMin;
   }

   /**
    * Gets the max slider value.
    *
    * @returns The max slider value.
    */
   public get max(): number {
      return this._rangeMapper.realMax;
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
         gradientStr += ', ' + colors[i].toCss();
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
      if (this._colors) {
         let val = (this.value - this.min) / (this.max - this.min);
         return this._colors.get(val);
      }
      else {
         return htmlColorWithAlpha.transparent;
      }
   }

   /**
    * Gets the current color as a glColor object.
    * 
    * @returns The current color.
    */
   public get glColor(): glColor3 {
      if (this._colors) {
         let val = (this.value - this.min) / (this.max - this.min);
         return this._colors.get(val).toGlColor();
      }
      else {
         return new glColor3([0, 0, 0]);
      }
   }

   public refresh() {
      // TODO implement
   }
}