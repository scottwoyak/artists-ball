export class TabControl {

   private parent: HTMLElement;
   private tabsDiv: HTMLDivElement;
   private tabs: HTMLButtonElement[] = [];
   private tabContentDivs: HTMLDivElement[] = [];

   public constructor(parent: HTMLElement) {
      this.parent = parent;

      this.tabsDiv = document.createElement('div');
      this.tabsDiv.className = 'Tabs';
      parent.appendChild(this.tabsDiv);
   }

   public createTab(text: string): HTMLDivElement {

      let tabContentId = text.replace(' ', '');

      // create the button in the tab
      let tab = document.createElement('button');
      tab.className = 'Tab';
      tab.innerText = text;
      this.tabsDiv.appendChild(tab);
      this.tabs.push(tab);

      // create the div for managing tab content
      let tabContentDiv = document.createElement('div');
      this.parent.appendChild(tabContentDiv);
      tabContentDiv.className = 'TabContent';
      tabContentDiv.id = tabContentId;
      this.tabContentDivs.push(tabContentDiv);

      if (this.tabs.length == 1) {
         tab.className = tab.className + ' active';
         tabContentDiv.style.display = 'block';
      }

      tab.onclick = () => this.onTab(tab, tabContentDiv);
      tab.ontouchstart = (evt) => {
         evt.preventDefault();
         this.onTab(tab, tabContentDiv);
      }

      return tabContentDiv
   }

   private onTab(tab: HTMLButtonElement, tabContentDiv: HTMLDivElement) {

      // Get all elements with class="tabcontent" and hide them
      for (let i = 0; i < this.tabContentDivs.length; i++) {
         this.tabContentDivs[i].style.display = "none";
      }

      // display the tab contents
      tabContentDiv.style.display = 'block';

      // Get all elements with class="Tab" and remove the class "active"
      for (let i = 0; i < this.tabs.length; i++) {
         this.tabs[i].className = this.tabs[i].className.replace(" active", "");
      }

      // Show the current tab, and add an "active" class to the button that opened the tab
      tab.className += " active";
   }
}