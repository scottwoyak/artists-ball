import { htmlColor } from "./htmlColor";
import { toRad, isMobile } from "./Globals";
import { PlanesRenderer } from "./PlanesRenderer";
import { glMat4 } from "./glMat";
import { glVec4, glVec2 } from "./glVec";
import { NormalType, TriangleObj } from "./TriangleObj";
import { PointerEventHandler } from "./PointerEventHandler";
import { saveAs } from 'file-saver';

// specify loader and options here. This value must match the
// contents of worker.d.ts
import LoaderWorker from 'worker-loader?name=LoaderWorker.worker.js!./LoaderWorker';
import { createModelsDropDownMenu } from "./ModelsDropDownMenu";

enum PointerMode {
   View,
   Light,
}

//const WHITE_COLOR = new htmlColor([255, 255, 255]);
const WHITE_COLOR = new htmlColor([255, 250, 242]);
const BLACK_COLOR = new htmlColor([0, 0, 0]);
//const BLACK_COLOR = new htmlColor([30, 20, 0]);

export class ViewerApp {
   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;
   public renderer: PlanesRenderer;
   private pointerMode: PointerMode = PointerMode.View;
   private overlay: HTMLSpanElement;
   private handler: PointerEventHandler;

   private dirty: boolean = true;

   private query: string;

   private worker: LoaderWorker;

   public constructor(query: string) {
      this.query = query;
   }

   public component(): HTMLElement {
      const div = document.createElement('div');
      div.className = 'ViewerApp';

      const viewContainer = document.createElement('div');
      viewContainer.id = 'ViewContainer';
      viewContainer.className = 'container';
      div.appendChild(viewContainer);
      this.createViewElements(viewContainer);
      div.style.width = this.gl.canvas.width + 'px';

      const ctrlsContainer = document.createElement('div');
      ctrlsContainer.className = 'container';
      ctrlsContainer.id = 'CtrlsContainer';
      div.appendChild(ctrlsContainer);
      this.createCtrlsElements(ctrlsContainer);

      this.loadModel(this.query);

      return div;
   }

   private createViewElements(parent: HTMLElement) {

      let canvas = document.createElement('canvas');
      canvas.id = 'MainCanvas';
      parent.appendChild(canvas);

      this.overlay = document.createElement('div');
      this.overlay.id = 'Overlay';
      parent.appendChild(this.overlay);

      let context = canvas.getContext('webgl') as WebGLRenderingContext;

      if (!context) {
         // TODO display a message about not being able to create a WebGL context
         console.log("Unable to get WebGL context");
      }
      this.gl = context;

      this.updateSize();

      this.renderer = new PlanesRenderer(this.gl);
      this.renderer.whiteColor = WHITE_COLOR;
      this.renderer.blackColor = BLACK_COLOR;
      this.renderer.showMiniView = false;

      this.handler = new PointerEventHandler(canvas);
      this.handler.onDrag = (pos: glVec2, delta: glVec2) => this.onDrag(pos, delta);
      this.handler.onClick = (pos: glVec2) => this.onClick(pos);
      this.handler.onScale = (scale: number, change: number) => this.onScale(scale, change);
      this.handler.onRotate = (angle: number, delta: number) => this.onRotate(angle, delta);
      this.handler.onTranslate = (delta: glVec2) => this.onTranslate(delta);

      document.onkeypress = (event: KeyboardEvent) => {
         switch (event.key) {
            case 'o':
               this.renderer.optimize(NormalType.Smooth);
               break;

            case 'p':
               this.renderer.optimize(NormalType.Flat);
               break;

            case 's':
               this.save();
               break;

            case 'd':
               this.renderer.showShadowMap = !this.renderer.showShadowMap;
               this.dirty = true;
               break;
         }
      }

      createModelsDropDownMenu(parent, (file) => this.loadModel(file));

      window.onresize = () => {

         this.updateSize();
         this.renderer.resize();
         this.dirty = true;
      }
   }

   private updateSize() {
      let gl = this.gl;

      let width = window.innerWidth;
      let height = window.innerHeight - 10;

      gl.canvas.width = width;
      gl.canvas.height = height;
      this.overlay.style.lineHeight = height + 'px'; // vertically center text

      // why do we have to manually set this height? If we don't it is 515.2 px high
      //parent.style.height = height + 'px';
   }

   private createCtrlsElements(parent: HTMLElement) {

      /*
      this.highlightSlider = new Slider(parent, {
         id: 'Highlight',
         label: 'Highlight',
         min: 0,
         max: 100,
         value: this.renderer.highlight * 100,
         colors: [BLACK_COLOR, WHITE_COLOR],
         oninput: () => {
            this.renderer.highlight = this.highlightSlider.value / 100;
            this.updateSliders();
            this.dirty = true;
         },
         getText: () => { return (100 * this.renderer.highlight).toFixed(0) + "%" }
      });
      */
   }

