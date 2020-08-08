
export class GUI {
   public static create<K extends keyof HTMLElementTagNameMap>(
      type: K,
      id: string,
      parent: HTMLElement,
   ): HTMLElementTagNameMap[K] {
      let elem = document.createElement(type);
      elem.id = id;
      parent.appendChild(elem);
      return elem;
   }

   public static createAnimation(id: string, parent: HTMLElement): HTMLDivElement {
      let div = document.createElement('div');
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

