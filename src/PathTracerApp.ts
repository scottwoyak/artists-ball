import { glVec3 } from "./glVec";
import { PathTracerRenderer, RenderMode } from "./PathTracerRenderer";
import { glMat4 } from "./glMat";
import { Uniforms } from "./Uniforms";
import { SphericalCoord } from "./SphericalCoord";
import { Slider } from "./Slider";
import { htmlColor } from "./htmlColor";
import { glColorWithTemperature } from "./glColorWithTemperature";
import { Globals, clamp } from "./Globals";
import { TriangleObj } from "./TriangleObj";
import { TriangleSphere } from "./TriangleSphere";
import { TriangleCube } from "./TriangleCube";
import { TriangleObjFile } from "./TriangleObjFile";

let skinTones = [
   new htmlColor([240, 223, 214]),
   new htmlColor([255, 218, 200]),
   new htmlColor([232, 179, 117]),
   new htmlColor([190, 136, 87]),
   //   new htmlColor([115, 91, 59]),
   new htmlColor([139, 73, 65])
   //   new htmlColor([132, 55, 34]),
   //new htmlColor([61, 12, 2]),
   //   new htmlColor([38, 7, 1])
];

enum PointerMode {
   View,
   Light,
}

export class PathTracerApp {
   public renderer: PathTracerRenderer;
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

   private angleX = 0.5;
   private angleY = 0.75;
   private zoomZ = 3.5;

   private mouseDown = false;
   private oldX: number;
   private oldY: number;

   private lastTimes: number[] = [];
   private readonly MAX_SAMPLES = 500;

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

      let context: WebGLRenderingContext | WebGL2RenderingContext = this.canvas.getContext('webgl2');

      if (!context) {
         context = this.canvas.getContext('webgl') as WebGLRenderingContext;
      }

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

      this.loadModel(this.query).then((tObj: TriangleObj) => {
         this.renderer = new PathTracerRenderer(tObj);
         //this.renderer.setModel(tObj);
         requestAnimationFrame(() => this.tick());
      })

      let drawTime = document.createElement('div');
      drawTime.id = 'drawTime';
      container.appendChild(drawTime);

      let description = document.createElement('div');
      description.id = 'description';
      container.appendChild(description);

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

