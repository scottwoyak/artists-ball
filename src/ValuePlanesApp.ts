import { Slider } from "./Slider";
import { toRad, isMobile } from "./Globals";
import { Renderer, Contour, RenderMode } from "./Renderer";
import { Mat4 } from "./Mat";
import { Vec4, Vec2 } from "./Vec";
import { ValuePlanesCtrl } from "./ValuePlanesCtrl";
import { PointerEventHandler } from "./PointerEventHandler";
import { ModelLoader } from "./ModelLoader";
import { IApp } from "./IApp";
import { Menubar } from "./Menu";
import { createModelsMenu } from "./ModelsMenu";
import { ValuePlanes } from "./ValuePlanes";
import { glColor3 } from "./glColor";

enum PointerMode {
   View,
   Light,
}

export class ValuePlanesApp implements IApp {
   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;
   private renderer: Renderer;
   private pointerMode: PointerMode = PointerMode.View;
   private overlay: HTMLSpanElement;
   private handler: PointerEventHandler;
   private animationFrame: number;

   private dirty: boolean = true;

   private query: string;

   private valuePlanes: ValuePlanes;
   private highlightSlider: Slider
   private lightLightSlider: Slider;
   private midLightSlider: Slider;
   private darkLightSlider: Slider;
   private shadowSlider: Slider;
   private valuePlanesCtrl: ValuePlanesCtrl;
   private loader = new ModelLoader();

   public constructor(query: string) {
      this.query = query;
   }






   public create(div: HTMLDivElement) {

      div.className = 'ValuePlanesApp';

      const viewContainer = document.createElement('div');
      viewContainer.id = 'ViewContainer';
      viewContainer.className = 'Container';
      div.appendChild(viewContainer);
      this.createViewElements(viewContainer);
      div.style.width = this.gl.canvas.width + 'px';

      const ctrlsContainer = document.createElement('div');
      ctrlsContainer.className = 'Container';
      ctrlsContainer.id = 'CtrlsContainer';
      div.appendChild(ctrlsContainer);
      this.createCtrlsElements(ctrlsContainer);

      this.loadModel(this.query);
   }

   public delete() {
      cancelAnimationFrame(this.animationFrame);
   }

   public buildMenu(menubar: Menubar) {

      createModelsMenu(menubar, (file) => this.loadModel(file));
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
      this.gl = context;

      this.renderer = new Renderer(this.gl);
      this.renderer.renderMode = RenderMode.Normal;
      this.renderer.miniViewShowContours = true;

      this.valuePlanes = new ValuePlanes(this.renderer.valueRange);

      this.handler = new PointerEventHandler(canvas);
      this.handler.onDrag = (pos: Vec2, delta: Vec2) => this.onDrag(pos, delta);
      this.handler.onClick = (pos: Vec2) => this.onClick(pos);
      this.handler.onScale = (scale: number, change: number) => this.onScale(scale, change);
      this.handler.onRotate = (angle: number, delta: number) => this.onRotate(angle, delta);
      this.handler.onTranslate = (delta: Vec2) => this.onTranslate(delta);
   }

