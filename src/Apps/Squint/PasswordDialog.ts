import { GUI } from '../../GUI/GUI';
import { Dialog } from '../../GUI/Dialog';

export type OkHandler = (password: string) => void;
export type CancelHandler = () => void;

export class PasswordDialog extends Dialog {

   public constructor(
      parent: HTMLDivElement,
      onOk: OkHandler,
      onCancel: CancelHandler
   ) {
      super(parent, 'Password');

      const passwordGroupDiv = GUI.create('div', 'PasswordGroupDiv', this.dialogDiv);
      const passwordLabel = GUI.create('label', 'PasswordLabel', passwordGroupDiv);
      passwordLabel.innerText = 'Password:';
      const passwordTextInput = GUI.create('input', 'PasswordTextInput', passwordGroupDiv);
      passwordLabel.htmlFor = passwordTextInput.id;
      passwordTextInput.type = 'text';
      passwordTextInput.placeholder = 'password';

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

      const buttonGroupDiv = GUI.create('div', 'ButtonGroupDiv', this.dialogDiv);
      const okButton = GUI.create('button', 'OkButton', buttonGroupDiv, 'ButtonClass');
      okButton.innerText = 'OK';
      okButton.onclick = () => {
         this.visible = false;
         let password = passwordTextInput.value.trim();
         onOk(password);
      };

      const cancelButton = GUI.create('button', 'CancelButton', buttonGroupDiv, 'ButtonClass');
      cancelButton.innerText = 'Cancel';
      cancelButton.onclick = () => {
         this.visible = false;
         onCancel();
      };

      this.visible = true;
   }
}