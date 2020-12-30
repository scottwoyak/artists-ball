import 'webrtc-adapter';
import { IApp } from '../../IApp';
import { Menubar, SubMenu } from '../../GUI/Menu';
import { Version } from './Version';
import NoSleep from 'nosleep.js';
import { StorageItem, StorageWithEvents } from './StorageWithEvents';
import { ModelTimer } from './ModelTimer';
import { ModelTimerPanel } from './ModelTimerPanel';

enum Sounds {
   Chime = 'sounds/chime.mp3',
   Cricket = 'sounds/cricket.mp3',
   Ding = 'sounds/ding.mp3',
   Gong = 'sounds/gong.mp3',
   Loon = 'sounds/loon.mp3',
   Owl = 'sounds/owl.mp3',
   Ring = 'sounds/ring.mp3',
}

export class ModelTimerApp implements IApp {

   private timerPanel: ModelTimerPanel;
   private storage = new StorageWithEvents();

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

      if (this.storage.has(StorageItem.Sound)) {
         this.timerPanel.sound = this.storage.get(StorageItem.Sound);
      }

      window.addEventListener('resize', () => this.updateSizes());
      this.updateSizes();
   }

   private setSound(sound: string): void {
      this.timerPanel.sound = sound;
      this.timerPanel.playSound();
      this.storage.set(StorageItem.Sound, sound);
   }

   private addSoundRadioButton(menu: SubMenu, label: string, sound: Sounds) {
      menu.addRadiobutton({
         label: label,
         group: 'Sounds',
         checked: this.timerPanel.sound === sound,
         oncheck: () => {
            this.setSound(sound);
         }
      });

   }

   public buildMenu(menubar: Menubar): void {

      const soundMenu = menubar.addSubMenu('Sounds');
      this.addSoundRadioButton(soundMenu, 'Chimes', Sounds.Chime);
      this.addSoundRadioButton(soundMenu, 'Crickets', Sounds.Cricket);
      this.addSoundRadioButton(soundMenu, 'Ding', Sounds.Ding);
      this.addSoundRadioButton(soundMenu, 'Gong', Sounds.Gong);
      this.addSoundRadioButton(soundMenu, 'Loon', Sounds.Loon);
      this.addSoundRadioButton(soundMenu, 'Owl', Sounds.Owl);
      this.addSoundRadioButton(soundMenu, 'Ring', Sounds.Ring);
      /*
      soundMenu.addCheckbox({
         label: 'Words',
         checked: false,
      });
      */

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
