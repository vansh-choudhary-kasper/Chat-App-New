import { createBrowserRouter,Navigate  } from "react-router-dom";
import { lazy, Suspense } from "react";
import ChatLayout from "../components/chat/ChatLayout";
import GroupLayout from "../components/group/GroupLayout";
import AdminDashboard from "../components/admin/AdminDashboard";

const Loadable = (Component) => (props) => {
  return (
    <Suspense fallback={<div>loading</div>}>
      <Component {...props} />
    </Suspense>
  );
};

const loader=()=>{
  return(<div>

  </div>)
}

const Login = Loadable(lazy(() => import("../pages/Login")));
const Register = Loadable(lazy(() => import("../pages/Register")));
const ForgotPassword = Loadable(lazy(() => import("../pages/ForgotPassword")));
const Home = Loadable(lazy(() => import("../pages/Home")));
const NotFound = Loadable(lazy(() => import("../pages/NotFoundPage")));


export const routes = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/home", element: <Home />, 
    children: [
      {
        index: true, 
        element: <Navigate to="chat" /> 
      }, {
        path: "chat",
        element: <ChatLayout/>
    },
    {
      path: "group",
      element: <GroupLayout/>
  },
  {
    path: "admin",
    element: <AdminDashboard/>
  },
    { path: "*", element: <NotFound /> },
  ]
   },
   { path: "*", element: <NotFound /> },

]);
