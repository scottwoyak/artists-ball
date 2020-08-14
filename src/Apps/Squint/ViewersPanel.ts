import { ListBox } from "../../GUI/ListBox";
import { Squint } from "./Squint";
import { GUI } from "../../GUI/GUI";
import { IConnectionInfo } from "./SquintMessage";
import { Vec2 } from "../../Util3D/Vec";
import { ResizeablePanel } from "./ResizeablePanel";

export class ViewersPanel extends ResizeablePanel {

   private viewersListBox: ListBox;
   private chatListBox: ListBox;

   private squint: Squint;

   public constructor(squint: Squint, parent: HTMLElement) {
      super(parent, 'ViewersPanelDiv', 'Flex');
      this.squint = squint;

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