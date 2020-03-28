import { Slider } from "./Slider";
import { htmlColor } from "./htmlColor";
import { Globals, toRad, isMobile } from "./Globals";
import { PlanesRenderer } from "./PlanesRenderer";
import { glMat4 } from "./glMat";
import { glVec4, glVec3, glVec2 } from "./glVec";
import { NormalType, TriangleObj, TriangleObjData } from "./TriangleObj";
import { TriangleSphere } from "./TriangleSphere";
import { TriangleCube } from "./TriangleCube";
import { TriangleObjFile } from "./TriangleObjFile";
import { ThresholdCtrl } from "./ThresholdCtrl";
import { PointerEventHandler } from "./PointerEventHandler";
import LoaderWorker from 'worker-loader!./LoaderWorker';

enum PointerMode {
   View,
   Light,
}

export class PlanesApp {
   public renderer: PlanesRenderer;
   private pointerMode: PointerMode = PointerMode.View;
   private pointerModeSpecial = false;
   private canvas: HTMLCanvasElement;
   private overlay: HTMLSpanElement;
   private handler: PointerEventHandler;

   private dirty: boolean = true;

   private query: string;

   private highlightSlider: Slider
   private lightLightSlider: Slider;
   private midLightSlider: Slider;
   private darkLightSlider: Slider;
   private shadowSlider: Slider;
   private thresholdCtrl: ThresholdCtrl;
   private modeButton: HTMLSpanElement;

   public set threshold1(val: number) {
      this.renderer.threshold1 = val;
      this.dirty = true;
   }

   public set threshold2(val: number) {
      this.renderer.threshold2 = val;
      this.dirty = true;
   }

   public constructor(query: string) {
      this.query = query;
   }

