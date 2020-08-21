import { ListBox } from '../../GUI/ListBox';
import { Version } from './Version';
import { Squint } from './Squint';
import { GUI } from '../../GUI/GUI';
import { UserNameDialog } from './UserNameDialog';
import { Dialog } from '../../GUI/Dialog';
import { IConnectionInfo } from './SquintMessage';
import { SquintEvent } from './SquintEvents';

export type ViewSessionHandler = (connectionId: string) => void;
export type StartSessionHandler = () => void;
export type GetUserNameHandler = () => string;
export type SetUserNameHandler = (name: string) => void;

export class StartDialog extends Dialog {
   private viewListBox: ListBox<string>;
   private bodyDiv: HTMLDivElement;
   private connectingDiv: HTMLDivElement;
   private connectingAnimationDiv: HTMLDivElement;
   private userNameButton: HTMLButtonElement;
   private goHostButton: HTMLButtonElement;
   private squint: Squint;
   private onStartView: ViewSessionHandler;
   private onStartSession: StartSessionHandler;
   private onGetUserName: GetUserNameHandler;
   private onSetUserName: SetUserNameHandler;

   private set showConnectingMsg(flag: boolean) {
      this.bodyDiv.style.pointerEvents = flag ? 'none' : 'auto';
      this.bodyDiv.style.filter = flag ? 'grayscale(1) contrast(0.4)' : '';
      this.connectingDiv.style.display = flag ? 'block' : 'none';
      this.connectingAnimationDiv.style.display = flag ? 'block' : 'none';
      this.userNameButton.style.display = flag ? 'none' : 'block';
   }

   public constructor(
      parent: HTMLDivElement,
      squint: Squint,
      onViewSession: ViewSessionHandler,
      onStartSession: StartSessionHandler,
      onGetUserName: GetUserNameHandler,
      onSetUserName: SetUserNameHandler
   ) {
      super(parent, 'Start');

      this.squint = squint;
      this.squint.on({
         event: SquintEvent.SessionList,
         handler: (sessions: IConnectionInfo[]) => {
            this.onSessionList(sessions);
         }
      });

      this.squint.on({
         event: SquintEvent.UpdateConnectionInfo,
         handler: (info: IConnectionInfo) => {
            this.onUpdateConnectionInfo(info);
         }
      });

      let timeout: number;
      this.squint.on({
         event: SquintEvent.Reconnecting,
         handler: () => {
            timeout = window.setTimeout(() => {
               timeout = -1;
               // give the system a little time to reconnect before showing a message
               this.showConnectingMsg = true;
            }, 500);
         }
      });

      this.squint.on({
         event: SquintEvent.Reconnected,
         handler: (success: boolean) => {
            if (timeout !== -1) {
               window.clearTimeout(timeout);
            }
            if (success) {
               this.showConnectingMsg = false;
            }
            else {
               this.connect();
            }
         }
      });

      this.onStartView = onViewSession;
      this.onStartSession = onStartSession;
      this.onGetUserName = onGetUserName;
      this.onSetUserName = onSetUserName;

      const dialogTitleDiv = GUI.create('div', 'DialogTitleDiv', this.dialogDiv);
      const titleDiv = GUI.create('div', 'TitleDiv', dialogTitleDiv);
      titleDiv.className = 'DialogTitleClass';
      titleDiv.innerText = 'Squint v0.1.' + Version.Build;

      this.connectingDiv = GUI.create('div', 'ConnectingTextDiv', dialogTitleDiv);
      this.connectingDiv.innerText = 'connecting...';

      this.connectingAnimationDiv = GUI.createAnimation('ConnectingAnimationDiv', dialogTitleDiv);

      this.userNameButton = GUI.create('button', 'UserNameButton', dialogTitleDiv);
      this.userNameButton.className = 'ButtonClass';
      this.userNameButton.style.display = 'none';
      this.userNameButton.onclick = () => {
         new UserNameDialog(
            parent,
            onGetUserName(),
            (userName: string) => {
               this.onSetUserName(userName);
               this.userNameButton.innerText = 'Hi ' + userName;
            });
      }

      this.bodyDiv = GUI.create('div', 'DialogBodyDiv', this.dialogDiv);

      //
      // View a session panel
      //
      const viewPanelDiv = GUI.create('div', 'ViewPanelDiv', this.bodyDiv);

      this.viewListBox = new ListBox<string>(viewPanelDiv, 'ViewListBox');
      this.viewListBox.onSelectedChanged = () => {
         goViewButton.disabled = (this.viewListBox.selected === null);
      }

      const buttonDiv = GUI.create('div', 'ButtonDiv', viewPanelDiv);
      buttonDiv.className = 'ButtonDivClass';

      const goViewButton = GUI.create('button', 'ViewButton', buttonDiv);
      goViewButton.className = 'ButtonClass';
      goViewButton.innerText = 'View a camera...';
      goViewButton.disabled = true;
      goViewButton.onclick = () => {
         this.visible = false;
         const connectionId = this.viewListBox.selected;
         this.onStartView(connectionId);
      }





      //
      // Or panel
      //
      const orPanelDiv = GUI.create('div', 'OrPanelDiv', this.bodyDiv);
      const orDiv = GUI.create('div', 'OrDiv', orPanelDiv);
      orDiv.innerText = 'OR';




      //
      // Host a session panel
      //
      const hostPanelDiv = GUI.create('div', 'HostPanelDiv', this.bodyDiv);

      // camera icon css
      const iconDiv = GUI.create('div', 'IconDiv', hostPanelDiv);
      iconDiv.className = 'icon';
      const cameraIconDiv = GUI.create('div', 'CameraDiv', iconDiv);
      cameraIconDiv.className = 'camera-icon';
      const circleSmallDiv = GUI.create('div', 'CircleSmallDiv', cameraIconDiv);
      circleSmallDiv.className = 'camera-circle';
      const circleBigDiv = GUI.create('div', 'CircleBigDiv', cameraIconDiv);
      circleBigDiv.className = 'camera-btn';


      const buttonDiv2 = GUI.create('div', 'ButtonDiv', hostPanelDiv);
      buttonDiv2.className = 'ButtonDivClass';

      this.goHostButton = GUI.create('button', 'HostButton', buttonDiv2);
      this.goHostButton.className = 'ButtonClass';
      this.goHostButton.innerText = 'Share your camera...';
      this.goHostButton.onclick = () => {
         this.onStartSession();
         this.visible = false;
      }




      this.onShow = () => {
         this.userNameButton.innerText = 'Hi ' + this.onGetUserName();

         if (this.squint.connected === false) {
            this.connect();
         }
      }
   }

   public connect(): void {
      if (this.squint.connected) {
         console.error('StartDialog.connect() called, but already connected');
         return;
      }

      this.showConnectingMsg = true;
      this.viewListBox.clear();

      const userName = this.onGetUserName();
      this.squint.connect(Squint.url, userName)
         .then(() => {
            this.showConnectingMsg = false;
         })
         .catch((err) => {
            console.log('Cannot connect to server, trying again in 1 sec: ' + err);
            setTimeout(() => {
               this.connect();
            }, 1000);
         });
   }

   private onSessionList(sessions: IConnectionInfo[]) {

      this.viewListBox.clear();
      for (let i = 0; i < sessions.length; i++) {
         this.viewListBox.addItem(sessions[i].userName, sessions[i].connectionId);
      }
   }

   private onUpdateConnectionInfo(info: IConnectionInfo) {
      for (const item of this.viewListBox.items) {
         if (item.userData === info.connectionId) {
            item.div.innerText = info.userName;
         }
      }
   }
}