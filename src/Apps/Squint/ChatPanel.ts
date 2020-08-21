import { ListBox } from '../../GUI/ListBox';
import { Squint } from './Squint';
import { GUI } from '../../GUI/GUI';
import { IConnectionInfo } from './SquintMessage';
import { ResizeablePanel } from './ResizeablePanel';
import { SquintEvent } from './SquintEvents';

export class ChatPanel extends ResizeablePanel {

   private viewersListBox: ListBox;
   private chatListBox: ListBox;

   private squint: Squint;

   public constructor(squint: Squint, parent: HTMLElement) {
      super(parent, 'ViewersPanelDiv', 'Flex');
      this.squint = squint;

      const viewersTitleDiv = GUI.create('div', 'ViewersTitleDiv', this.div);
      viewersTitleDiv.className = 'TitleClass';
      viewersTitleDiv.innerText = 'Viewers';

      this.viewersListBox = new ListBox(this.div, 'ViewersListBox');

      const chatTitleDiv = GUI.create('div', 'ChatTitleDiv', this.div);
      chatTitleDiv.className = 'TitleClass';
      chatTitleDiv.innerText = 'Chat';

      this.chatListBox = new ListBox(this.div, 'ChatListBox');

      const chatTextInput = GUI.create('input', 'ChatTextInput', this.div);
      chatTextInput.type = 'text';
      chatTextInput.placeholder = 'Type chat message here';

      chatTextInput.onkeydown = (event: KeyboardEvent) => {
         if (event.keyCode === 13) {
            this.squint.sendChatMessage(chatTextInput.value);
            chatTextInput.value = '';
         }
         event.stopPropagation();
      }

      this.squint.on({
         event: SquintEvent.ViewerList,
         handler: (list: IConnectionInfo[]) => {
            this.onViewerList(list);
         }
      });

      this.squint.on({
         event: SquintEvent.ChatMessage,
         handler: (src: IConnectionInfo, msg: string) => {
            this.onChatMessage(src, msg);
         }
      });

      this.squint.on({
         event: SquintEvent.Close,
         handler: () => {
            this.chatListBox.clear();
            this.viewersListBox.clear();
         }
      })
   }


   private onViewerList(list: IConnectionInfo[]) {
      this.viewersListBox.clear();
      for (const viewer of list) {
         this.viewersListBox.addItem(viewer.userName, viewer.connectionId);
      }
   }

   private onChatMessage(src: IConnectionInfo, msg: string) {
      const item = this.chatListBox.addItem();
      item.innerHTML = '<b>' + src.userName + '</b>: ' + msg;
   }
}