import { GUI } from "../../GUI/GUI";
import { SquintHttpUrl } from "./Servers";
import { Dialog } from "../../GUI/Dialog";

export type okHandler = (userName: string) => void;

export class WelcomeDialog extends Dialog {

   public constructor(
      parent: HTMLDivElement,
      onOk: okHandler
   ) {
      super(parent, 'Welcome');

      let titleDiv = GUI.create('div', 'TitleDiv', this.dialogDiv);
      titleDiv.className = 'DialogTitleClass';
      titleDiv.innerText = 'Welcome to Squint!';

      let bodyDiv = GUI.create('div', 'BodyDiv', this.dialogDiv);
      let img = GUI.create('img', 'SquintImg', bodyDiv);
      img.src = SquintHttpUrl + 'squint.jpg';

      let userNameGroupDiv = GUI.create('div', 'UserNameGroupDiv', bodyDiv);
      let userNameLabel = GUI.create('label', 'UserNameLabel', userNameGroupDiv);
      userNameLabel.htmlFor = 'UserNameInput';
      userNameLabel.innerText = 'Name:';
      let userNameTextInput = GUI.create('input', 'UserNameTextInput', userNameGroupDiv);
      userNameTextInput.type = 'text';
      userNameTextInput.placeholder = 'Your Name';

      userNameTextInput.oninput = () => {
         okButton.disabled = (userNameTextInput.value.trim().length === 0);
      };

      userNameTextInput.onkeypress = (event: KeyboardEvent) => {
         if (event.keyCode === 13) {
            event.preventDefault();
            okButton.click();
         }
      }

      this.onShow = () => {
         userNameTextInput.select();
         userNameTextInput.focus();
      }

      let okButton = GUI.create('button', 'OkButton', userNameGroupDiv);
      okButton.innerText = 'Start Squinting...';
      okButton.onclick = () => {
         let userName = userNameTextInput.value.trim();
         if (userName.length > 0) {
            this.visible = false;
            onOk(userNameTextInput.value.trim());
         }
      };
      okButton.disabled = true;
      okButton.className = 'ButtonClass';
   }
}