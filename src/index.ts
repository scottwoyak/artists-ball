import { App } from "./app";
import './styles.css';

let app: App;

window.onload = function () {

   let query: string;
   if (window.location.search) {
      query = window.location.search.substr(1);
   }

   app = new App(query);
   document.body.appendChild(app.component());
}

