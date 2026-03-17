import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Route, Switch } from "wouter";
import FeatureDetail from "./pages/FeatureDetail";
import Dashboard from "./pages/Dashboard";
import { DashboardLayout } from "./components/layout/DashboardLayout";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="sdui-theme">
        <DashboardLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/feature/:id" component={FeatureDetail} />
            <Route>
              <div className="flex items-center justify-center min-h-[50vh] text-lg text-muted-foreground">
                404: No such page!
              </div>
            </Route>
          </Switch>
        </DashboardLayout>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
