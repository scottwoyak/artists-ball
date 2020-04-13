import { Vec3, Vec2 } from "./Vec";
import { PathTracerRenderer, RenderMode } from "./PathTracerRenderer";
import { Mat4 } from "./Mat";
import { SphericalCoord } from "./SphericalCoord";
import { Slider } from "./Slider";
import { htmlColor } from "./htmlColor";
import { glColorWithTemperature } from "./glColorWithTemperature";
import { clamp, isMobile } from "./Globals";
import { TriangleObj } from "./TriangleObj";
import { TriangleObjFile } from "./TriangleObjFile";
import { TriangleObjBuilder } from "./TriangleObjBuilder";
import { Profiler } from "./Profiler";
import { IApp } from "./IApp";
import { Menubar } from "./Menu";
import { PointerEventHandler } from "./PointerEventHandler";

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

export class PathTracerApp implements IApp {
   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;
   public renderer: PathTracerRenderer;
   private modelview: Mat4;
   private projection: Mat4;
   private modelviewProjection: Mat4;
   private pointerMode: PointerMode = PointerMode.View;
   private pointerModeSpecial = false;
   private pos: SphericalCoord;
   private canvas: HTMLCanvasElement;
   private animationFrame: number;

   private intensitySlider: Slider;
   private lightColorSlider: Slider;
   private ballColorSlider: Slider;
   private ambientIntensitySlider: Slider;

   private angleX = 0.5;
   private angleY = 0.75;
   private zoomZ = 3.5;

   private lastTimes: number[] = [];
   private readonly MAX_SAMPLES = 500;

   private query: string;

   public constructor(query: string) {
      this.query = query;
   }

   public create(div: HTMLDivElement) {

      div.className = 'PathTracerApp';

      const container = document.createElement('div');
      container.className = 'container';
      div.appendChild(container);

      this.canvas = document.createElement('canvas');
      this.canvas.id = 'canvasx';
      container.appendChild(this.canvas);

      let context: WebGLRenderingContext | WebGL2RenderingContext = this.canvas.getContext('webgl2');

      if (!context) {
         context = this.canvas.getContext('webgl') as WebGLRenderingContext;
      }

      if (!context) {
         // TODO display a message about not being able to create a WebGL context
         console.log("Unable to get WebGL context");
      }
      this.gl = context;

      let size = 512;
      if (isMobile) {
         size = document.body.clientWidth;
      }
      this.gl.canvas.width = size;
      this.gl.canvas.height = size;
      div.style.width = size + 'px';
      container.style.height = size + 'px';

      this.renderer = new PathTracerRenderer(this.gl);

      let handler = new PointerEventHandler(this.canvas);
      handler.onDrag = (pos: Vec2, delta: Vec2) => this.onMove(pos, delta);
      handler.onClick = (pos: Vec2) => this.click(pos.x, pos.y);
      handler.onDown = (pos: Vec2) => this.onDown(pos.x, pos.y);

      this.loadModel(this.query).then((tObj: TriangleObj) => {
         this.renderer.setObj(tObj);
         requestAnimationFrame(() => this.tick());
      })

      let drawTime = document.createElement('div');
      drawTime.id = 'drawTime';
      container.appendChild(drawTime);

      let description = document.createElement('div');
      description.id = 'description';
      container.appendChild(description);

      let button = document.createElement('div');
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

      let progressBar = document.createElement('div');
      progressBar.id = 'progressBar';
      container.appendChild(progressBar);

      this.intensitySlider = new Slider(div, {
         id: 'LightIntensity',
         label: 'Light Intensity',
         min: 0,
         max: 100,
         value: this.renderer.uniforms.uLightIntensity * 100,
         colors: [htmlColor.black, htmlColor.white],
         oninput: () => {
            this.renderer.uniforms.uLightIntensity = this.intensitySlider.value / 100;
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
            this.renderer.uniforms.uObjColor = this.ballColorSlider.glColor;
            this.restart();
         }
      });

      // make sure gl matches the initial UI setting
      this.renderer.uniforms.uObjColor = this.ballColorSlider.glColor;

      this.ambientIntensitySlider = new Slider(div, {
         id: 'AmbientIntensity',
         label: 'Ambient Light',
         min: 0,
         max: 100,
         value: this.renderer.uniforms.uAmbientLightIntensity * 100,
         colors: [htmlColor.black, htmlColor.white],
         oninput: () => {
            this.renderer.uniforms.uAmbientLightIntensity = this.ambientIntensitySlider.value / 100;
            this.restart();
         }
      });
   }

