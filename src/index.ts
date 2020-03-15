import { BallApp } from "./BallApp";
import './styles.css';
import { PlanesApp } from "./PlanesApp";

window.onload = function () {

   let query: string;
   if (window.location.search) {
      query = window.location.search.substr(1);
   }

   let tokens = query.split('-');
   let type = 'default';
   if (tokens.length === 2) {
      type = tokens[0];
      query = tokens[1];
   }
   if (type === 'planes') {
      let app = new PlanesApp(query);
      document.body.appendChild(app.component());
   }
   else {
      let app = new BallApp(query);
      document.body.appendChild(app.component());
   }
}