      let progressSpan = document.createElement('span');
      progressSpan.id = 'progressSpan';
      container.appendChild(progressSpan);

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
            this.restart();
         }
      });

      // build a range of colors
      let min = 2000;
      let max = 10000;
      let colors: htmlColor[] = [];
      for (let i = 0; i < 10; i++) {
         let temp = min + (i / 9) * (max - min);
         colors.push(glColorWithTemperature.create(temp).toHtmlColor());
      }
      this.lightColorSlider = new Slider(div, {
         id: 'LightColor',
         label: 'Light Color',
         min: 2000,
         max: 10000,
         value: glColorWithTemperature.daylight.temperature,
         colors: colors,
         oninput: () => {
            this.setLightColor();
         },
         getText: (slider: Slider) => { return slider.value.toFixed() + "K" }
      });

      // apply the initial colors
      this.setLightColor();

      this.ballColorSlider = new Slider(div, {
         id: 'BallColor',
         label: 'Ball Color',
         min: 0,
         max: 100,
         value: 50,
         colors: skinTones,
         oninput: () => {
            Uniforms.uObjColor = this.ballColorSlider.glColor;
            this.restart();
         }
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
            this.restart();
         }
      });

      return div;
   }

   private loadModel(query: string): Promise<TriangleObj> {
      if (query && query.toLowerCase() === 'trianglesphere') {
         Uniforms.uBallRadius = 0;
         let radius = 0.5;
         let center = new glVec3([0, radius, 0]);
         let tObj = new TriangleSphere(8, radius, center);
         tObj.breakIntoVolumes();
         return Promise.resolve(tObj);
      }
      else if (query && query.toLowerCase() === 'trianglecube') {
         Uniforms.uBallRadius = 0;
         let size = 0.8;
         let center = new glVec3([0, size / 2.0, 0]);
         let tObj = new TriangleCube(size, center);
         return Promise.resolve(tObj);
      }
      else if (query && query.toLowerCase().endsWith('.obj')) {
         Uniforms.uBallRadius = 0;
         return fetch(query)
            .then(res => res.text())
            .then(res => {
               let tObj = new TriangleObjFile(query, res);
               let size = 1.5;
               tObj.autoCenter(size);
               tObj.translate(new glVec3([0, tObj.height / 2, 0]));
               tObj.breakIntoVolumes();
               return tObj;
            });
      }
      else {
         return Promise.resolve(null);
      }
   }

   private setLightColor() {

      // update the colors for the intensity slider
      this.intensitySlider.colors = [htmlColor.black, this.lightColorSlider.htmlColor];

      // use the value in rendering
      Uniforms.uLightColor = this.lightColorSlider.glColor;

      this.restart();
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
         if (this.pointerMode === PointerMode.View) {
            if (this.pointerModeSpecial) {
               this.zoomZ -= (y - this.oldY) * 0.01;
               this.zoomZ = clamp(this.zoomZ, 1, 8);
            }
            else {
               // update the angles based on how far we moved since last time
               this.angleY -= (x - this.oldX) * 0.01;
               this.angleX += (y - this.oldY) * 0.01;

               // don't go upside down
               this.angleX = Math.max(this.angleX, -Math.PI / 2 + 0.01);
               this.angleX = Math.min(this.angleX, Math.PI / 2 - 0.01);
            }
         }
         else if (this.pointerMode === PointerMode.Light) {

            if (this.pointerModeSpecial) {
               this.pos.radius -= (y - this.oldY) * 0.005;
               this.pos.radius = clamp(this.pos.radius, Uniforms.uBallRadius + 0.5, 5);
               Uniforms.uLightPos.values = this.pos.toXYZ();
            }
            else {
               this.pos.rotationAngle += (x - this.oldX);
               this.pos.elevationAngle += (y - this.oldY);
               this.pos.elevationAngle = clamp(this.pos.elevationAngle, 0, 180);
               Uniforms.uLightPos.values = this.pos.toXYZ();
            }
         }

         // clear the sample buffer
         this.restart();

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
      // TODO handle this within the PathTracer class so that we don't have to hard code view stuff
      let size = 0.2 * this.canvas.width;

      if (y < size) {

         if (x > this.canvas.width - 1 * size) {
            this.swap(2);
            this.setDescription();
            return true;
         }
         else if (x > this.canvas.width - 2 * size) {
            this.swap(1);
            this.setDescription();
            return true;
         }
         else if (x > this.canvas.width - 3 * size) {
            this.swap(0);
            this.setDescription();
            return true;
         }
      }

      return false;
   }

   private setDescription() {
      let description = document.getElementById('description');
      switch (this.renderer.renderMode) {
         case RenderMode.Artist:
            description.innerText = "";
            break;

         case RenderMode.Chroma:
            description.innerText = "Chroma View: red=highest chroma";
            break;

         case RenderMode.Value:
            description.innerText = "Value View";
            break;

         case RenderMode.Bands:
            description.innerText = "5 Color + Highlight View";
            break;
      }
   }

   private updateTexture() {
      this.modelview = glMat4.makeLookAt(
         Uniforms.uEye,
         new glVec3([0, 1, 0]),  // center point
         new glVec3([0, 1, 0])   // up vector
      );

      this.projection = glMat4.makePerspective(55, 1, 0.1, 100);
      this.modelviewProjection = this.projection.multM(this.modelview);
      this.renderer.updateTexture(this.modelviewProjection);
   };

   private displayTexture(): void {
      this.renderer.displayTexture();
   };

   public restart(): void {
      if (this.renderer) {
         this.renderer.restart();
      }
   }

   public swap(pos: number) {
      this.renderer.swap(pos);
   }

   public tick() {

      this.updateTimerLabel();
      this.updateProgress();
      if (Uniforms.uSample < this.MAX_SAMPLES) {
         Uniforms.uEye.values[0] = this.zoomZ * Math.sin(this.angleY) * Math.cos(this.angleX);
         Uniforms.uEye.values[1] = this.zoomZ * Math.sin(this.angleX);
         Uniforms.uEye.values[2] = this.zoomZ * Math.cos(this.angleY) * Math.cos(this.angleX);

         this.updateTexture();
         this.displayTexture();
      }

      requestAnimationFrame(() => this.tick());
   }

   private updateTimerLabel() {

      let t = window.performance.now();
      let drawTimeLabel = document.getElementById('drawTime');
      if (this.lastTimes.length > 0) {
         let elapsedMs = (t - this.lastTimes[0]) / this.lastTimes.length;
         drawTimeLabel.innerText = elapsedMs.toFixed(0) + 'ms';
      }
      this.lastTimes.push(t);
      if (this.lastTimes.length > 30) {
         this.lastTimes.shift();
      }

      drawTimeLabel.style.visibility = Uniforms.uSample < this.MAX_SAMPLES ? 'visible' : 'hidden';
   }

   private updateProgress() {
      let progress = Uniforms.uSample / this.MAX_SAMPLES;
      let span = document.getElementById('progressSpan') as HTMLSpanElement;
      if (progress >= 0 && progress < 1) {
         span.style.visibility = 'visible';
         let w = this.canvas.width;
         span.style.right = w * (1 - progress) + 'px';
      }
      else {
         span.style.visibility = 'hidden';
      }
   }
}

