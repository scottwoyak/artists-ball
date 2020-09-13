import { GUI } from '../../GUI/GUI';
import { Dialog } from '../../GUI/Dialog';

export type OkHandler = (password: string) => void;

export class SessionSetupDialog extends Dialog {

   public constructor(
      parent: HTMLDivElement,
      onOk: OkHandler
   ) {
      super(parent, 'SessionSetup');

      const passwordGroupDiv = GUI.create('div', 'PasswordGroupDiv', this.dialogDiv);
      const passwordLabel = GUI.create('label', 'PasswordLabel', passwordGroupDiv);
      passwordLabel.innerText = 'Password:';
      const passwordTextInput = GUI.create('input', 'PasswordTextInput', passwordGroupDiv);
      passwordLabel.htmlFor = passwordTextInput.id;
      passwordTextInput.type = 'text';
      passwordTextInput.placeholder = 'leave blank for none';

      passwordTextInput.onkeypress = (event: KeyboardEvent) => {
         if (event.keyCode === 13) {
            event.preventDefault();
            okButton.click();
         }
      }


      this.onShow = () => {
         passwordTextInput.focus();
         passwordTextInput.select();
      }

      const okButton = GUI.create('button', 'OkButton', passwordGroupDiv, 'ButtonClass');
      okButton.innerText = 'OK';
      okButton.onclick = () => {
         this.visible = false;
         let password = passwordTextInput.value.trim();
         onOk(password);
      };

      this.visible = true;
   }
}