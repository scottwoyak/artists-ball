import { PathTracerApp } from "./PathTracerApp";
import './styles/styles.css';
import { PlanesApp } from "./PlanesApp";
import { ViewerApp } from "./ViewerApp";

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

   let div = document.createElement('div');
   document.body.appendChild(div);

   if (type === 'planes') {
      document.title = 'Value Planes';
      let app = new PlanesApp(query);
      app.create(div);
   }
   else if (type === 'viewer') {
      document.title = 'Virtual Pose Tool';
      let app = new ViewerApp(query);
      app.create(div);
   }
   else { // type === 'ball'
      document.title = 'Artist\'s Ball';
      let app = new PathTracerApp(query);
      app.create(div);
   }
}

