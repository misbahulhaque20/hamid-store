import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ColorThemeProvider } from "./contexts/ColorThemeContext.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ColorThemeProvider>
      <App />
    </ColorThemeProvider>
  </StrictMode>
)
