import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";
import { store } from "./store";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/components/ui/theme-provider";

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <BrowserRouter>
      <ThemeProvider defaultTheme="light">
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </Provider>
);
