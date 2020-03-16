import { glVec3 } from "./glVec";
import { glMat4 } from "./glMat";
import { Uniforms } from "./Uniforms";
import { SphericalCoord } from "./SphericalCoord";
import { Slider } from "./Slider";
import { htmlColor } from "./htmlColor";
import { Globals } from "./Globals";
import { hsvColor } from "./hsvColor";
import { glRenderer } from "./glRenderer";

enum PointerMode {
   View,
   Light,
}

export class PlanesApp {
   public renderer: glRenderer;
   private modelview: glMat4;
   private projection: glMat4;
   private modelviewProjection: glMat4;
   private pointerMode: PointerMode = PointerMode.View;
   private pointerModeSpecial = false;
   private pos: SphericalCoord;
   private canvas: HTMLCanvasElement;

   private intensitySlider: Slider;
   private lightColorSlider: Slider;
   private ballColorSlider: Slider;
   private ambientIntensitySlider: Slider;

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

      this.intensitySlider = new Slider(div, {
         id: 'LightIntensity',
         label: 'Light Intensity',
         min: 0,
         max: 100,
         value: Uniforms.uLightIntensity * 100,
         colors: [htmlColor.black, htmlColor.white],
         oninput: () => {
            Uniforms.uLightIntensity = this.intensitySlider.value / 100;
         }
      });

      // build a range of colors
      let colors = [];
      for (let i = 0; i < 10; i++) {
         colors.push(new hsvColor([i / 9, 0.5, 0.8]).toHtmlColor());
      }
      this.lightColorSlider = new Slider(div, {
         id: 'LightColor',
         label: 'Light Color',
         min: 0,
         max: 360,
         value: 180,
         colors: colors,
         oninput: () => {
            this.setLightColor();
         },
         getText: (slider: Slider) => { return slider.value.toFixed() }
      });

      // apply the initial colors
      this.setLightColor();

      this.ballColorSlider = new Slider(div, {
         id: 'BallColor',
         label: 'Ball Color',
         min: 0,
         max: 360,
         value: 180,
         colors: colors,
         oninput: () => {
            Uniforms.uObjColor = this.ballColorSlider.glColor;
         },
         getText: (slider: Slider) => { return slider.value.toFixed() }
      });

      // make sure gl matches the initial UI setting
      Uniforms.uObjColor = this.ballColorSlider.glColor;

      this.ambientIntensitySlider = new Slider(div, {
         id: 'AmbientIntensity',
         label: 'Ambient Light',
         min: 0,
         max: 100,
         value: Uniforms.uAmbientLightIntensity * 100,
         colors: [htmlColor.black, htmlColor.white],
         oninput: () => {
            Uniforms.uAmbientLightIntensity = this.ambientIntensitySlider.value / 100;
         }
      });

      return div;
   }

   private setLightColor() {

      // update the colors for the intensity slider
      this.intensitySlider.colors = [htmlColor.black, this.lightColorSlider.htmlColor];

      // use the value in rendering
      Uniforms.uLightColor = this.lightColorSlider.glColor;
   }

   private onDown(x: number, y: number) {

      if (this.click(x, y)) {
         return;
      };

      this.pointerModeSpecial = (x < 0.1 * this.canvas.width) ? true : false;

      this.oldX = x;
      this.oldY = y;

      this.pos = SphericalCoord.fromXYZ(Uniforms.uLightPos.values);

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
