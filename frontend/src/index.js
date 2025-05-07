import React from 'react';
import ReactDOM from 'react-dom/client';

import {HelmetProvider} from "react-helmet-async"
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from "react-redux";
import { store } from './redux/store';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./index.css";
import { ContextProvider } from "./context/context";


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>


  <ContextProvider>

    <Provider store={store}>
      
      <ToastContainer position="top-center" 
  autoClose={1000}       
  hideProgressBar={true} 
  newestOnTop={true}    
  closeOnClick={true}   
  rtl={false}          
  pauseOnFocusLoss={false}
  draggable={false}     
  style={{ borderRadius: '30px', }}  />
    <HelmetProvider>
   

    <App />
    
    </HelmetProvider>

    </Provider>
    </ContextProvider>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
