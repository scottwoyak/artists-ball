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
import { saveAs } from 'file-saver';

// specify loader and options here. This value must match the
// contents of worker.d.ts
import LoaderWorker from 'worker-loader?name=LoaderWorker.worker.js!./LoaderWorker';
import { DropDownMenu, SubMenu } from "./DropDownMenu";
import { glColor } from "./glColor";

enum PointerMode {
   View,
   Light,
}

export class PlanesApp {
   public renderer: PlanesRenderer;
   private pointerMode: PointerMode = PointerMode.View;
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

            case 't':
               this.test();
               break;

            case 'd':
               this.renderer.showShadowMap = !this.renderer.showShadowMap;
               this.dirty = true;
               break;
         }
      }

      let subMenu: SubMenu;
      let menu = new DropDownMenu(parent, 'Models', 'ModelDropDown');
      menu.addItem('Female Pose', () => this.loadModel('Pose1.blob'));
      menu.addItem('Female Head', () => this.loadModel('FemaleHead.blob'));
      menu.addItem('Skull 1', () => this.loadModel('Skull1.blob'));
      menu.addItem('Skull 2', () => this.loadModel('Skull2.blob'));
      menu.addItem('Skull 3', () => this.loadModel('Skull3.blob'));
      menu.addItem('Pelvis', () => this.loadModel('Pelvis.blob'));
      menu.addItem('Head Ecorche', () => this.loadModel('HeadEcorche.blob'));
      menu.addItem('Arnold', () => this.loadModel('Arnold.blob'));
      menu.addItem('Teapot', () => this.loadModel('Teapot.blob'));

      subMenu = menu.addSubMenu('Poses', 'HeadsSubMenu');
      subMenu.addItem('Pose 1', () => this.loadModel('Pose_01.blob'));
      subMenu.addItem('Pose 2', () => this.loadModel('Pose_02.blob'));
      subMenu.addItem('Pose 3', () => this.loadModel('Pose_03.blob'));
      subMenu.addItem('Pose 4', () => this.loadModel('Pose_04.blob'));
      subMenu.addItem('Pose 5', () => this.loadModel('Pose_05.blob'));
      subMenu.addItem('Pose 6', () => this.loadModel('Pose_06.blob'));
      subMenu.addItem('Pose 7', () => this.loadModel('Pose_07.blob'));
      subMenu.addItem('Pose 8', () => this.loadModel('Pose_08.blob'));
      subMenu.addItem('Pose 9', () => this.loadModel('Pose_09.blob'));
      subMenu.addItem('Pose 10', () => this.loadModel('Pose_010.blob'));
      subMenu.addItem('Pose 11', () => this.loadModel('Pose_011.blob'));
      subMenu.addItem('Pose 12', () => this.loadModel('Pose_012.blob'));
      subMenu.addItem('Pose 13', () => this.loadModel('Pose_013.blob'));
      subMenu.addItem('Pose 14', () => this.loadModel('Pose_014.blob'));
      subMenu.addItem('Pose 15', () => this.loadModel('Pose_015.blob'));
      subMenu.addItem('Pose 16', () => this.loadModel('Pose_016.blob'));

      subMenu = menu.addSubMenu('Heads', 'HeadsSubMenu');
      subMenu.addItem('Head 1', () => this.loadModel('Head1.blob'));
      subMenu.addItem('Head 2', () => this.loadModel('Head2.blob'));
      subMenu.addItem('Head 3', () => this.loadModel('Head3.blob'));
      subMenu.addItem('Head 4', () => this.loadModel('Head4.blob'));
      subMenu.addItem('Head 5', () => this.loadModel('Head5.blob'));
      subMenu.addItem('Head 6', () => this.loadModel('Head6.blob'));
      subMenu.addItem('Head 7', () => this.loadModel('Head7.blob'));
      subMenu.addItem('Head 8', () => this.loadModel('Head8.blob'));
      subMenu.addItem('Head 9', () => this.loadModel('Head9.blob'));
      subMenu.addItem('Head 10', () => this.loadModel('Head10.blob'));
   }

   private createCtrlsElements(parent: HTMLElement) {
      this.thresholdCtrl = new ThresholdCtrl(
         parent,
         this,
         (value: number) => {
            this.renderer.threshold1 = value;
            this.updateSliders();
            this.dirty = true;
         },
         (value: number) => {
            this.renderer.threshold2 = value;
            this.updateSliders();
            this.dirty = true;
         }
      );

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
         getText: () => { return (100 * this.renderer.lightLight).toFixed(0) + "%" }
      });
      this.lightLightSlider.range.disabled = true;

      this.midLightSlider = new Slider(parent, {
         id: 'MidLight',
         label: 'Mid Light',
         min: 0,
         max: 100,
         value: this.renderer.midLight * 100,
         colors: [htmlColor.black, htmlColor.white],
         getText: () => { return (100 * this.renderer.midLight).toFixed(0) + "%" }
      });
      this.midLightSlider.range.disabled = true;

      this.darkLightSlider = new Slider(parent, {
         id: 'DarkLight',
         label: 'Dark Light',
         min: 0,
         max: 100,
         value: this.renderer.darkLight * 100,
         colors: [htmlColor.black, htmlColor.white],
         getText: () => { return (100 * this.renderer.darkLight).toFixed(0) + "%" }
      });
      this.darkLightSlider.range.disabled = true;

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

      // if nothing was specified, load an interesting model
      if (!query) {
         query = 'Pose_02.blob';
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

      let size = gl.canvas.width;

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

      let factor = 1;
      if (isMobile) {
         factor = 2;
      }

      this.renderer.translateView(new glVec2([
         factor * 2 * delta.x / gl.canvas.width,
         factor * 2 * delta.y / gl.canvas.height
      ]));
      this.dirty = true;
   }

   public tick() {

      if (this.dirty) {
         // TODO only redraw the threshold ctrl if a slider changed
         this.renderer.render();
         this.thresholdCtrl.draw();
         this.dirty = false;
      }

      requestAnimationFrame(() => this.tick());
   }

   private save() {
      let tObj = this.renderer.tObj;

      let name = tObj.name.split('.')[0] + '.blob';
      saveAs(tObj.toBlob(), name);
   }

   private async test() {
      // uncomment to test Blobs
      let blob = this.renderer.tObj.toBlob();
      let tObj = await TriangleObj.fromBlob(blob);
      console.log(tObj.name);
   }
}