   private loadModel(query: string) {

      // if nothing was specified, load an interesting model
      if (!query) {
         query = 'Pose_02.blob';
      }

      if (query && query.toLowerCase().endsWith('.obj')) {

         this.loadModelFile(query).then((tObj) => {

            this.renderer.setModel(tObj);
            this.orient(tObj, query);

            this.dirty = true;
            requestAnimationFrame(() => this.tick());

            /*
               let tokens = query.split('.');
               let propFile = tokens[0] + '_Prop.' + tokens[1];
               this.loadModelFile(propFile).then((tPropObj) => {
                  tObj.combine(tPropObj);
                  return tObj;
               }).then(() => {
                  this.renderer.setModel(tObj);
                  this.orient(tObj, query);
   
                  this.dirty = true;
                  requestAnimationFrame(() => this.tick());
               });
            */
         });
      }
      else if (query && query.toLowerCase().endsWith('.blob')) {

         this.loadModelFile(query).then((tObj) => {
            this.renderer.setModel(tObj);
            this.orient(tObj, query);

            this.dirty = true;
            requestAnimationFrame(() => this.tick());
         });
      }
      else {
         // TODO multi line error messages not supported
         this.overlay.innerText = 'Unknown Model:' + query;
      }
   }

   private loadModelFile(file: string): Promise<TriangleObj> {

      return new Promise<TriangleObj>((resolve, reject) => {

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
               let tObj = TriangleObj.fromData(data);

               this.overlay.innerText = '';

               this.worker.terminate();
               this.worker = undefined;

               resolve(tObj);
            }
         };

         this.worker.postMessage(file);
      });

   }

   public orient(tObj: TriangleObj, query: string) {

      // orient each file so that it is facing forward
      let file = query.toLowerCase();
      file = file.split('.')[0];
      switch (file) {
         case 'skull1':
            this.renderer.rotX(toRad(90));
            this.renderer.rotY(toRad(180));
            break;

         case 'pelvis':
            this.renderer.rotX(toRad(11));
            this.renderer.rotZ(toRad(-87));
            break;

         case 'wolf':
            this.renderer.rotY(toRad(-140));
            this.renderer.rotX(toRad(5));
            break;

         case 'sheephead':
            this.renderer.rotY(toRad(-160));
            break;

         case 'pose1':
            break;

         case 'teapot':
            this.renderer.rotY(toRad(90));
            break;

         default:
            this.renderer.rotY(toRad(180));
            break;
      }
   }

   private toggleMode() {
      switch (this.pointerMode) {
         case PointerMode.View:
            this.pointerMode = PointerMode.Light;
            this.renderer.ballColor = this.renderer.yellow;
            break;

         case PointerMode.Light:
            this.pointerMode = PointerMode.View;
            this.renderer.ballColor = WHITE_COLOR.toGlColor();
            break;
      }
      this.dirty = true;
   }

   private onDrag(pos: glVec2, delta: glVec2) {
      this.dirty = true;

      if (this.pointerMode === PointerMode.View) {
         this.renderer.rotX(delta.y * 0.01);
         this.renderer.rotY(delta.x * 0.01);
      }
      else if (this.pointerMode === PointerMode.Light) {

         let matY = glMat4.fromRotY(toRad(delta.x));
         let matX = glMat4.fromRotX(toRad(delta.y));
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

   /**
    * Processes a click/touch event at the designated coordinates.
    * 
    * @param x The x coordinate.
    * @param y The y coordinate.
    * @returns true if a hit on one of the views occurs.
    */
   private onClick(pos: glVec2): boolean {

      let size = this.gl.canvas.width;

      // TODO get the size of the area from the renderer
      if (pos.x < size / 5 && pos.y < size / 5) {
         this.toggleMode();
         return true;
      }

      return this.renderer.click(pos.x / size, 1 - (pos.y / size));
   }

   private onScale(scale: number, change: number) {
      this.renderer.zoom(change);
      this.dirty = true;
   }

   private onRotate(angle: number, delta: number) {
      this.renderer.rotZ(delta);
      this.dirty = true;
   }

   private onTranslate(delta: glVec2) {

      // TODO how can this scaling be detected from javascript?
      let factor = 1;
      if (isMobile) {
         factor = 2;
      }

      let clipSpace = this.renderer.getClipSpace();
      this.renderer.translateView(new glVec2([
         factor * clipSpace.width * delta.x / this.gl.canvas.width,
         factor * clipSpace.height * delta.y / this.gl.canvas.height
      ]));
      this.dirty = true;
   }

   public tick() {

      if (this.dirty) {
         // TODO only redraw the threshold ctrl if a slider changed
         this.renderer.render();
         this.dirty = false;
      }

      requestAnimationFrame(() => this.tick());
   }

   private save() {
      let tObj = this.renderer.tObj;

      let name = tObj.name.split('.')[0] + '.blob';
      saveAs(tObj.toBlob(), name);
   }
}
