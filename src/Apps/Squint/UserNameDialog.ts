import { GUI } from "../../GUI/GUI";
import { Dialog } from "../../GUI/Dialog";

export type okHandler = (userName: string) => void;

export class UserNameDialog extends Dialog {

   public constructor(
      parent: HTMLDivElement,
      currentUserName: string,
      onOk: okHandler
   ) {
      // UserNameBackgroundDiv and UserNameDialogDiv
      super(parent, 'UserName');

      let userNameGroupDiv = GUI.create('div', 'UserNameGroupDiv', this.dialogDiv);
      let userNameLabel = GUI.create('label', 'UserNameLabel', userNameGroupDiv);
      userNameLabel.htmlFor = 'UserNameInput';
      userNameLabel.innerText = 'Name:';
      let userNameTextInput = GUI.create('input', 'UserNameTextInput', userNameGroupDiv);
      userNameTextInput.type = 'text';
      userNameTextInput.placeholder = 'Your Name';
      userNameTextInput.value = currentUserName;

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
         userNameTextInput.focus();
         userNameTextInput.select();
      }

      let okButton = GUI.create('button', 'OkButton', userNameGroupDiv);
      okButton.className = 'ButtonClass';
      okButton.innerText = 'OK';
      okButton.onclick = () => {
         this.visible = false;
         onOk(userNameTextInput.value.trim());
      };

      this.visible = true;
   }
}