   public delete() {
      cancelAnimationFrame(this.animationFrame);
      this.renderer.delete();
   }

   public buildMenu(menubar: Menubar) {
   }

   private loadModel(query: string): Promise<TriangleObj> {
      if (query && query.toLowerCase() === 'sphere') {
         this.renderer.uniforms.uBallRadius = 0;
         let radius = 0.5;
         let center = new Vec3([0, radius, 0]);
         let tObj = new TriangleObjBuilder();
         tObj.addSphere(8, radius, center);
         return Promise.resolve(tObj);
      }
      else if (query && query.toLowerCase() === 'cube') {
         this.renderer.uniforms.uBallRadius = 0;
         let size = 0.8;
         let center = new Vec3([0, size / 2.0, 0]);
         let tObj = new TriangleObjBuilder();
         tObj.addCube(size, center);
         return Promise.resolve(tObj);
      }
      else if (query && query.toLowerCase().endsWith('.obj')) {
         this.renderer.uniforms.uBallRadius = 0;
         return fetch(query)
            .then(res => res.text())
            .then(res => {
               let tObj = new TriangleObjFile(query, res);
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
      this.renderer.uniforms.uLightColor = this.lightColorSlider.glColor;

      this.restart();
   }

   private onDown(x: number, y: number) {

      this.pointerModeSpecial = (x < 0.1 * this.canvas.width) ? true : false;

      this.pos = SphericalCoord.fromXYZ(this.renderer.uniforms.uLightPos.values);
   }

   private onMove(pos: Vec2, delta: Vec2) {
      if (this.pointerMode === PointerMode.View) {
         if (this.pointerModeSpecial) {
            this.zoomZ -= (delta.y) * 0.01;
            this.zoomZ = clamp(this.zoomZ, 1, 8);
         }
         else {
            // update the angles based on how far we moved since last time
            this.angleY -= (delta.x) * 0.01;
            this.angleX += (delta.y) * 0.01;

            // don't go upside down
            this.angleX = Math.max(this.angleX, -Math.PI / 2 + 0.01);
            this.angleX = Math.min(this.angleX, Math.PI / 2 - 0.01);
         }
      }
      else if (this.pointerMode === PointerMode.Light) {

         if (this.pointerModeSpecial) {
            this.pos.radius -= (delta.y) * 0.005;
            this.pos.radius = clamp(this.pos.radius, this.renderer.uniforms.uBallRadius + 0.5, 5);
            this.renderer.uniforms.uLightPos.values = this.pos.toXYZ();
         }
         else {
            this.pos.rotationAngle += (-delta.x);
            this.pos.elevationAngle += (-delta.y);
            this.pos.elevationAngle = clamp(this.pos.elevationAngle, 0, 180);
            this.renderer.uniforms.uLightPos.values = this.pos.toXYZ();
         }
      }

      // clear the sample buffer
      this.restart();
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
      this.modelview = Mat4.makeLookAt(
         this.renderer.uniforms.uEye,
         new Vec3([0, 1, 0]),  // center point
         new Vec3([0, 1, 0])   // up vector
      );

      this.projection = Mat4.makePerspective(55, 1, 0.1, 100);
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
      if (this.renderer.uniforms.uSample < this.MAX_SAMPLES) {
         this.renderer.uniforms.uEye.values[0] = this.zoomZ * Math.sin(this.angleY) * Math.cos(this.angleX);
         this.renderer.uniforms.uEye.values[1] = this.zoomZ * Math.sin(this.angleX);
         this.renderer.uniforms.uEye.values[2] = this.zoomZ * Math.cos(this.angleY) * Math.cos(this.angleX);

         this.updateTexture();
         this.displayTexture();
      }

      this.animationFrame = requestAnimationFrame(() => this.tick());
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

      drawTimeLabel.style.visibility = this.renderer.uniforms.uSample < this.MAX_SAMPLES ? 'visible' : 'hidden';
   }

   private updateProgress() {
      let progress = this.renderer.uniforms.uSample / this.MAX_SAMPLES;
      let bar = document.getElementById('progressBar') as HTMLElement;
      if (progress >= 0 && progress < 1) {
         bar.style.visibility = 'visible';
         let w = this.canvas.width;
         bar.style.right = w * (1 - progress) + 'px';
      }
      else {
         bar.style.visibility = 'hidden';
      }
   }
}

