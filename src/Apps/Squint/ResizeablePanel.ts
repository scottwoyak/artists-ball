import { Panel, IPanelSettings } from './Panel';
import { Vec2 } from '../../Util3D/Vec';
import { PointerEventHandler } from '../../GUI/PointerEventHandler';

interface IResizeablePanelSettings extends IPanelSettings {
   top?: string;
   left?: string;
}

export class ResizeablePanel extends Panel {

   protected constructor(parent: HTMLElement, id: string, displayStyleForShow = 'block', settingsKey?: string) {
      super(parent, id, displayStyleForShow, settingsKey);

      const handler = new PointerEventHandler(this.div);
      handler.onDrag = (pos: Vec2, delta: Vec2) => {
         this.onDrag(pos, delta);
      }
   }

   protected buildSettingsObj(settings: IResizeablePanelSettings): void {
      super.buildSettingsObj(settings);
      const style = getComputedStyle(this.div);
      settings.left = style.left;
      settings.top = style.top;
   }

   protected onRestore(settings: IResizeablePanelSettings): void {
      super.onRestore(settings);
      if (settings.left !== undefined && settings.top != undefined) {
         this.div.style.top = settings.top;
         this.div.style.left = settings.left;
      }
   }

   private onDrag(pos: Vec2, delta: Vec2) {
      const oldStyle = getComputedStyle(this.div);
      const oldX = this.pxToFloat(oldStyle.left);
      const oldY = this.pxToFloat(oldStyle.top);
      this.div.style.top = (oldY + delta.y) + 'px';
      this.div.style.left = (oldX + delta.x) + 'px';
      this.saveSettings();
   }

   private pxToFloat(value: string): number {
      return Number.parseFloat(value.substr(0, value.length - 2));
   }
}