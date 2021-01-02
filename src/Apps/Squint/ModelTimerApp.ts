import 'webrtc-adapter';
import { IApp } from '../../IApp';
import { Menubar, SubMenu } from '../../GUI/Menu';
import { Version } from './Version';
import NoSleep from 'nosleep.js';
import { ModelTimer } from './ModelTimer';
import { ModelTimerPanel } from './ModelTimerPanel';
import { Sounds } from './Sounds';
import { isMobile } from '../../Util/Globals';

export class ModelTimerApp implements IApp {

   private timerPanel: ModelTimerPanel;

   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
   private noSleep = new NoSleep();


   public constructor() {

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.noSleep.enable();

      document.title += (' ' + Version.Build);
   }

   public create(div: HTMLDivElement): void {

      div.id = 'ModelTimerApp';

      let timer = new ModelTimer();
      this.timerPanel = new ModelTimerPanel(timer, div)
      this.timerPanel.goFullScreenOnStart = isMobile;

      window.addEventListener('resize', () => this.updateSizes());
      this.updateSizes();
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

   private updateSizes() {
      let menuBar = document.getElementById('Menubar');
      const menubarHeight = menuBar.getBoundingClientRect().height;

      const viewWidth = window.innerWidth;
      const viewHeight = window.innerHeight;

      this.timerPanel.width = viewWidth;
      this.timerPanel.height = viewHeight - menubarHeight;
   }
}
