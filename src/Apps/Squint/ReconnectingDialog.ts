

export class ReconnectingDialog {
   private backgroundDiv: HTMLDivElement;

   public get visible(): boolean {
      return (getComputedStyle(this.backgroundDiv).display === 'block');
   }
   public set visible(flag: boolean) {
      if (flag === this.visible) {
         return;
      }

      if (flag) {
         this.backgroundDiv.style.display = 'block';
      }
      else {
         this.backgroundDiv.style.display = 'none';
      }
   }

   public constructor(
      parent: HTMLDivElement,
   ) {
      this.backgroundDiv = document.createElement('div');
      this.backgroundDiv.className = 'DialogBackgroundClass';
      parent.appendChild(this.backgroundDiv);

      let dialogDiv = document.createElement('div');
      dialogDiv.id = 'MessageDiv';
      dialogDiv.innerText = 'Connection lost. Reconnecting...';
      this.backgroundDiv.appendChild(dialogDiv);
   }
}