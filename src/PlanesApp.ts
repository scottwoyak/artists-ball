import { Slider } from "./Slider";
import { htmlColor } from "./htmlColor";
import { Globals, toRad, isMobile, gl } from "./Globals";
import { PlanesRenderer } from "./PlanesRenderer";
import { glMat4 } from "./glMat";
import { glVec4, glVec3, glVec2 } from "./glVec";
import { NormalType, TriangleObj } from "./TriangleObj";
import { TriangleSphere } from "./TriangleSphere";
import { TriangleCube } from "./TriangleCube";
import { ThresholdCtrl } from "./ThresholdCtrl";
import { PointerEventHandler } from "./PointerEventHandler";

// specify loader and options here. This value must match the
// contents of worker.d.ts
import LoaderWorker from 'worker-loader?name=LoaderWorker.worker.js!./LoaderWorker';
import { DropDownMenu } from "./DropDownMenu";
import { glColor } from "./glColor";

enum PointerMode {
   View,
   Light,
}

export class PlanesApp {
   public renderer: PlanesRenderer;
   private pointerMode: PointerMode = PointerMode.View;
   private pointerModeSpecial = false;
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
   private worker: LoaderWorker;

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

      const viewContainer = document.createElement('div');
      viewContainer.id = 'ViewContainer';
      viewContainer.className = 'container';
      div.appendChild(viewContainer);
      this.createViewElements(viewContainer);
      div.style.width = gl.canvas.width + 'px';

      const ctrlsContainer = document.createElement('div');
      ctrlsContainer.className = 'container';
      ctrlsContainer.id = 'CtrlsContainer';
      div.appendChild(ctrlsContainer);
      this.createCtrlsElements(ctrlsContainer);

      return div;
   }

   private createViewElements(parent: HTMLElement) {

      let canvas = document.createElement('canvas');
      canvas.id = 'MainCanvas';
      parent.appendChild(canvas);

      this.overlay = document.createElement('div');
      this.overlay.id = 'Overlay';
      parent.appendChild(this.overlay);

      let size = 512;
      if (isMobile) {
         size = document.body.clientWidth;
      }
      canvas.width = size;
      canvas.height = size;
      this.overlay.style.lineHeight = size + 'px'; // vertically center text

      // why do we have to manually set this height? If we don't it is 515.2 px high
      parent.style.height = size + 'px';


      let context = canvas.getContext('webgl') as WebGLRenderingContext;

      if (!context) {
         // TODO display a message about not being able to create a WebGL context
         console.log("Unable to get WebGL context");
      }
      Globals.gl = context;

      this.renderer = new PlanesRenderer();

      this.handler = new PointerEventHandler(canvas);
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

      let menu = new DropDownMenu(parent, 'Models', 'ModelDropDown');
      menu.addItem('Male Head', () => this.loadModel('Head.obj'));
      menu.addItem('Female Pose', () => this.loadModel('Pose1.obj'));
      menu.addItem('Female Head', () => this.loadModel('FemaleHead.obj'));
      menu.addItem('Skull 1', () => this.loadModel('Skull.obj'));
      menu.addItem('Skull 2', () => this.loadModel('SkullHigh.obj'));
      menu.addItem('Arnold', () => this.loadModel('Arnold.obj'));
      menu.addItem('Teapot', () => this.loadModel('Teapot.obj'));
   }

   private createCtrlsElements(parent: HTMLElement) {
      this.thresholdCtrl = new ThresholdCtrl(parent, this);

      this.highlightSlider = new Slider(parent, {
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

      this.lightLightSlider = new Slider(parent, {
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

      this.midLightSlider = new Slider(parent, {
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

      this.darkLightSlider = new Slider(parent, {
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

      this.shadowSlider = new Slider(parent, {
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

      this.loadModel(this.query);
   }

   private loadModel(query: string) {

      // if nothing was specified, load the head model
      if (!query) {
         query = 'Head.obj';
      }

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

         // if a previous worker exists, close it
         if (this.worker) {
            this.worker.terminate();
            this.worker = undefined;
         }

         this.worker = new LoaderWorker();
         let tStart = Date.now();
         this.worker.onmessage = ({ data }: { data: any }) => {

            if (typeof data === 'string') {
               // avoid flashing messages for things that happen very quickly.
               if (Date.now() - tStart > 500) {
                  this.overlay.innerText = data;
               }
            }
            else {
               let tObj = TriangleObj.import(data);
               this.renderer.setModel(tObj);
               this.orient(tObj, query);

               this.overlay.innerText = '';

               this.worker.terminate();
               this.worker = undefined;

               this.dirty = true;
               requestAnimationFrame(() => this.tick());
            }
         };

         this.worker.postMessage(query);

      }
      else {
         // TODO multi line error messages not supported
         this.overlay.innerText = 'Unknown Model:' + query;
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

         case 'teapot.obj':
            this.renderer.rotY(toRad(90));
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
            this.pointerMode = PointerMode.Light;
            this.renderer.ballColor = this.renderer.yellow;
            break;

         case PointerMode.Light:
            this.pointerMode = PointerMode.View;
            this.renderer.ballColor = new glColor([1.0, 1.0, 1.0]);
            break;
      }
      this.dirty = true;
   }

   private onDown(pos: glVec2) {

      this.pointerModeSpecial = (pos.x < 0.1 * gl.canvas.width) ? true : false;
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

      let size = gl.canvas.width;

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
