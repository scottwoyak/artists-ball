import { GUI } from "../../GUI/GUI";

export type okHandler = (userName: string) => void;

export class Dialog {

}

export class UserNameDialog {
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
      currentUserName: string,
      onOk: okHandler
   ) {
      this.backgroundDiv = GUI.create('div', 'UserNameDialogBackgroundDiv', parent);
      this.backgroundDiv.className = 'DialogBackgroundClass';

      let dialogDiv = GUI.create('div', 'UserNameDialogDiv', this.backgroundDiv);

      let userNameGroupDiv = GUI.create('div', 'UserNameGroupDiv', dialogDiv);
      let userNameLabel = GUI.create('label', 'UserNameLabel', userNameGroupDiv);
      userNameLabel.htmlFor = 'UserNameInput';
      userNameLabel.innerText = 'Name:';
      let userNameInput = GUI.create('input', 'UserNameInput', userNameGroupDiv);
      userNameInput.type = 'text';
      userNameInput.placeholder = 'Your Name';
      userNameInput.value = currentUserName;

      userNameInput.oninput = () => {
         okButton.disabled = (userNameInput.value.trim().length === 0);
      };


      let okButton = GUI.create('button', 'OkButton', dialogDiv);
      okButton.innerText = 'OK';
      okButton.onclick = () => {
         this.visible = false;
         onOk(userNameInput.value.trim());
      };

      this.visible = true;

      userNameInput.focus();
      userNameInput.select();
   }
}