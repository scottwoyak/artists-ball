import { ListBox } from "../../GUI/ListBox";
import { Version } from "./Version";
import { Squint, SquintEvent } from "./Squint";
import { GUI } from "../../GUI/GUI";
import { UserNameDialog } from "./UserNameDialog";
import { Dialog } from "../../GUI/Dialog";
import { IConnectionInfo } from "./SquintMessage";

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

   public get enable(): boolean {
      return (getComputedStyle(this.bodyDiv).pointerEvents === 'none');
   }
   public set enable(flag: boolean) {
      // TODO move this all to an "Enabled" style
      this.bodyDiv.style.pointerEvents = flag ? 'auto' : 'none';
      this.bodyDiv.style.filter = flag ? '' : 'grayscale(1) contrast(0.4)';
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
         name: SquintEvent.SessionList,
         handler: (sessions: IConnectionInfo[]) => {
            this.onSessionList(sessions);
         }
      });

      this.squint.on({
         name: SquintEvent.UpdateConnectionInfo,
         handler: (info: IConnectionInfo) => {
            this.onUpdateConnectionInfo(info);
         }
      });

      this.onStartView = onViewSession;
      this.onStartSession = onStartSession;
      this.onGetUserName = onGetUserName;
      this.onSetUserName = onSetUserName;

      let dialogTitleDiv = GUI.create('div', 'DialogTitleDiv', this.dialogDiv);
      let titleDiv = GUI.create('div', 'TitleDiv', dialogTitleDiv);
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
               onSetUserName(userName);
               this.userNameButton.innerText = 'Hi ' + userName;
            });
      }

      this.bodyDiv = GUI.create('div', 'DialogBodyDiv', this.dialogDiv);

      //
      // View a session panel
      //
      let viewPanelDiv = GUI.create('div', 'ViewPanelDiv', this.bodyDiv);

      this.viewListBox = new ListBox<string>(viewPanelDiv, 'ViewListBox');
      this.viewListBox.onSelectedChanged = () => {
         goViewButton.disabled = (this.viewListBox.selected === null);
      }

      let buttonDiv = GUI.create('div', 'ButtonDiv', viewPanelDiv);
      buttonDiv.className = 'ButtonDivClass';

      let goViewButton = GUI.create('button', 'ViewButton', buttonDiv);
      goViewButton.className = 'ButtonClass';
      goViewButton.innerText = 'View a camera...';
      goViewButton.disabled = true;
      goViewButton.onclick = () => {
         this.visible = false;
         let connectionId = this.viewListBox.selected;
         this.onStartView(connectionId);
      }




      //
      // Or panel
      //
      let orPanelDiv = GUI.create('div', 'OrPanelDiv', this.bodyDiv);
      let orDiv = GUI.create('div', 'OrDiv', orPanelDiv);
      orDiv.innerText = 'OR';




      //
      // Host a session panel
      //
      let hostPanelDiv = GUI.create('div', 'HostPanelDiv', this.bodyDiv);

      // camera icon css
      let iconDiv = GUI.create('div', 'IconDiv', hostPanelDiv);
      iconDiv.className = 'icon';
      let cameraIconDiv = GUI.create('div', 'CameraDiv', iconDiv);
      cameraIconDiv.className = 'camera-icon';
      let circleSmallDiv = GUI.create('div', 'CircleSmallDiv', cameraIconDiv);
      circleSmallDiv.className = 'camera-circle';
      let circleBigDiv = GUI.create('div', 'CircleBigDiv', cameraIconDiv);
      circleBigDiv.className = 'camera-btn';


      buttonDiv = GUI.create('div', 'ButtonDiv', hostPanelDiv);
      buttonDiv.className = 'ButtonDivClass';

      this.goHostButton = GUI.create('button', 'HostButton', buttonDiv);
      this.goHostButton.className = 'ButtonClass';
      this.goHostButton.innerText = 'Share your camera...';
      this.goHostButton.onclick = () => {
         this.onStartSession();
         this.visible = false;
      }




      this.onShow = () => {
         this.userNameButton.innerText = 'Hi ' + this.onGetUserName();
         this.enable = false;

         if (this.squint.connected === false) {
            this.connect();
         }
      }
   }

   public connect() {
      if (this.squint.connected) {
         console.error('StartDialog.connect() called, but already connected');
         return;
      }

      this.connectingDiv.style.display = 'block';
      this.connectingAnimationDiv.style.display = 'block';
      this.userNameButton.style.display = 'none';
      this.viewListBox.clear();

      // TODO what if the connection closes after connecting with the start dialog open?

      let userName = this.onGetUserName();
      this.squint.connect(Squint.url, userName)
         .then(() => {

            this.connectingDiv.style.display = 'none';
            this.connectingAnimationDiv.style.display = 'none';
            this.userNameButton.style.display = 'block';
            this.enable = true;
         })
         .catch((err) => {
            alert(err);
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
      for (let item of this.viewListBox.items) {
         if (item.userData === info.connectionId) {
            item.div.innerText = info.userName;
         }
      }
   }
}