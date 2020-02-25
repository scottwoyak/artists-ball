import { App } from "./app";
import './styles.css';

let app: App;

window.onload = function () {
   app = new App();
   document.body.appendChild(app.component());
}

