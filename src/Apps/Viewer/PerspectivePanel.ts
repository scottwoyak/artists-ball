import { Panel } from '../../GUI/Panel';
import { PerspectiveCtrl, PerspectiveChangeFunction } from './PerspectiveCtrl';
import { Camera } from './Camera';
import { Mat4 } from '../../Util3D/Mat';
import { TriangleObj } from '../../Util3D/TriangleObj';

export class PerspectivePanel extends Panel {

   private perspectiveCtrl: PerspectiveCtrl;
   private resizeListener = () => this.onResize();

   public onChange: PerspectiveChangeFunction | null = null;

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

   public dispose(): void {
      window.removeEventListener('resize', this.resizeListener);
      this.perspectiveCtrl.dispose();
   }

   public render(model: Mat4): void {
      this.perspectiveCtrl.render(model);
   }

   public setModel(tObj: TriangleObj): void {
      this.perspectiveCtrl.setModel(tObj);
   }

   protected show(value: boolean): void {
      if (value === true) {
         this.onResize();
      }
   }

   private onResize() {
      this.perspectiveCtrl.setSize(this.div.clientWidth, this.div.clientHeight);
   }
}