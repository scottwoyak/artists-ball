import { ListBox } from "../../GUI/ListBox";
import { Squint } from "./Squint";
import { GUI } from "../../GUI/GUI";
import { IConnectionInfo } from "./SquintMessage";

export class ViewersPanel {
   private div: HTMLDivElement;

   private viewersListBox: ListBox;
   private chatListBox: ListBox;

   private squint: Squint;

   public get visible(): boolean {
      return (getComputedStyle(this.div).display !== 'none');
   }

   public set visible(flag: boolean) {
      if (flag === this.visible) {
         return;
      }

      if (flag) {
         this.div.style.display = 'flex';
      }
      else {
         this.div.style.display = 'none';
      }
   }

   public constructor(squint: Squint, parent: HTMLElement) {
      this.squint = squint;
      this.div = GUI.create('div', 'ViewersPanelDiv', parent);


      let viewersTitleDiv = GUI.create('div', 'ViewersTitleDiv', this.div);
      viewersTitleDiv.className = 'TitleClass';
      viewersTitleDiv.innerText = 'Viewers';

      this.viewersListBox = new ListBox(this.div, 'ViewersListBox');

      let chatTitleDiv = GUI.create('div', 'ChatTitleDiv', this.div);
      chatTitleDiv.className = 'TitleClass';
      chatTitleDiv.innerText = 'Chat';

      this.chatListBox = new ListBox(this.div, 'ChatListBox');

      let chatTextInput = GUI.create('input', 'ChatTextInput', this.div);
      chatTextInput.type = 'text';
      chatTextInput.placeholder = 'Type chat message here';

      chatTextInput.onkeydown = (event: KeyboardEvent) => {
         if (event.keyCode === 13) {
            this.squint.sendChatMessage(chatTextInput.value);
            chatTextInput.value = '';
         }
         event.stopPropagation();
      }



      this.squint.onViewerList = (list: IConnectionInfo[]) => {
         this.onViewerList(list);
      }

      this.squint.onChatMessage = (src: IConnectionInfo, msg: string) => {
         this.onChatMessage(src, msg);
      }
   }

   private onViewerList(list: IConnectionInfo[]) {
      this.viewersListBox.clear();
      for (let viewer of list) {
         this.viewersListBox.addItem(viewer.userName, viewer.connectionId);
      }
   }

   private onChatMessage(src: IConnectionInfo, msg: string) {
      let item = this.chatListBox.addItem();
      item.innerHTML = '<b>' + src.userName + '</b>: ' + msg;
   }
}