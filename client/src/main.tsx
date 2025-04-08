import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add custom style variables for the GOV.BR look
const styleElement = document.createElement("style");
styleElement.textContent = `
  :root {
    --gov-blue-dark: #071D41;
    --gov-blue: #1351B4;
    --gov-blue-light: #2670E8;
    --gov-yellow: #FFCD07;
    --gov-gray-dark: #555555;
    --gov-gray: #DFDFDF;
    --gov-gray-light: #F8F8F8;
    
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 213 72% 44%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 213 72% 44%;
    --radius: 0.375rem;
  }

  body {
    font-family: 'Open Sans', Arial, sans-serif;
  }
`;
document.head.appendChild(styleElement);

createRoot(document.getElementById("root")!).render(<App />);
