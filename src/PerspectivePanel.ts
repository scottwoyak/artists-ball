import { Panel } from "./Panel";
import { PerspectiveCtrl, PerspectiveChangeFunction } from "./PerspectiveCtrl";
import { Camera } from "./Camera";
import { Mat4 } from "./Mat";
import { TriangleObj } from "./TriangleObj";

export class PerspectivePanel extends Panel {

   private perspectiveCtrl: PerspectiveCtrl;
   private resizeListener = () => this.onResize();

   public onChange: PerspectiveChangeFunction;

   public constructor(parent: HTMLElement, id: string, camera: Camera) {
      super(parent, id);

      this.perspectiveCtrl = new PerspectiveCtrl(this.div, camera);
      this.perspectiveCtrl.onChange = () => {
         if (this.onChange) {
            this.onChange();
         }
      }

      window.addEventListener('resize', this.resizeListener);
   }

   public delete() {
      window.removeEventListener('resize', this.resizeListener);
      this.perspectiveCtrl.delete();
   }

   public render(model: Mat4) {
      this.perspectiveCtrl.render(model);
   }

   public setModel(tObj: TriangleObj) {
      this.perspectiveCtrl.setModel(tObj);
   }

   protected show(value: boolean) {
      if (value === true) {
         this.onResize();
      }
   }

   private onResize() {
      this.perspectiveCtrl.setSize(this.div.clientWidth, this.div.clientHeight);
   }
}