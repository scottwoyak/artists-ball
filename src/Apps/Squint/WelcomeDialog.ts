import { GUI } from "../../GUI/GUI";

export type okHandler = (userName: string) => void;

export class WelcomeDialog {
   private backgroundDiv: HTMLDivElement;

   public get visible(): boolean {
      return (getComputedStyle(this.backgroundDiv).display === 'block');
   }
   public set visible(flag: boolean) {
      if (flag === this.visible) {
         return;
      }

      if (flag) {
         this.backgroundDiv.style.display = 'block';
      }
      else {
         this.backgroundDiv.style.display = 'none';
      }
   }

   public constructor(
      parent: HTMLDivElement,
      onOk: okHandler
   ) {
      this.backgroundDiv = GUI.create('div', 'WelcomeDialogBackgroundDiv', parent);
      this.backgroundDiv.className = 'DialogBackgroundClass';

      let dialogDiv = GUI.create('div', 'WelcomeDialogDiv', this.backgroundDiv);

      let titleDiv = GUI.create('div', 'TitleDiv', dialogDiv);
      titleDiv.className = 'DialogTitleClass';
      titleDiv.innerText = 'Welcome to Squint!';


      let userNameGroupDiv = GUI.create('div', 'UserNameGroupDiv', dialogDiv);
      let userNameLabel = GUI.create('label', 'UserNameLabel', userNameGroupDiv);
      userNameLabel.htmlFor = 'UserNameInput';
      userNameLabel.innerText = 'Name:';
      let userNameInput = GUI.create('input', 'UserNameInput', userNameGroupDiv);
      userNameInput.type = 'text';
      userNameInput.placeholder = 'Your Name';

      userNameInput.oninput = () => {
         okButton.disabled = (userNameInput.value.trim().length === 0);
      };


      let okButton = GUI.create('button', 'OkButton', dialogDiv);
      okButton.innerText = 'OK';
      okButton.onclick = () => {
         this.visible = false;
         onOk(userNameInput.value.trim());
      };
      okButton.disabled = true;
   }
}