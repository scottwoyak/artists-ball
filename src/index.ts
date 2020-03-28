import { PathTracerApp } from "./PathTracerApp";
import './styles/styles.css';
import { PlanesApp } from "./PlanesApp";

window.onload = function () {

   let query: string;
   let type = 'default';

   if (window.location.search) {
      query = window.location.search.substr(1);

      let tokens = query.split('-');
      if (tokens.length === 2) {
         type = tokens[0];
         query = tokens[1];
      }
      else {
         type = tokens[0];
         query = '';
      }
   }

   if (type === 'planes') {
      let app = new PlanesApp(query);
      document.body.appendChild(app.component());
   }
   else {
      let app = new PathTracerApp(query);
      document.body.appendChild(app.component());
   }
}

