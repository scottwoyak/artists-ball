import { Slider } from "./Slider";
import { htmlColor } from "./htmlColor";
import { Globals } from "./Globals";
import { glRenderer } from "./glRenderer";

enum PointerMode {
   View,
   Light,
}

export class PlanesApp {
   public renderer: glRenderer;
   private pointerMode: PointerMode = PointerMode.View;
   private pointerModeSpecial = false;
   private canvas: HTMLCanvasElement;

   private mouseDown = false;
   private oldX: number;
   private oldY: number;
   private dirty: boolean = true;

   private query: string;

   public constructor(query: string) {
      this.query = query;
   }

   public component(): HTMLElement {
      const div = document.createElement('div');

      const container = document.createElement('span');
      container.className = 'container';
      div.appendChild(container);

      this.canvas = document.createElement('canvas');
      this.canvas.id = 'canvas';
      container.appendChild(this.canvas);

      let context = this.canvas.getContext('webgl') as WebGLRenderingContext;

      if (!context) {
         // TODO display a message about not being able to create a WebGL context
         console.log("Unable to get WebGL context");
      }
      Globals.gl = context;

      this.canvas.ontouchstart = (event: TouchEvent) => {
         event.preventDefault();
         if (event.touches.length === 1) {

            this.onDown(event.touches[0].clientX, event.touches[0].clientY);
         }
      }

      this.canvas.ontouchmove = (event: TouchEvent) => {
         event.preventDefault();
         this.onMove(event.touches[0].clientX, event.touches[0].clientY);
      }

      this.canvas.ontouchend = (event: TouchEvent) => {
         event.preventDefault();
         this.mouseDown = false;
      }

      this.canvas.onmousedown = (event: MouseEvent) => {
         this.onDown(event.x, event.y);

         // disable selection because dragging is used for rotating the camera and moving objects
         return false;
      }

      this.canvas.onmousemove = (event: MouseEvent) => {
         this.onMove(event.x, event.y);
      }

      this.canvas.onmouseup = (event) => {
         this.mouseDown = false;
      };

      this.canvas.onmouseleave = (event) => {
         this.mouseDown = false;
      }

      this.renderer = new glRenderer();
      this.renderer.create(this.query).then(() => {
         requestAnimationFrame(() => this.tick());
      })

      let button = document.createElement('span');
      button.id = 'modeButton';
      button.innerHTML = 'View';
      this.pointerMode = PointerMode.View;
      button.onclick = () => {
         switch (this.pointerMode) {
            case PointerMode.View:
               button.innerHTML = 'Light';
               this.pointerMode = PointerMode.Light;
               break;

            case PointerMode.Light:
               button.innerHTML = 'View';
               this.pointerMode = PointerMode.View;
               break;
         }
      }
      container.appendChild(button);

      div.appendChild(document.createElement('br'));
      div.appendChild(document.createElement('br'));

      let lightSlider = new Slider(div, {
         id: 'LightIntensity',
         label: 'Light',
         min: 0,
         max: 100,
         value: this.renderer.lightIntensity * 100,
         colors: [htmlColor.black, htmlColor.white],
         oninput: () => {
            this.renderer.lightIntensity = lightSlider.value / 100;
            this.dirty = true;
         }
      });

      let ambientSlider = new Slider(div, {
         id: 'AmbientIntensity',
         label: 'Ambient',
         min: 0,
         max: 100,
         value: this.renderer.ambientIntensity * 100,
         colors: [htmlColor.black, htmlColor.white],
         oninput: () => {
            this.renderer.ambientIntensity = ambientSlider.value / 100;
            this.dirty = true;
         }
      });

      let t1Slider = new Slider(div, {
         id: 'Threshold1',
         label: 'Threshold 1',
         min: 0,
         max: 90,
         value: this.renderer.threshold1 * 90,
         oninput: () => {
            this.renderer.threshold1 = t1Slider.value / 90;
            this.dirty = true;
         },
         getText: () => { return (90 * this.renderer.threshold1).toFixed(0) + "º" }
      });

      let t2Slider = new Slider(div, {
         id: 'Threshold2',
         label: 'Threshold 2',
         min: 0,
         max: 90,
         value: this.renderer.threshold2 * 90,
         oninput: () => {
            this.renderer.threshold2 = t2Slider.value / 90;
            this.dirty = true;
         },
         getText: () => { return (90 * this.renderer.threshold2).toFixed(0) + "º" }
      });

      let lightLightSlider = new Slider(div, {
         id: 'LightLight',
         label: 'Light Light',
         min: 0,
         max: 100,
         value: this.renderer.lightLight * 100,
         colors: [htmlColor.black, htmlColor.white],
         oninput: () => {
            this.renderer.lightLight = lightLightSlider.value / 100;
            this.dirty = true;
         },
      });

      let midLightSlider = new Slider(div, {
         id: 'MidLight',
         label: 'Mid Light',
         min: 0,
         max: 100,
         value: this.renderer.midLight * 100,
         colors: [htmlColor.black, htmlColor.white],
         oninput: () => {
            this.renderer.midLight = midLightSlider.value / 100;
            this.dirty = true;
         },
      });

      let darkLightSlider = new Slider(div, {
         id: 'DarkLight',
         label: 'Dark Light',
         min: 0,
         max: 100,
         value: this.renderer.darkLight * 100,
         colors: [htmlColor.black, htmlColor.white],
         oninput: () => {
            this.renderer.darkLight = darkLightSlider.value / 100;
            this.dirty = true;
         },
      });

      return div;
   }

   private onDown(x: number, y: number) {

      if (this.click(x, y)) {
         return;
      };

      this.pointerModeSpecial = (x < 0.1 * this.canvas.width) ? true : false;

      this.oldX = x;
      this.oldY = y;

      this.mouseDown = true;
   }

   private onMove(x: number, y: number) {
      if (this.mouseDown) {
         this.dirty = true;

         if (this.pointerMode === PointerMode.View) {
            if (this.pointerModeSpecial) {
               this.renderer.model.rotZ((this.oldY - y) * 0.01);
            }
            else {
               this.renderer.model.rotX((y - this.oldY) * 0.01);
               this.renderer.model.rotY((x - this.oldX) * 0.01);
            }
         }
         else if (this.pointerMode === PointerMode.Light) {

            if (this.pointerModeSpecial) {
               /*
               this.pos.radius -= (y - this.oldY) * 0.005;
               this.pos.radius = clamp(this.pos.radius, Uniforms.uBallRadius + 0.5, 5);
               Uniforms.uLightPos.values = this.pos.toXYZ();
               */
            }
            else {
               /*
               this.pos.rotationAngle += (x - this.oldX);
               this.pos.elevationAngle += (y - this.oldY);
               this.pos.elevationAngle = clamp(this.pos.elevationAngle, 0, 180);
               Uniforms.uLightPos.values = this.pos.toXYZ();
               */
            }
         }

         // remember this coordinate
         this.oldX = x;
         this.oldY = y;
      }
   }

   /**
    * Processes a click/touch event at the designated coordinates. If a hit
    * occurs, the clicked on view is swapped for the primary view and true
    * is returned. If no hit occurs, false is returned.
    * 
    * @param x The x coordinate.
    * @param y The y coordinate.
    * @returns true if a hit on one of the views occurs.
    */
   private click(x: number, y: number): boolean {

      return false;
   }

   public tick() {

      if (this.dirty) {
         this.renderer.render();
         this.dirty = false;
      }

      requestAnimationFrame(() => this.tick());
   }
}
