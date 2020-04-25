import { Panel } from "./Panel";
import { ValuePlanes } from "./ValuePlanes";
import { Slider } from "./Slider";
import { ValuePlanesCtrl } from "./ValuePlanesCtrl";
import { glColor3 } from "./glColor";
import { ValueRange } from "./ValueRange";
import { Renderer, Contour } from "./Renderer";

export type ValuePlanesChangeFunction = (panel: ValuePlanesPanel) => void;

export class ValuePlanesPanel extends Panel {

   public valuePlanes: ValuePlanes;
   private highlightSlider: Slider
   private lightLightSlider: Slider;
   private midLightSlider: Slider;
   private darkLightSlider: Slider;
   private shadowSlider: Slider;
   private valuePlanesCtrl: ValuePlanesCtrl;
   public onChange: ValuePlanesChangeFunction;

   public constructor(parent: HTMLElement, id: string, valueRange: ValueRange) {
      super(parent, id);

      this.valuePlanes = new ValuePlanes(valueRange);

      let div = document.createElement('div');
      div.className = 'SlidersDiv';
      this.div.appendChild(div);

      this.createCtrlsElements(div);

      this.valuePlanesCtrl = new ValuePlanesCtrl(
         this.div,
         this.valuePlanes,
         (value: number) => {
            this.updateSliders();
            if (this.onChange) {
               this.onChange(this);
            }
         },
         (value: number) => {
            this.updateSliders();
            if (this.onChange) {
               this.onChange(this);
            }
         }
      );
   }

   private createCtrlsElements(parent: HTMLElement) {

      this.highlightSlider = new Slider(parent, {
         id: 'Highlight',
         label: 'Highlight',
         min: 0,
         max: 100,
         value: this.valuePlanes.highlight * 100,
         colors: [glColor3.modelBlack.toHtmlColor(), glColor3.modelWhite.toHtmlColor()],
         oninput: () => {
            this.valuePlanes.highlight = this.highlightSlider.value / 100;
            this.updateSliders();
            this.valuePlanesCtrl.draw();
            if (this.onChange) {
               this.onChange(this);
            }
         },
         getText: () => { return (100 * this.valuePlanes.highlight).toFixed(0) + "%" }
      });

      this.lightLightSlider = new Slider(parent, {
         id: 'LightLight',
         label: 'Light Light',
         min: 0,
         max: 100,
         value: this.valuePlanes.lightLight * 100,
         colors: [glColor3.modelBlack.toHtmlColor(), glColor3.modelWhite.toHtmlColor()],
         getText: () => { return (100 * this.valuePlanes.lightLight).toFixed(0) + "%" }
      });
      this.lightLightSlider.range.disabled = true;

      this.midLightSlider = new Slider(parent, {
         id: 'MidLight',
         label: 'Mid Light',
         min: 0,
         max: 100,
         value: this.valuePlanes.midLight * 100,
         colors: [glColor3.modelBlack.toHtmlColor(), glColor3.modelWhite.toHtmlColor()],
         getText: () => { return (100 * this.valuePlanes.midLight).toFixed(0) + "%" }
      });
      this.midLightSlider.range.disabled = true;

      this.darkLightSlider = new Slider(parent, {
         id: 'DarkLight',
         label: 'Dark Light',
         min: 0,
         max: 100,
         value: this.valuePlanes.darkLight * 100,
         colors: [glColor3.modelBlack.toHtmlColor(), glColor3.modelWhite.toHtmlColor()],
         getText: () => { return (100 * this.valuePlanes.darkLight).toFixed(0) + "%" }
      });
      this.darkLightSlider.range.disabled = true;

      this.shadowSlider = new Slider(parent, {
         id: 'Shadow',
         label: 'Shadow',
         min: 0,
         max: 100,
         value: this.valuePlanes.shadow * 100,
         colors: [glColor3.modelBlack.toHtmlColor(), glColor3.modelWhite.toHtmlColor()],
         oninput: () => {
            this.valuePlanes.shadow = this.shadowSlider.value / 100;
            this.updateSliders();
            this.valuePlanesCtrl.draw();
            if (this.onChange) {
               this.onChange(this);
            }
         },
         getText: () => { return (100 * this.valuePlanes.shadow).toFixed(0) + "%" }
      });
   }

   private updateSliders() {
      this.highlightSlider.value = 100 * this.valuePlanes.highlight;
      this.lightLightSlider.value = 100 * this.valuePlanes.lightLight;
      this.midLightSlider.value = 100 * this.valuePlanes.midLight;
      this.darkLightSlider.value = 100 * this.valuePlanes.darkLight;
      this.shadowSlider.value = 100 * this.valuePlanes.shadow;
   }

   public toRenderer(renderer: Renderer) {
      renderer.contours = [
         new Contour(this.valuePlanes.lightLight, this.valuePlanes.threshold1),
         new Contour(this.valuePlanes.midLight, this.valuePlanes.threshold2),
         new Contour(this.valuePlanes.darkLight, 90)
      ];
      renderer.valueRange = new ValueRange(
         this.valuePlanes.highlight,
         this.valuePlanes.shadow,
         this.valuePlanes.highlight - this.valuePlanes.lightLight
      );

   }
}