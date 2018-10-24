// @material-ui/icons
import Dashboard from "@material-ui/icons/Dashboard";
import Person from "@material-ui/icons/Person";
// core components/views
import DashboardPage from "views/Dashboard/Dashboard.jsx";
import JobInputPage from "views/JobInput/JobInput.jsx";
import JobOutputPage from "views/JobOutput/JobOutput.jsx";
import ResultsPage from "views/Results/Results.jsx";

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
    sidebarName: "Input",
    navbarName: "Optimization Input",
    icon: Person,
    component: JobInputPage
  },
  {
    path: "/output",
    sidebarName: "Output",
    navbarName: "Optimization Output",
    icon: Person,
    component: JobOutputPage
  },
  {
    path: "/results",
    sidebarName: "Results",
    navbarName: "Optimization Results",
    icon: Person,
    component: ResultsPage
  },
  { redirect: true, path: "/", to: "/dashboard", navbarName: "Redirect" }
];

export default dashboardRoutes;
