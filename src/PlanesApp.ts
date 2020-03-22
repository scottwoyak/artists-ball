import { Slider } from "./Slider";
import { htmlColor } from "./htmlColor";
import { Globals, toRad } from "./Globals";
import { PlanesRenderer } from "./PlanesRenderer";
import { SphericalCoord } from "./SphericalCoord";
import { glMat4 } from "./glMat";
import { glVec4, glVec3 } from "./glVec";
import { NormalType, TriangleObj } from "./TriangleObj";
import { TriangleSphere } from "./TriangleSphere";
import { TriangleCube } from "./TriangleCube";
import { TriangleObjFile } from "./TriangleObjFile";

enum PointerMode {
   View,
   Light,
}

export class PlanesApp {
   public renderer: PlanesRenderer;
   private pointerMode: PointerMode = PointerMode.View;
   private pointerModeSpecial = false;
   private canvas: HTMLCanvasElement;

   private mouseDown = false;
   private oldX: number;
   private oldY: number;
   private dirty: boolean = true;

   private query: string;

   private threshold1Slider: Slider;
   private threshold2Slider: Slider;
   private lightLightSlider: Slider;
   private midLightSlider: Slider;
   private darkLightSlider: Slider;

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

      this.renderer = new PlanesRenderer();

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

      document.onkeypress = (event: KeyboardEvent) => {
         if (event.key === 'o') {
            this.renderer.optimize(NormalType.Smooth);
         }
         else if (event.key === 'p') {
            this.renderer.optimize(NormalType.Flat);
         }
      }

