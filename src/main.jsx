// React is the library that builds the page.
import React from "react";
// ReactDOM puts that page into the browser.
import ReactDOM from "react-dom/client";
// App is the whole Korope screen.
import App from "./App";
// These rules set the colors, the buttons, and the phone layout.
import "./styles.css";

// Finds the empty box from index.html.
const rootElement = document.getElementById("root");
// Prepares that box for React.
const root = ReactDOM.createRoot(rootElement);

// Draws the game into the box.
root.render(
  // Warns about unsafe mistakes while developing.
  <React.StrictMode>
    {/* The game itself. */}
    <App />
  {/* Closes the safety wrapper. */}
  </React.StrictMode>
// Closes this call.
);
