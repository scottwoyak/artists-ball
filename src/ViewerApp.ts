import { toRad, isMobile } from "./Globals";
import { Renderer, Contour } from "./Renderer";
import { Mat4 } from "./Mat";
import { Vec4, Vec2 } from "./Vec";
import { NormalType } from "./TriangleObj";
import { PointerEventHandler } from "./PointerEventHandler";
import { saveAs } from 'file-saver';
import { createModelsMenu } from "./ModelsMenu";
import { ModelLoader } from "./ModelLoader";
import { IApp } from "./IApp";
import { Menubar, SubMenu } from "./Menu";
import { glColor3 } from "./glColor";
import { Slider } from "./Slider";
import { Checkbox } from "./Checkbox";

enum PointerMode {
   View,
   Light,
}

export class ViewerApp implements IApp {
   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;
   private renderer: Renderer;
   private pointerMode: PointerMode = PointerMode.View;
   private overlay: HTMLSpanElement;
   private handler: PointerEventHandler;
   private rotateLightWithObject = false;

   private dirty: boolean = true;
   private animate: boolean = false;
   private animationFrame: number;

   private query: string;

   private loader = new ModelLoader();

   public constructor(query: string) {
      this.query = query;
   }

   public create(div: HTMLDivElement) {

      div.className = 'ViewerApp';

      const viewContainer = document.createElement('div');
      viewContainer.id = 'ViewContainer';
      viewContainer.className = 'container';
      div.appendChild(viewContainer);
      this.createViewElements(viewContainer);

      this.loadModel(this.query);
   }

   public delete() {
      cancelAnimationFrame(this.animationFrame);
   }

   private createViewElements(parent: HTMLElement) {

      let canvas = document.createElement('canvas');
      canvas.id = 'MainCanvas';
      parent.appendChild(canvas);

      this.overlay = document.createElement('div');
      this.overlay.id = 'Overlay';
      parent.appendChild(this.overlay);

      // don't try to make the canvas transparent to the underlying html. This
      // seems to limit the alpha values we can use in our scene.
      let context = canvas.getContext('webgl', { alpha: false }) as WebGLRenderingContext;

      if (!context) {
         // TODO display a message about not being able to create a WebGL context
         console.log("Unable to get WebGL context");
      }
      this.gl = context;

      this.updateSize();

      this.renderer = new Renderer(this.gl);
      this.renderer.showMiniView = false;
      this.renderer.contours = [
         new Contour(new glColor3([1.00, 0.20, 0.20]), 10), // red
         new Contour(new glColor3([1.00, 0.55, 0.25]), 20), // orange
         new Contour(new glColor3([1.00, 0.81, 0.25]), 30), // light orange
         new Contour(new glColor3([1.00, 1.00, 0.00]), 40), // yellow
         new Contour(new glColor3([0.30, 1.00, 0.10]), 50), // green
         new Contour(new glColor3([0.25, 0.90, 0.90]), 60), // cyan
         new Contour(new glColor3([0.50, 0.50, 1.00]), 70), // light blue
         new Contour(new glColor3([0.20, 0.20, 1.00]), 80), // blue
         new Contour(new glColor3([0.30, 0.11, 0.40]), 90), // purple
      ]

      this.handler = new PointerEventHandler(canvas);
      this.handler.onDrag = (pos: Vec2, delta: Vec2) => this.onDrag(pos, delta);
      this.handler.onDown = () => this.animate = false;
      this.handler.onClick = (pos: Vec2) => this.onClick(pos);
      this.handler.onDblClick = () => this.animate = true;
      this.handler.onScale = (scale: number, change: number) => this.onScale(scale, change);
      this.handler.onRotate = (angle: number, delta: number) => this.onRotate(angle, delta);
      this.handler.onTranslate = (delta: Vec2) => this.onTranslate(delta);

      document.onkeydown = (event: KeyboardEvent) => {
         let angle = 90;
         if (event.ctrlKey) {
            angle = 1;
         }
         switch (event.keyCode) {
            case 37: // left
               this.doRotations(toRad(angle), 0);
               this.dirty = true;
               break;
            case 38: // up
               this.doRotations(0, toRad(angle));
               this.dirty = true;
               break;
            case 39: // right
               this.doRotations(toRad(-angle), 0);
               this.dirty = true;
               break;
            case 40: // down
               this.doRotations(0, toRad(-angle));
               this.dirty = true;
               break;
         }
      }
      document.onkeypress = (event: KeyboardEvent) => {
         switch (event.key) {

            case 'a':
               this.renderer.obj.applyXForm();
               this.dirty = true;
               break;

            case 'c':
               this.renderer.showContours = !this.renderer.showContours;
               this.dirty = true;
               break;

            case 'd':
               this.renderer.showShadowMap = !this.renderer.showShadowMap;
               this.dirty = true;
               break;

            case 'h':
               this.renderer.showHighlights = !this.renderer.showHighlights;
               this.dirty = true;
               break;

            case 'i':
               alert(
                  this.renderer.tObj.name + '\n' +
                  'Num Triangles: ' + this.renderer.tObj.numTriangles.toLocaleString() + '\n' +
                  'Num Vertices: ' + this.renderer.tObj.numVertices.toLocaleString() + '\n'
               );
               break;

            case 'o':
               this.optimize(NormalType.Smooth);
               break;

            case 'p':
               this.optimize(NormalType.Flat);
               break;

            case 'r':
               this.renderer.tObj.reverse();
               this.renderer.obj.uploadTriangles();
               this.dirty = true;
               break;

            case 's':
               this.save();
               break;

            case 't':
               this.renderer.tObj.mirror(62, false);
               this.renderer.setModel(this.renderer.tObj);
               this.dirty = true;
               break;

            case 'v':
               this.renderer.useOrthographic = !this.renderer.useOrthographic;
               this.dirty = true;
               break;
         }
      }
      window.onresize = () => {

         this.updateSize();
         this.dirty = true;
      }
   }

