
import { RouterProvider} from "react-router-dom";
import { routes } from "./utils/Routes";
import './assets/fonts/satoshi/fonts.css';


function App() {
  return (
   <div>
    <RouterProvider router={routes}/>
   </div>
  );
}

export default App;
