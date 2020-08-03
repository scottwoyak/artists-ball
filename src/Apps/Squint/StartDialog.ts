import { ListBox } from "../../GUI/ListBox";
import { Version } from "./Version";
import { Squint, ISession } from "./Squint";

export type ViewSessionHandler = (connectionId: string) => void;
export type StartSessionHandler = (sessionName: string) => void;

export class StartDialog {
   private viewListBox: ListBox<string>;
   private backgroundDiv: HTMLDivElement;
   private bodyDiv: HTMLDivElement;
   private connectingDiv: HTMLDivElement;
   private connectingAnimationDiv: HTMLDivElement;
   private sessionNameInput: HTMLInputElement;
   private squint: Squint;
   private onStartView: ViewSessionHandler;
   private onStartSession: StartSessionHandler;

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
   ) {
      this.squint = squint;
      this.squint.onSessionList = (sessions) => this.onSessionList(sessions);
      this.onStartView = onViewSession;
      this.onStartSession = onStartSession;

      this.backgroundDiv = document.createElement('div');
      this.backgroundDiv.className = 'DialogBackground';
      parent.appendChild(this.backgroundDiv);

      let dialogDiv = document.createElement('div');
      dialogDiv.id = 'DialogDiv';
      this.backgroundDiv.appendChild(dialogDiv);

      let dialogTitleDiv = document.createElement('div');
      dialogTitleDiv.id = 'DialogTitleDiv';
      dialogDiv.appendChild(dialogTitleDiv);

      let titleDiv = document.createElement('div');
      titleDiv.id = 'TitleDiv';
      titleDiv.innerText = 'Squint V' + Version.Build;
      dialogTitleDiv.appendChild(titleDiv);

      this.connectingDiv = document.createElement('div');
      this.connectingDiv.id = 'ConnectingText';
      this.connectingDiv.innerText = 'connecting...';
      dialogTitleDiv.appendChild(this.connectingDiv);

      this.connectingAnimationDiv = document.createElement('div');
      this.connectingAnimationDiv.id = 'ConnectingAnimation';
      this.connectingAnimationDiv.className = 'lds-ring';
      this.connectingAnimationDiv.appendChild(document.createElement('div'));
      this.connectingAnimationDiv.appendChild(document.createElement('div'));
      this.connectingAnimationDiv.appendChild(document.createElement('div'));
      this.connectingAnimationDiv.appendChild(document.createElement('div'));
      dialogTitleDiv.appendChild(this.connectingAnimationDiv);

      this.bodyDiv = document.createElement('div');
      this.bodyDiv.id = 'DialogBodyDiv';
      dialogDiv.appendChild(this.bodyDiv);

      //
      // View a session panel
      //
      let viewPanelDiv = document.createElement('div');
      viewPanelDiv.id = 'ViewPanelDiv';
      this.bodyDiv.appendChild(viewPanelDiv);

      let viewHeader = document.createElement('div');
      viewHeader.id = 'ViewHeader';
      viewHeader.className = 'Header';
      viewHeader.innerText = 'View a camera...';
      viewPanelDiv.appendChild(viewHeader);

      this.viewListBox = new ListBox<string>(
         viewPanelDiv, {
         id: 'ViewListBox'
      });
      this.viewListBox.onSelectedChanged = () => {
         goViewButton.disabled = (this.viewListBox.selected === null);
      }

      let buttonDiv = document.createElement('div');
      buttonDiv.className = 'ButtonDiv';
      viewPanelDiv.appendChild(buttonDiv);

      let goViewButton = document.createElement('button');
      goViewButton.id = 'ViewButton';
      goViewButton.innerText = 'Go';
      goViewButton.disabled = true;
      buttonDiv.appendChild(goViewButton);

      goViewButton.onclick = () => {
         this.visible = false;
         let connectionId = this.viewListBox.selected;
         this.onStartView(connectionId);
      }

      //
      // Or panel
      //
      let orParentDiv = document.createElement('div');
      orParentDiv.id = 'OrParentDiv';
      this.bodyDiv.appendChild(orParentDiv);

      let orDiv = document.createElement('div');
      orDiv.id = 'OrDiv';
      orDiv.innerText = 'OR';
      orParentDiv.appendChild(orDiv);



      //
      // Host a session panel
      //
      let hostPanelDiv = document.createElement('div');
      hostPanelDiv.id = 'HostPanelDiv';
      this.bodyDiv.appendChild(hostPanelDiv);

      let hostHeader = document.createElement('div');
      hostHeader.id = 'HostHeader';
      hostHeader.className = 'Header';
      hostHeader.innerText = 'Host a camera...';
      hostPanelDiv.appendChild(hostHeader);

      let sessionNameDiv = document.createElement('div');
      sessionNameDiv.id = 'SessionNameDiv';
      sessionNameDiv.classList.add('Stretch');
      hostPanelDiv.appendChild(sessionNameDiv);

      let nameLabel = document.createElement('label');
      nameLabel.innerText = 'Name:';
      nameLabel.htmlFor = 'NameInputText';
      sessionNameDiv.appendChild(nameLabel);

      this.sessionNameInput = document.createElement('input');
      this.sessionNameInput.type = 'text';
      this.sessionNameInput.id = 'NameInputText';
      this.sessionNameInput.placeholder = 'Your Name';
      sessionNameDiv.appendChild(this.sessionNameInput);
      this.sessionNameInput.oninput = () => {
         goHostButton.disabled = (this.sessionNameInput.value.trim().length === 0);
      };

      buttonDiv = document.createElement('div');
      buttonDiv.classList.add('ButtonDiv', 'NoStretch');
      hostPanelDiv.appendChild(buttonDiv);

      let goHostButton = document.createElement('button');
      goHostButton.id = 'HostOkButton';
      goHostButton.innerText = 'Go';
      goHostButton.disabled = true;
      buttonDiv.appendChild(goHostButton);

      goHostButton.onclick = () => {

         this.onStartSession(this.sessionNameInput.value);
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
      this.viewListBox.clear();
      this.sessionNameInput.value = '';

      // TODO what if the connection closes after connecting with the start dialog open?

      this.squint.connect(Squint.url)
         .then(() => {
            this.squint.onSessionList = (sessions: ISession[]) => {
               this.onSessionList(sessions);
            }
            this.connectingDiv.style.display = 'none';
            this.connectingAnimationDiv.style.display = 'none';
            this.enable = true;
         })
         .catch((err) => {
            alert(err);
            setTimeout(() => {
               this.connect();
            }, 5000);
         });
   }

   private onSessionList(sessions: ISession[]) {

      this.viewListBox.clear();
      for (let i = 0; i < sessions.length; i++) {
         this.viewListBox.addItem(sessions[i].name, sessions[i].connectionId);
      }
   }
}