   public buildMenu(menubar: Menubar) {
      createModelsMenu(menubar, (file) => this.loadModel(file));

      let subMenu: SubMenu;
      subMenu = menubar.addSubMenu('Options', 'Options');
      subMenu.addCheckbox({
         label: 'Show Floor',
         id: 'ShowFloor',
         checked: () => this.renderer.showFloor,
         oncheck: (checkbox: Checkbox) => {
            this.renderer.showFloor = checkbox.checked;
            this.dirty = true;
         }
      });
      subMenu.addCheckbox({
         label: 'Show Contours',
         id: 'ShowContours',
         checked: () => this.renderer.showContours,
         oncheck: (checkbox: Checkbox) => {
            this.renderer.showContours = checkbox.checked;
            this.dirty = true;
         }
      });
      subMenu.addCheckbox({
         label: 'Use Perspective',
         id: 'Use Perspective',
         checked: () => !this.renderer.useOrthographic,
         oncheck: (checkbox: Checkbox) => {
            this.renderer.useOrthographic = !checkbox.checked;
            this.dirty = true;
         }
      });
      subMenu.addItem('Reverse Object', () => {
         this.renderer.tObj.reverse();
         this.renderer.obj.uploadTriangles();
         this.dirty = true;
      });

      let highlightSubMenu = subMenu.addSubMenu('Highlights', 'Highlights');
      highlightSubMenu.addCheckbox({
         label: 'Show Highlights',
         id: 'ShowHighlights',
         checked: () => this.renderer.showHighlights,
         oncheck: (checkbox: Checkbox) => {
            this.renderer.showHighlights = checkbox.checked;
            this.dirty = true;
         }
      });

      highlightSubMenu.addCheckbox({
         label: 'Emphasize Highlights',
         id: 'Emphasizelights',
         checked: () => this.renderer.emphasizeHighlights,
         oncheck: (checkbox: Checkbox) => {
            this.renderer.emphasizeHighlights = checkbox.checked;
            this.dirty = true;
         }
      });

      highlightSubMenu.addSlider({
         id: 'Shininess',
         label: 'Shininess',
         min: 1,
         max: 50,
         value: this.renderer.uShininess,
         oninput: (slider: Slider) => {
            this.renderer.uShininess = slider.value;
            this.dirty = true;
         },
      });

      let rotateSubMenu = subMenu.addSubMenu('Rotation', 'Rotation');
      rotateSubMenu.addCheckbox({
         label: 'Sync Light and Object',
         id: 'SyncLightAndObject',
         checked: () => this.rotateLightWithObject,
         oncheck: (checkbox: Checkbox) => {
            this.rotateLightWithObject = checkbox.checked;
         }
      });
      rotateSubMenu.addCheckbox({
         label: 'Lock Floor',
         id: 'LockFloor',
         checked: () => this.renderer.lockFloor,
         oncheck: (checkbox: Checkbox) => {
            this.renderer.lockFloor = checkbox.checked;
         }
      });
   }

