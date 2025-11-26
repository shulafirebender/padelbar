import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MenuPage from "./pages/MenuPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  const [menuData, setMenuData] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetch(`${API_URL}/api/menu`)
      .then((res) => res.json())
      .then((data) => setMenuData(data))
      .catch((err) => console.error("Fetch error:", err));
  }, [API_URL]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuPage menuData={menuData} />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
