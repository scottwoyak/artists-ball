import { ListBox } from '../../GUI/ListBox';
import { Squint } from './Squint';
import { GUI } from '../../GUI/GUI';
import { IConnectionInfoBasic, ISessionInfoFull } from './SquintMessage';
import { ResizeablePanel } from './ResizeablePanel';
import { SquintEvent } from './SquintEvents';

export class ChatPanel extends ResizeablePanel {

   private viewersListBox: ListBox;
   private chatListBox: ListBox;

   private squint: Squint;

   public constructor(squint: Squint, parent: HTMLElement) {
      super(parent, 'ChatPanelDiv', 'Flex', 'ChatPanel');
      this.squint = squint;

      const viewersTitleDiv = GUI.create('div', 'ViewersTitleDiv', this.div);
      viewersTitleDiv.className = 'TitleClass';
      viewersTitleDiv.innerText = 'Viewers';

      const closeButton = GUI.create('button', 'ChatPanelCloseButton', viewersTitleDiv);
      closeButton.className = 'ButtonClass';
      closeButton.innerText = 'X';
      closeButton.onclick = () => {
         this.visible = false;
      }

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
         event: SquintEvent.SessionInfo,
         handler: (info: ISessionInfoFull) => {
            this.onSessionInfo(info);
         }
      });

      this.squint.on({
         event: SquintEvent.ChatMessage,
         handler: (src: IConnectionInfoBasic, msg: string) => {
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


   private onSessionInfo(info: ISessionInfoFull) {
      this.viewersListBox.clear();
      this.viewersListBox.addItem(info.host.userName + ' (host)');
      for (const viewer of info.viewers) {
         this.viewersListBox.addItem(viewer.userName);
      }
   }

   private onChatMessage(src: IConnectionInfoBasic, msg: string) {
      const item = this.chatListBox.addItem();
      item.innerHTML = '<b>' + src.userName + '</b>: ' + msg;
   }
}