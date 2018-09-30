// @material-ui/icons
import Dashboard from "@material-ui/icons/Dashboard";
import Person from "@material-ui/icons/Person";
// core components/views
import DashboardPage from "views/Dashboard/Dashboard.jsx";
import JobInputPage from "views/JobInput/JobInput.jsx";
import JobOutputPage from "views/JobOutput/JobOutput.jsx";

const dashboardRoutes = [
  {
    path: "/dashboard",
    sidebarName: "Dashboard",
    navbarName: "Dashboard",
    icon: Dashboard,
    component: DashboardPage
  },
  {
    path: "/input",
    sidebarName: "Job Input",
    navbarName: "Job Input",
    icon: Person,
    component: JobInputPage
  },
  {
    path: "/output",
    sidebarName: "Job Output",
    navbarName: "Job Output",
    icon: Person,
    component: JobOutputPage
  },
  { redirect: true, path: "/", to: "/dashboard", navbarName: "Redirect" }
];

export default dashboardRoutes;
