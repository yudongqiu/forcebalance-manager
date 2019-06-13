// @material-ui/icons
import DashboardIcon from "@material-ui/icons/Dashboard";
import InputIcon from "@material-ui/icons/Input";
import ViewListIcon from "@material-ui/icons/ViewList";
import WorkIcon from "@material-ui/icons/Work";
import InsertChartIcon from "@material-ui/icons/InsertChart";

// core components/views
import DashboardPage from "views/Dashboard/Dashboard.jsx";
import JobInputPage from "views/JobInput/JobInput.jsx";
import JobOutputPage from "views/JobOutput/JobOutput.jsx";
import ResultsPage from "views/Results/Results.jsx";
import WorkQueuePage from "views/WorkQueue/WorkQueue.jsx";

const dashboardRoutes = [
  // {
  //   path: "/dashboard",
  //   sidebarName: "Dashboard",
  //   navbarName: "Dashboard",
  //   icon: DashboardIcon,
  //   component: DashboardPage
  // },
  {
    path: "/input",
    sidebarName: "Input",
    navbarName: "Optimization Input",
    icon: InputIcon,
    component: JobInputPage
  },
  {
    path: "/workqueue",
    sidebarName: "Work Queue",
    navbarName: "Work Queue",
    icon: WorkIcon,
    component: WorkQueuePage
  },
  {
    path: "/output",
    sidebarName: "Output",
    navbarName: "Optimization Output",
    icon: ViewListIcon,
    component: JobOutputPage
  },
  {
    path: "/results",
    sidebarName: "Results",
    navbarName: "Optimization Results",
    icon: InsertChartIcon,
    component: ResultsPage
  },
  { redirect: true, path: "/", to: "/input", navbarName: "Redirect" }
];

export default dashboardRoutes;
