
export class GUI {
   public static create<K extends keyof HTMLElementTagNameMap>(
      type: K,
      id: string,
      parent: HTMLElement,
      className?: string
   ): HTMLElementTagNameMap[K] {
      const elem = document.createElement(type);
      elem.id = id;
      parent.appendChild(elem);
      if (className) {
         elem.className = className;
      }
      return elem;
   }

   public static createAnimation(id: string, parent: HTMLElement): HTMLDivElement {
      const div = document.createElement('div');
      div.id = id;
      div.className = 'lds-ring';
      div.appendChild(document.createElement('div'));
      div.appendChild(document.createElement('div'));
      div.appendChild(document.createElement('div'));
      div.appendChild(document.createElement('div'));
      parent.appendChild(div);
      return div;
   }
}

