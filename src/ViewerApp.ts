import { htmlColor } from "./htmlColor";
import { toRad, isMobile } from "./Globals";
import { PlanesRenderer } from "./PlanesRenderer";
import { Mat4 } from "./Mat";
import { Vec4, Vec2 } from "./Vec";
import { NormalType } from "./TriangleObj";
import { PointerEventHandler } from "./PointerEventHandler";
import { saveAs } from 'file-saver';
import { createModelsDropDownMenu } from "./ModelsDropDownMenu";
import { ModelLoader } from "./ModelLoader";

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

   private loader = new ModelLoader();

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
      this.handler.onDrag = (pos: Vec2, delta: Vec2) => this.onDrag(pos, delta);
      this.handler.onClick = (pos: Vec2) => this.onClick(pos);
      this.handler.onScale = (scale: number, change: number) => this.onScale(scale, change);
      this.handler.onRotate = (angle: number, delta: number) => this.onRotate(angle, delta);
      this.handler.onTranslate = (delta: Vec2) => this.onTranslate(delta);

      document.onkeypress = (event: KeyboardEvent) => {
         switch (event.key) {
            case 'i':
               alert(
                  this.renderer.tObj.name + '\n' +
                  'Num Triangles: ' + this.renderer.tObj.numTriangles.toLocaleString() + '\n' +
                  'Num Vertices: ' + this.renderer.tObj.numVertices.toLocaleString() + '\n'
               );
            case 'o':
               this.optimize(NormalType.Smooth);
               break;

            case 'p':
               this.optimize(NormalType.Flat);
               break;

            case 't':
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

   private optimize(normalType: NormalType) {

      let obj = this.renderer.obj;
      let oldNumVertices = obj.tObj.numVertices;

      obj.optimize(normalType);

      let newNumVertices = obj.tObj.numVertices;

      let msg = 'Optimized .OBJ content copied to clipboard\n\n';
      msg += 'Num Triangles: ' + obj.tObj.numTriangles + '\n';
      msg += 'Num Vertices: ' + oldNumVertices + ' to ' + newNumVertices + ', ' + (100 * newNumVertices / oldNumVertices).toFixed() + ' %\n';

      let str = obj.tObj.toObjString(6);
      navigator.clipboard.writeText(str).then(() => { alert(msg) });

      this.dirty = true;
   }

   private updateSize() {
      let gl = this.gl;

      let width = window.innerWidth;
      let height = window.innerHeight;

      gl.canvas.width = width;
      gl.canvas.height = height;
      this.overlay.style.width = width + 'px';
      this.overlay.style.height = height + 'px';
      this.overlay.style.lineHeight = height + 'px'; // vertically center text
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

      let lc = query.toLowerCase();
      if (lc.endsWith('.obj') || lc.endsWith('.blob')) {

         let statusFunc = (status: string) => {
            this.overlay.innerText = status;
         }

         this.loader.loadModelFile(query, statusFunc)
            .then((tObj) => {

               this.renderer.setModel(tObj);
               this.loader.orient(this.renderer.obj);

               if (query.startsWith('Pose')) {
                  this.renderer.showBase = true;
               }

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
      else {
         // TODO multi line error messages not supported
         this.overlay.innerText = 'Unknown Model:' + query;
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

   private onDrag(pos: Vec2, delta: Vec2) {
      this.dirty = true;

      if (this.pointerMode === PointerMode.View) {
         this.renderer.obj.rotX(delta.y * 0.01);
         this.renderer.obj.rotY(delta.x * 0.01);
      }
      else if (this.pointerMode === PointerMode.Light) {

         let matY = Mat4.fromRotY(toRad(delta.x));
         let matX = Mat4.fromRotX(toRad(delta.y));
         let vec = new Vec4([
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
   private onClick(pos: Vec2): boolean {

      let canvasWidth = this.gl.canvas.width;
      let canvasHeight = this.gl.canvas.height;
      let clipSpace = this.renderer.getClipSpace();
      let miniWidth = this.renderer.miniSize * (2 / clipSpace.width) * canvasWidth;
      let miniHeight = this.renderer.miniSize * (2 / clipSpace.height) * canvasHeight;

      if (pos.x < miniWidth && pos.y < miniHeight) {
         this.toggleMode();
         return true;
      }
      else if (pos.x > canvasWidth - miniWidth && pos.y < miniWidth) {
         this.renderer.resetView();
         this.dirty = true;
         return true;
      }

      // not handled
      return false;
   }

   private onScale(scale: number, change: number) {
      this.renderer.zoom(change);
      this.dirty = true;
   }

   private onRotate(angle: number, delta: number) {
      this.renderer.obj.rotZ(delta);
      this.dirty = true;
   }

   private onTranslate(delta: Vec2) {

      // TODO how can this scaling be detected from javascript?
      let factor = 1;
      if (isMobile) {
         factor = 2;
      }

      let clipSpace = this.renderer.getClipSpace();
      this.renderer.translateView(new Vec2([
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