   public component(): HTMLElement {
      const div = document.createElement('div');
      div.className = 'PlanesApp';

      const container = document.createElement('div');
      container.className = 'container';
      div.appendChild(container);

      this.canvas = document.createElement('canvas');
      this.canvas.id = 'MainCanvas';
      container.appendChild(this.canvas);

      this.overlay = document.createElement('span');
      this.overlay.id = 'Overlay';
      container.appendChild(this.overlay);

      let size = 512;
      if (isMobile) {
         size = document.body.clientWidth;
      }
      this.canvas.width = size;
      this.canvas.height = size;
      //this.overlay.style.width = size;
      //this.overlay.height = size;
      div.style.width = size + 'px';
      this.overlay.style.lineHeight = size + 'px'; // vertically center text


      let context = this.canvas.getContext('webgl') as WebGLRenderingContext;

      if (!context) {
         // TODO display a message about not being able to create a WebGL context
         console.log("Unable to get WebGL context");
      }
      Globals.gl = context;

      this.renderer = new PlanesRenderer();

      this.handler = new PointerEventHandler(this.canvas);
      this.handler.onDown = (pos) => this.onDown(pos);
      this.handler.onMove = (pos) => this.onMove(pos);
      this.handler.onClick = (pos) => this.onClick(pos);
      this.handler.onDblClick = (pos) => this.onDblClick(pos);

      document.onkeypress = (event: KeyboardEvent) => {
         if (event.key === 'o') {
            this.renderer.optimize(NormalType.Smooth);
         }
         else if (event.key === 'p') {
            this.renderer.optimize(NormalType.Flat);
         }
      }

      this.modeButton = document.createElement('span');
      this.modeButton.id = 'modeButton';
      this.modeButton.innerHTML = 'View';
      this.pointerMode = PointerMode.View;
      this.modeButton.onclick = () => {
         this.toggleMode();
      }
      container.appendChild(this.modeButton);

      const container2 = document.createElement('div');
      container2.className = 'container';
      div.appendChild(container2);

      this.thresholdCtrl = new ThresholdCtrl(container2, this);

      this.highlightSlider = new Slider(container2, {
         id: 'Highlight',
         label: 'Highlight',
         min: 0,
         max: 100,
         value: this.renderer.highlight * 100,
         colors: [htmlColor.black, htmlColor.white],
         oninput: () => {
            this.renderer.highlight = this.highlightSlider.value / 100;
            this.updateSliders();
            this.dirty = true;
         },
         getText: () => { return (100 * this.renderer.highlight).toFixed(0) + "%" }
      });

      this.lightLightSlider = new Slider(container2, {
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

      this.midLightSlider = new Slider(container2, {
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

      this.darkLightSlider = new Slider(container2, {
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

      this.shadowSlider = new Slider(container2, {
         id: 'Shadow',
         label: 'Shadow',
         min: 0,
         max: 100,
         value: this.renderer.shadow * 100,
         colors: [htmlColor.black, htmlColor.white],
         oninput: () => {
            this.renderer.shadow = this.shadowSlider.value / 100;
            this.updateSliders();
            this.dirty = true;
         },
         getText: () => { return (100 * this.renderer.shadow).toFixed(0) + "%" }
      });

      this.loadModel(this.query)
         .then((tObj: TriangleObj) => {
            requestAnimationFrame(() => this.tick());
         })
         .catch((err) => {
            this.overlay.innerText = err.toString();
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

         let promise = new Promise<TriangleObj>((resolve, reject) => {
            const worker = new LoaderWorker();
            let tStart = Date.now();
            worker.onmessage = ({ data }: { data: any }) => {

               if (typeof data === 'string') {
                  // avoid flashing messages for things that happen very quickly.
                  if (Date.now() - tStart > 0) {
                     this.overlay.innerText = data;
                  }
               }
               else {
                  let tObj = TriangleObj.import(data);
                  this.renderer.setModel(tObj);
                  this.orient(tObj, query);

                  this.overlay.innerText = '';
                  resolve(tObj);
               }
            };

            let file = location.pathname + query;
            worker.postMessage(file);

         });
         return promise;
      }
      else {
         // TODO multi line error messages not supported
         return Promise.reject('Unknown Model:' + query);
      }
   }

   public orient(tObj: TriangleObj, query: string) {

      let center = tObj.center;
      this.renderer.translate(new glVec3([-center.x, -center.y, -center.z]));
      this.renderer.scale(2.0 / Math.sqrt(tObj.width * tObj.width + tObj.height * tObj.height + tObj.depth * tObj.depth));

      // orient each file so that it is facing forward
      switch (query.toLowerCase()) {
         case 'skull.obj':
            this.renderer.rotX(toRad(90));
            this.renderer.rotY(toRad(180));
            break;

         case 'wolf.obj':
            this.renderer.rotY(toRad(-140));
            this.renderer.rotX(toRad(5));
            break;

         case 'sheephead.obj':
            this.renderer.rotY(toRad(-160));
            break;

         case 'pose1.obj':
            break;

         default:
            this.renderer.rotY(toRad(180));
            break;
      }
   }

   private updateSliders() {
      this.highlightSlider.value = 100 * this.renderer.highlight;
      this.lightLightSlider.value = 100 * this.renderer.lightLight;
      this.midLightSlider.value = 100 * this.renderer.midLight;
      this.darkLightSlider.value = 100 * this.renderer.darkLight;
      this.shadowSlider.value = 100 * this.renderer.shadow;
   }

   private toggleMode() {
      switch (this.pointerMode) {
         case PointerMode.View:
            this.modeButton.innerText = 'Light';
            this.pointerMode = PointerMode.Light;
            break;

         case PointerMode.Light:
            this.modeButton.innerText = 'View';
            this.pointerMode = PointerMode.View;
            break;
      }
   }

   private onDown(pos: glVec2) {

      this.pointerModeSpecial = (pos.x < 0.1 * this.canvas.width) ? true : false;
   }

   private onMove(pos: glVec2) {
      if (this.handler.mouseDown) {
         this.dirty = true;

         let old = this.handler.lastPos;
         if (this.pointerMode === PointerMode.View) {
            if (this.pointerModeSpecial) {
               this.renderer.rotZ((old.y - pos.y) * 0.01);
            }
            else {
               this.renderer.rotX((pos.y - old.y) * 0.01);
               this.renderer.rotY((pos.x - old.x) * 0.01);
            }
         }
         else if (this.pointerMode === PointerMode.Light) {

            if (this.pointerModeSpecial) {
               /*
               let sPos = SphericalCoord.fromXYZ(this.renderer.uLightDirection.values);
               this.pos.radius -= (y - old.y) * 0.005;
               this.pos.radius = clamp(this.pos.radius, Uniforms.uBallRadius + 0.5, 5);
               Uniforms.uLightPos.values = this.pos.toXYZ();
               */
            }
            else {
               let matY = glMat4.fromRotY(toRad(pos.x - old.x));
               let matX = glMat4.fromRotX(toRad(pos.y - old.y));
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
      }
   }

   /**
    * Processes a click/touch event at the designated coordinates.
    * 
    * @param x The x coordinate.
    * @param y The y coordinate.
    * @returns true if a hit on one of the views occurs.
    */
   private onClick(pos: glVec2): boolean {

      let size = this.canvas.width;

      // TODO get the size of the area from the renderer
      if (pos.x < size / 5 && pos.y < size / 5) {
         this.toggleMode();
         return true;
      }

      return this.renderer.click(pos.x / size, 1 - (pos.y / size));
   }

   private onDblClick(pos: glVec2) {

      this.toggleMode();
   }

   public tick() {

      if (this.dirty) {
         this.renderer.render();
         this.thresholdCtrl.draw();
         this.dirty = false;
      }

      requestAnimationFrame(() => this.tick());
   }
}