   private optimize(normalType: NormalType) {

      let obj = this.renderer.obj;
      let oldNumVertices = obj.tObj.numVertices;

      obj.optimize(normalType);

      let newNumVertices = obj.tObj.numVertices;

      //let msg = 'Optimized .OBJ content copied to clipboard\n\n';
      let msg = 'Optimized .OBJ content\n\n';
      msg += 'Num Triangles: ' + obj.tObj.numTriangles + '\n';
      msg += 'Num Vertices: ' + oldNumVertices + ' to ' + newNumVertices + ', ' + (100 * newNumVertices / oldNumVertices).toFixed() + ' %\n';
      alert(msg);

      //let str = obj.tObj.toObjString(6);
      //navigator.clipboard.writeText(str).then(() => { alert(msg) });

      this.dirty = true;
   }

   private updateSize() {
      let gl = this.gl;

      let menubarHeight = document.getElementById('Menubar').clientHeight;
      let width = window.innerWidth;
      let height = window.innerHeight;

      gl.canvas.width = width;
      gl.canvas.height = height - menubarHeight;
      this.overlay.style.width = width + 'px';
      this.overlay.style.height = height + 'px';
      this.overlay.style.lineHeight = height + 'px'; // vertically center text
   }

   private loadModel(query: string) {

      // if nothing was specified, load an interesting model
      if (!query) {
         let num = Math.round(0.5 + 16 * Math.random());
         query = 'Pose_0' + num + '.blob';
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

               if (query.startsWith('Head') || query.startsWith('Teapot')) {
                  this.renderer.useCulling = false;
               }

               this.animate = false;
               this.dirty = true;
               this.pointerMode = PointerMode.View;
               if (!this.animationFrame) {
                  this.animationFrame = requestAnimationFrame(() => this.tick());
               }

               /*
               let box = BoundingBox.infinite;
               box.max.x = 62.1;
               this.trim(tObj, box);

               this.loader.loadModelFile('SubTool3.blob', statusFunc).then((tObj2) => {
                  tObj.combine(tObj2);
                  return tObj;
               }).then(() => {
                  this.renderer.setModel(tObj);

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
            this.renderer.ballColor = glColor3.modelWhite;
            break;
      }
      this.dirty = true;
   }

   private updateLight(xRad: number, yRad: number) {
      let matY = Mat4.fromRotY(xRad);
      let matX = Mat4.fromRotX(yRad);
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

   private doRotations(xRad: number, yRad: number) {
      if (this.renderer.lockFloor) {
         // rotate in all directions if we're just rotating the object in space
         this.renderer.rotX(yRad);
         this.renderer.rotY(xRad);
      }
      else {
         // if the floor moves with the object, then up-down movement tilts the
         // whole scene while left-right movement only spins the model
         this.renderer.rotX(yRad);
         this.renderer.preRotY(xRad);

         if (this.rotateLightWithObject == false) {
            xRad = 0;
         }

         this.updateLight(xRad, yRad);
      }
   }

   private onDrag(pos: Vec2, delta: Vec2) {
      this.dirty = true;

      if (this.pointerMode === PointerMode.View) {
         this.doRotations(-delta.x * 0.01, -delta.y * 0.01);
      }
      else if (this.pointerMode === PointerMode.Light) {
         this.updateLight(-delta.x * 0.01, -delta.y * 0.01);
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
      this.renderer.rotZ(delta);
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
         this.renderer.render();
         this.dirty = false;
      }

      if (this.animate) {
         this.renderer.preRotY(toRad(-1));
         if (this.rotateLightWithObject) {
            this.updateLight(toRad(1), 0);
         }
         this.dirty = true;
      }

      requestAnimationFrame(() => this.tick());
   }

   private save() {
      let tObj = this.renderer.tObj;

      let name = tObj.name.split('.')[0] + '.blob';
      saveAs(tObj.toBlob(), name);
   }
}
