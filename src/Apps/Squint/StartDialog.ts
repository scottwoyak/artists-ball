import { ListBox } from "../../GUI/ListBox";
import { Squint } from "./Squint";
import { Version } from "./Version";

export type ViewSessionHandler = (sessionId: string) => void;
export type StartSessionHandler = (sessionName: string) => void;

export class StartDialog {
   private viewListBox: ListBox<string>;
   private backgroundDiv: HTMLDivElement;
   private sessionNameInput: HTMLInputElement;
   private squint: Squint;
   private onStartView: ViewSessionHandler;
   private onStartSession: StartSessionHandler;

   public get show(): boolean {
      return true;
   }
   public set show(flag: boolean) {
      if (flag) {
         this.backgroundDiv.style.display = 'block';
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
      this.onStartView = onViewSession;
      this.onStartSession = onStartSession;

      this.backgroundDiv = document.createElement('div');
      this.backgroundDiv.className = 'DialogBackground';
      parent.appendChild(this.backgroundDiv);

      let dialogDiv = document.createElement('div');
      dialogDiv.id = 'DialogDiv';
      this.backgroundDiv.appendChild(dialogDiv);

      let titleDiv = document.createElement('div');
      titleDiv.id = 'DialogTitleDiv';
      titleDiv.innerText = 'Squint V' + Version.Build;
      dialogDiv.appendChild(titleDiv);

      let bodyDiv = document.createElement('div');
      bodyDiv.id = 'DialogBodyDiv';
      dialogDiv.appendChild(bodyDiv);

      //
      // View a session panel
      //
      let viewPanelDiv = document.createElement('div');
      viewPanelDiv.id = 'ViewPanelDiv';
      bodyDiv.appendChild(viewPanelDiv);

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

      this.updateList();

      let buttonDiv = document.createElement('div');
      buttonDiv.className = 'ButtonDiv';
      viewPanelDiv.appendChild(buttonDiv);

      let goViewButton = document.createElement('button');
      goViewButton.id = 'ViewButton';
      goViewButton.innerText = 'Go';
      goViewButton.disabled = true;
      buttonDiv.appendChild(goViewButton);

      goViewButton.onclick = () => {
         this.show = false;
         let sessionId = this.viewListBox.selected;
         this.onStartView(sessionId);
      }

      //
      // Or panel
      //
      let orParentDiv = document.createElement('div');
      orParentDiv.id = 'OrParentDiv';
      bodyDiv.appendChild(orParentDiv);

      let orDiv = document.createElement('div');
      orDiv.id = 'OrDiv';
      orDiv.innerText = 'OR';
      orParentDiv.appendChild(orDiv);



      //
      // Host a session panel
      //
      let hostPanelDiv = document.createElement('div');
      hostPanelDiv.id = 'HostPanelDiv';
      bodyDiv.appendChild(hostPanelDiv);

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
         this.show = false;
         this.onStartSession(this.sessionNameInput.value);
      }
   }

   private updateList(responseId: string = undefined) {
      this.squint.listSessions(responseId)
         .then((value) => {
            this.viewListBox.clear();
            for (let i = 0; i < value.sessions.length; i++) {
               this.viewListBox.addItem(value.sessions[i].name, value.sessions[i].id);
            }
            this.updateList(value.responseId);
         })
         .catch((err) => {
            if (err.name !== 'AbortError') {
               console.warn('listSessions: ' + err);
            }
            setTimeout(() => {
               this.updateList(responseId);
            }, 1000);
         })
   }
}