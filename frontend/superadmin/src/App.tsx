import { Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import ComingSoon from "./pages/ComingSoon";

// Master website (trade.growwezy.com). Only the Landing Page exists so far;
// every other path (client application form, about, contact, ...) shows a placeholder.
const App = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="*" element={<ComingSoon />} />
  </Routes>
);

export default App;
