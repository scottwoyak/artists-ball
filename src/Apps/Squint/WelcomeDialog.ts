import { GUI } from '../../GUI/GUI';
import { Dialog } from '../../GUI/Dialog';
import { baseUrl } from '../../Util/Globals';

export type okHandler = (userName: string) => void;

export class WelcomeDialog extends Dialog {

   public constructor(
      parent: HTMLDivElement,
      onOk: okHandler
   ) {
      super(parent, 'Welcome');

      const titleDiv = GUI.create('div', 'TitleDiv', this.dialogDiv);
      titleDiv.className = 'DialogTitleClass';
      titleDiv.innerText = 'Welcome to Squint!';

      //const bodyDiv = GUI.create('div', 'BodyDiv', this.dialogDiv);
      const img = GUI.create('img', 'SquintImg', this.dialogDiv);
      img.src = baseUrl() + 'img/squint.jpg';

      const userNameGroupDiv = GUI.create('div', 'UserNameGroupDiv', this.dialogDiv);
      const userNameTextInput = GUI.create('input', 'UserNameTextInput', userNameGroupDiv);
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

      const okButton = GUI.create('button', 'OkButton', userNameGroupDiv);
      okButton.innerText = 'Start Squinting...';
      okButton.onclick = () => {
         const userName = userNameTextInput.value.trim();
         if (userName.length > 0) {
            this.visible = false;
            onOk(userNameTextInput.value.trim());
         }
      };
      okButton.disabled = true;
      okButton.className = 'ButtonClass';
   }
}