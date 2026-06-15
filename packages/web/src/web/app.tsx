import { Route, Switch } from "wouter";
import Landing from "./pages/Landing";
import Onboard from "./pages/Onboard";
import Dashboard from "./pages/Dashboard";
import Audit from "./pages/Audit";
import Delegation from "./pages/Delegation";
import Verify from "./pages/Verify";
import { Provider } from "./components/provider";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";

function App() {
  return (
    <Provider>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/onboard" component={Onboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/audit" component={Audit} />
        <Route path="/delegation" component={Delegation} />
        <Route path="/verify" component={Verify} />
      </Switch>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
      {/* "Made with Runable" badge */}
      {<RunableBadge />}
    </Provider>
  );
}

export default App;
