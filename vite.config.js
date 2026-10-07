// Tells Vite how to run Moruwa Dash.
import { defineConfig } from "vite";
// Lets Vite understand React files.
import react from "@vitejs/plugin-react";

// Exports the settings object.
export default defineConfig({
  // Turns on the React plugin.
  plugins: [react()],
  // Settings for the local dev server.
  server: {
    // The local address is http://localhost:5178/
    port: 5178,
    // Closes the dev server settings.
  },
  // Closes the Vite settings.
});