   private createCtrlsElements(parent: HTMLElement) {
      this.valuePlanesCtrl = new ValuePlanesCtrl(
         parent,
         this.valuePlanes,
         (value: number) => {
            this.updateSliders();
            this.dirty = true;
         },
         (value: number) => {
            this.updateSliders();
            this.dirty = true;
         }
      );

      this.highlightSlider = new Slider(parent, {
         id: 'Highlight',
         label: 'Highlight',
         min: 0,
         max: 100,
         value: this.valuePlanes.highlight * 100,
         colors: [glColor3.modelBlack.toHtmlColor(), glColor3.modelWhite.toHtmlColor()],
         oninput: () => {
            this.valuePlanes.highlight = this.highlightSlider.value / 100;
            this.updateSliders();
            this.dirty = true;
         },
         getText: () => { return (100 * this.valuePlanes.highlight).toFixed(0) + "%" }
      });

      this.lightLightSlider = new Slider(parent, {
         id: 'LightLight',
         label: 'Light Light',
         min: 0,
         max: 100,
         value: this.valuePlanes.lightLight * 100,
         colors: [glColor3.modelBlack.toHtmlColor(), glColor3.modelWhite.toHtmlColor()],
         getText: () => { return (100 * this.valuePlanes.lightLight).toFixed(0) + "%" }
      });
      this.lightLightSlider.range.disabled = true;

      this.midLightSlider = new Slider(parent, {
         id: 'MidLight',
         label: 'Mid Light',
         min: 0,
         max: 100,
         value: this.valuePlanes.midLight * 100,
         colors: [glColor3.modelBlack.toHtmlColor(), glColor3.modelWhite.toHtmlColor()],
         getText: () => { return (100 * this.valuePlanes.midLight).toFixed(0) + "%" }
      });
      this.midLightSlider.range.disabled = true;

      this.darkLightSlider = new Slider(parent, {
         id: 'DarkLight',
         label: 'Dark Light',
         min: 0,
         max: 100,
         value: this.valuePlanes.darkLight * 100,
         colors: [glColor3.modelBlack.toHtmlColor(), glColor3.modelWhite.toHtmlColor()],
         getText: () => { return (100 * this.valuePlanes.darkLight).toFixed(0) + "%" }
      });
      this.darkLightSlider.range.disabled = true;

      this.shadowSlider = new Slider(parent, {
         id: 'Shadow',
         label: 'Shadow',
         min: 0,
         max: 100,
         value: this.valuePlanes.shadow * 100,
         colors: [glColor3.modelBlack.toHtmlColor(), glColor3.modelWhite.toHtmlColor()],
         oninput: () => {
            this.valuePlanes.shadow = this.shadowSlider.value / 100;
            this.updateSliders();
            this.dirty = true;
         },
         getText: () => { return (100 * this.valuePlanes.shadow).toFixed(0) + "%" }
      });
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

               this.dirty = true;
               if (!this.animationFrame) {
                  this.animationFrame = requestAnimationFrame(() => this.tick());
               }
            });
      }
      else {
         // TODO multi line error messages not supported
         this.overlay.innerText = 'Unknown Model:' + query;
      }
   }

   private updateSliders() {
      this.highlightSlider.value = 100 * this.valuePlanes.highlight;
      this.lightLightSlider.value = 100 * this.valuePlanes.lightLight;
      this.midLightSlider.value = 100 * this.valuePlanes.midLight;
      this.darkLightSlider.value = 100 * this.valuePlanes.darkLight;
      this.shadowSlider.value = 100 * this.valuePlanes.shadow;
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

   private onDrag(pos: Vec2, delta: Vec2) {
      this.dirty = true;

      if (this.pointerMode === PointerMode.View) {
         // TODO replace 0.01 with some kind of physical measurement
         this.renderer.obj.rotX(-delta.y * 0.01);
         this.renderer.obj.rotY(-delta.x * 0.01);
      }
      else if (this.pointerMode === PointerMode.Light) {

         let matY = Mat4.fromRotY(toRad(-delta.x));
         let matX = Mat4.fromRotX(toRad(-delta.y));
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
      let clipSpace = this.renderer.camera.getClipSpace();
      let miniWidth = this.renderer.miniSize * (2 / clipSpace.width) * canvasWidth;
      let miniHeight = this.renderer.miniSize * (2 / clipSpace.height) * canvasHeight;

      if (pos.x < miniWidth && pos.y < miniHeight) {
         this.toggleMode();
         return true;
      }
      else if (pos.x > canvasWidth - miniWidth && pos.y < miniWidth) {
         this.renderer.renderMode = this.renderer.renderMode === RenderMode.Normal ? RenderMode.Contours : RenderMode.Normal;
         this.renderer.miniViewShowContours = !this.renderer.miniViewShowContours;
         this.dirty = true;
         return true;
      }

      // not handled
      return false;
   }

   private onScale(scale: number, change: number) {
      this.renderer.camera.zoom(change);
      this.dirty = true;
   }

   private onRotate(angle: number, delta: number) {
      this.renderer.obj.rotZ(delta);
      this.dirty = true;
   }

   private onTranslate(delta: Vec2) {

      let factor = 1;
      if (isMobile) {
         factor = 2;
      }

      this.renderer.camera.translate(new Vec2([
         factor * 2 * delta.x / this.gl.canvas.width,
         factor * 2 * delta.y / this.gl.canvas.height
      ]));
      this.dirty = true;
   }

   public tick() {

      if (this.dirty) {

         this.renderer.contours = [
            new Contour(this.valuePlanes.lightLight, this.valuePlanes.threshold1),
            new Contour(this.valuePlanes.midLight, this.valuePlanes.threshold2),
            new Contour(this.valuePlanes.darkLight, 90)
         ];

         this.renderer.render();
         this.valuePlanesCtrl.draw();
         this.dirty = false;
      }

      requestAnimationFrame(() => this.tick());
   }
}
