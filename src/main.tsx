import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupBuildVersionWatcher } from "@/lib/build-version";

setupBuildVersionWatcher();

createRoot(document.getElementById("root")!).render(<App />);
