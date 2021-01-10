import 'webrtc-adapter';
import { IApp } from '../../IApp';
import { Menubar } from '../../GUI/Menu';
import { Version } from './Version';
import NoSleep from 'nosleep.js';
import { ModelTimer } from './ModelTimer';
import { ModelTimerPanel } from './ModelTimerPanel';
import { Sounds } from './Sounds';
import { getEmPixels, isMobile } from '../../Util/Globals';
import { GUI } from '../../GUI/GUI';

export class ModelTimerApp implements IApp {

   private timerPanel: ModelTimerPanel;
   private overlayCanvas: HTMLCanvasElement;

   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
   private noSleep = new NoSleep();


   public constructor() {

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.noSleep.enable();

      document.title += (' ' + Version.Build);
   }

   public create(div: HTMLDivElement): void {

      div.id = 'ModelTimerApp';

      let bodyDiv = GUI.create('div', 'BodyDiv', div);

      let timer = new ModelTimer();
      this.timerPanel = new ModelTimerPanel(timer, bodyDiv)
      this.timerPanel.goFullScreenOnStart = isMobile;

      this.overlayCanvas = GUI.create('canvas', 'OverlayCanvas', bodyDiv);

      window.addEventListener('resize', () => {
         this.timerPanel.draw();
      });

      this.timerPanel.draw();
      this.draw();
   }

   public buildMenu(menubar: Menubar): void {

      const soundMenu = menubar.addSubMenu('Sounds');
      for (let soundStr in Sounds) {
         const sound: Sounds = Sounds[soundStr as keyof typeof Sounds];
         soundMenu.addRadiobutton({
            label: soundStr.replace('_', ' '),
            group: 'Sounds',
            checked: this.timerPanel.sound === sound,
            oncheck: () => {
               this.timerPanel.sound = sound;
               this.timerPanel.playSound();
            }
         });
      }

      /*
      const posesMenu = menubar.addSubMenu('Poses');
      posesMenu.addCheckbox({
         label: '1\'s (20)',
         checked: false,
      });
      posesMenu.addCheckbox({
         label: '1\'s (10) and 2\'s (5)',
         checked: false,
      });
      posesMenu.addCheckbox({
         label: '5\'s (4)',
         checked: false,
      });
      posesMenu.addCheckbox({
         label: '5\'s (2) and 10\'s (1)',
         checked: false,
      });
      posesMenu.addCheckbox({
         label: '10\'s (2)',
         checked: false,
      });
      posesMenu.addCheckbox({
         label: '20 min',
         checked: true,
      });
      */
   }

   private getTimeStr(): string {

      let d = new Date();
      let hours = d.getHours();

      let hoursStr = '';
      if (hours === 0) {
         hoursStr = '12';
      }
      else if (hours > 12) {
         hoursStr = (hours - 12).toString();
      }
      else {
         hoursStr = hours.toString();
      }

      return hoursStr + ':' + d.getMinutes() + ' ' + (hours > 12 ? 'PM' : 'AM');

   }

   private draw(): void {

      let width = this.timerPanel.width;
      let height = this.timerPanel.height;

      this.overlayCanvas.width = width;
      this.overlayCanvas.height = height;

      let ctx = this.overlayCanvas.getContext('2d');

      ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);


      let em = getEmPixels();
      ctx.font = '2em Arial';
      ctx.fillStyle = 'gray';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(this.getTimeStr(), width / 2, 1 * em);

      requestAnimationFrame(() => this.draw());
   }
}
