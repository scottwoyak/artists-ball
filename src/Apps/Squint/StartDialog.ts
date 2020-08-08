import { ListBox } from "../../GUI/ListBox";
import { Version } from "./Version";
import { Squint, IConnectionInfo } from "./Squint";
import { GUI } from "../../GUI/GUI";
import { UserNameDialog } from "./UserNameDialog";

export type ViewSessionHandler = (connectionId: string) => void;
export type StartSessionHandler = () => void;
export type GetUserNameHandler = () => string;
export type SetUserNameHandler = (name: string) => void;

export class StartDialog {
   private viewListBox: ListBox<string>;
   private backgroundDiv: HTMLDivElement;
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

   public get visible(): boolean {
      return (getComputedStyle(this.backgroundDiv).display === 'block');
   }
   public set visible(flag: boolean) {
      if (flag === this.visible) {
         return;
      }

      if (flag) {
         this.enable = false;
         this.backgroundDiv.style.display = 'block';
         this.connect();
      }
      else {
         this.backgroundDiv.style.display = 'none';
      }
   }

   public constructor(
      parent: HTMLDivElement,
      squint: Squint,
      onViewSession: ViewSessionHandler,
      onStartSession: StartSessionHandler,
      onGetUserName: GetUserNameHandler,
      onSetUserName: SetUserNameHandler
   ) {
      this.squint = squint;
      this.squint.onSessionList = (sessions) => this.onSessionList(sessions);
      this.onStartView = onViewSession;
      this.onStartSession = onStartSession;
      this.onGetUserName = onGetUserName;
      this.onSetUserName = onSetUserName;

      this.backgroundDiv = GUI.create('div', 'StartDialogBackgroundDiv', parent);
      this.backgroundDiv.className = 'DialogBackgroundClass';

      let dialogDiv = GUI.create('div', 'StartDialogDiv', this.backgroundDiv);
      let dialogTitleDiv = GUI.create('div', 'DialogTitleDiv', dialogDiv);
      let titleDiv = GUI.create('div', 'TitleDiv', dialogTitleDiv);
      titleDiv.className = 'DialogTitleClass';
      titleDiv.innerText = 'Squint V 0.1.' + Version.Build;

      this.connectingDiv = GUI.create('div', 'ConnectingTextDiv', dialogTitleDiv);
      this.connectingDiv.innerText = 'connecting...';

      this.connectingAnimationDiv = GUI.createAnimation('ConnectingAnimationDiv', dialogTitleDiv);

      this.userNameButton = GUI.create('button', 'UserNameButton', dialogTitleDiv);
      this.userNameButton.innerText = 'Hi ' + onGetUserName();
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

      this.bodyDiv = GUI.create('div', 'DialogBodyDiv', dialogDiv);

      //
      // View a session panel
      //
      let viewPanelDiv = GUI.create('div', 'ViewPanelDiv', this.bodyDiv);
      let viewHeader = GUI.create('div', 'ViewHeaderDiv', viewPanelDiv);
      document.createElement('div');
      viewHeader.innerText = 'View a camera...';

      this.viewListBox = new ListBox<string>(
         viewPanelDiv, {
         id: 'ViewListBox'
      });
      this.viewListBox.onSelectedChanged = () => {
         goViewButton.disabled = (this.viewListBox.selected === null);
      }

      let buttonDiv = GUI.create('div', 'ButtonDiv', viewPanelDiv);
      buttonDiv.className = 'ButtonDivClass';

      let goViewButton = GUI.create('button', 'ViewButton', buttonDiv);
      goViewButton.innerText = 'Go';
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
      document.createElement('div');
      orDiv.innerText = 'OR';



      //
      // Host a session panel
      //
      let hostPanelDiv = GUI.create('div', 'HostPanelDiv', this.bodyDiv);

      let hostHeader = GUI.create('div', 'HostHeaderDiv', hostPanelDiv);
      hostHeader.innerText = 'Share your camera...';

      let middleDiv = GUI.create('div', 'HostImageDiv', hostPanelDiv);

      buttonDiv = GUI.create('div', 'ButtonDiv', hostPanelDiv);
      buttonDiv.className = 'ButtonDivClass';

      this.goHostButton = GUI.create('button', 'HostButton', buttonDiv);
      this.goHostButton.innerText = 'Go';
      this.goHostButton.onclick = () => {
         this.onStartSession();
         this.visible = false;
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
            this.squint.onSessionList = (sessions: IConnectionInfo[]) => {
               this.onSessionList(sessions);
            }
            this.squint.onUpdateConnectionInfo = (info: IConnectionInfo) => {
               this.onUpdateConnectionInfo(info);
            }

            this.connectingDiv.style.display = 'none';
            this.connectingAnimationDiv.style.display = 'none';
            this.userNameButton.style.display = 'block';
            this.enable = true;
         })
         .catch((err) => {
            alert(err);
            setTimeout(() => {
               this.connect();
            }, 5000);
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