      this.loadModel(this.query).then((tObj: TriangleObj) => {
         //this.renderer.setModel(tObj);
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

      /*
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
      */

      let syncLabel = document.createElement('label');
      syncLabel.id = 'SyncLabel';
      syncLabel.className = 'Label';
      syncLabel.innerText = 'Synchronize Values';
      div.appendChild(syncLabel);

      let syncCheckbox = document.createElement('input');
      syncCheckbox.type = 'checkbox';
      syncCheckbox.id = 'SyncCheckBox';
      syncCheckbox.className = 'SyncCheckBox';
      syncCheckbox.checked = this.renderer.sync;
      syncCheckbox.oninput = () => {
         this.renderer.sync = !this.renderer.sync;
         this.updateSliders();
      }
      div.appendChild(syncCheckbox);

      div.appendChild(document.createElement('br'));

      this.threshold1Slider = new Slider(div, {
         id: 'Threshold1',
         label: 'Threshold 1',
         min: 0,
         max: 90,
         value: this.renderer.threshold1,
         oninput: () => {
            this.renderer.threshold1 = this.threshold1Slider.value;
            this.updateSliders();
            this.dirty = true;
         },
         getText: () => { return this.renderer.threshold1.toFixed(0) + "º" }
      });

      this.threshold2Slider = new Slider(div, {
         id: 'Threshold2',
         label: 'Threshold 2',
         min: 0,
         max: 90,
         value: this.renderer.threshold2,
         oninput: () => {
            this.renderer.threshold2 = this.threshold2Slider.value;
            this.updateSliders();
            this.dirty = true;
         },
         getText: () => { return this.renderer.threshold2.toFixed(0) + "º" }
      });

      this.lightLightSlider = new Slider(div, {
         id: 'LightLight',
         label: 'Light Light',
         min: 0,
         max: 100,
         value: this.renderer.lightLight * 100,
         colors: [htmlColor.black, htmlColor.white],
         oninput: () => {
            this.renderer.lightLight = this.lightLightSlider.value / 100;
            this.updateSliders();
            this.dirty = true;
         },
         getText: () => { return (100 * this.renderer.lightLight).toFixed(0) + "%" }
      });

      this.midLightSlider = new Slider(div, {
         id: 'MidLight',
         label: 'Mid Light',
         min: 0,
         max: 100,
         value: this.renderer.midLight * 100,
         colors: [htmlColor.black, htmlColor.white],
         oninput: () => {
            this.renderer.midLight = this.midLightSlider.value / 100;
            this.updateSliders();
            this.dirty = true;
         },
         getText: () => { return (100 * this.renderer.midLight).toFixed(0) + "%" }
      });

      this.darkLightSlider = new Slider(div, {
         id: 'DarkLight',
         label: 'Dark Light',
         min: 0,
         max: 100,
         value: this.renderer.darkLight * 100,
         colors: [htmlColor.black, htmlColor.white],
         oninput: () => {
            this.renderer.darkLight = this.darkLightSlider.value / 100;
            this.updateSliders();
            this.dirty = true;
         },
         getText: () => { return (100 * this.renderer.darkLight).toFixed(0) + "%" }
      });

      return div;
   }

   private loadModel(query: string): Promise<TriangleObj> {

      if (query && query.toLowerCase() === 'trianglesphere') {
         let radius = 0.75;
         let center = new glVec3([0, 0, 0]);
         let tObj = new TriangleSphere(100, radius, center)
         tObj.computeNormals(NormalType.Smooth);
         this.renderer.setModel(tObj);
         return Promise.resolve(tObj);
      }
      else if (query && query.toLowerCase() === 'trianglecube') {
         let size = 0.8;
         let center = new glVec3([0, 0, 0]);
         let tObj = new TriangleCube(size, center);
         this.renderer.setModel(tObj);
         return Promise.resolve(tObj);
      }
      else if (query && query.toLowerCase().endsWith('.obj')) {
         return fetch(query)
            .then(res => res.text())
            .then(res => {
               let tObj = new TriangleObjFile(res);
               this.renderer.setModel(tObj);
               this.orient(tObj, query);
               return tObj;
            });
      }
      else {
         return Promise.reject('Unknown model: \'' + query + '\'');
      }
   }

   public orient(tObj: TriangleObj, query: string) {

      let center = tObj.center;
      this.renderer.translate(new glVec3([-center.x, -center.y, -center.z]));
      this.renderer.scale(1.75 / Math.max(tObj.width, tObj.height, tObj.depth));

      // orient each file so that it is facing forward
      switch (query.toLowerCase()) {
         case 'skull.obj':
            this.renderer.rotX(toRad(90));
            this.renderer.rotY(toRad(180));
            break;

         case 'femalehead.obj':
            this.renderer.rotY(toRad(180));
            break;

         case 'wolf.obj':
            this.renderer.rotY(toRad(-140));
            this.renderer.rotX(toRad(5));
            break;

         case 'sheephead.obj':
            this.renderer.rotY(toRad(-160));
            break;

         case 'tom.obj':
         case 'malehead.obj':
            this.renderer.rotY(toRad(180));
            break;
      }
   }

   private updateSliders() {
      this.threshold1Slider.value = this.renderer.threshold1;
      this.threshold2Slider.value = this.renderer.threshold2;
      this.lightLightSlider.value = 100 * this.renderer.lightLight;
      this.midLightSlider.value = 100 * this.renderer.midLight;
      this.darkLightSlider.value = 100 * this.renderer.darkLight;
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
               this.renderer.rotZ((this.oldY - y) * 0.01);
            }
            else {
               this.renderer.rotX((y - this.oldY) * 0.01);
               this.renderer.rotY((x - this.oldX) * 0.01);
            }
         }
         else if (this.pointerMode === PointerMode.Light) {
            let pos = SphericalCoord.fromXYZ(this.renderer.uLightDirection.values);

            if (this.pointerModeSpecial) {
               /*
               this.pos.radius -= (y - this.oldY) * 0.005;
               this.pos.radius = clamp(this.pos.radius, Uniforms.uBallRadius + 0.5, 5);
               Uniforms.uLightPos.values = this.pos.toXYZ();
               */
            }
            else {
               let matY = glMat4.fromRotY(toRad(x - this.oldX));
               let matX = glMat4.fromRotX(toRad(y - this.oldY));
               let vec = new glVec4([
                  this.renderer.uLightDirection.x,
                  this.renderer.uLightDirection.y,
                  this.renderer.uLightDirection.z,
                  1
               ]);
               vec = matX.multV(vec);
               vec = matY.multV(vec);
               this.renderer.uLightDirection.x = vec.values[0];
               this.renderer.uLightDirection.y = vec.values[1];
               this.renderer.uLightDirection.z = vec.values[2];
            }

            this.dirty = true;
         }

         // remember this coordinate
         this.oldX = x;
         this.oldY = y;
      }
   }

   /**
    * Processes a click/touch event at the designated coordinates.
    * 
    * @param x The x coordinate.
    * @param y The y coordinate.
    * @returns true if a hit on one of the views occurs.
    */
   private click(x: number, y: number): boolean {

      let size = this.canvas.width;
      return this.renderer.click(x / size, 1 - (y / size));
   }

   public tick() {

      if (this.dirty) {
         this.renderer.render();
         this.dirty = false;
      }

      requestAnimationFrame(() => this.tick());
   }
}
