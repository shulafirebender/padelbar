import { useEffect, useState } from "react";
import Header from "../components/Header";
import CategoryBar from "../components/CategoryBar";
import MenuGrid from "../components/MenuGrid";
import ItemModal from "../components/ItemModal";

export default function MenuPage() {
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, categoriesRes] = await Promise.all([
          fetch(`${API_URL}/api/menu`),
          fetch(`${API_URL}/api/categories`)
        ]);
        
        const menuData = await menuRes.json();
        const categoriesData = await categoriesRes.json();
        
        setMenu(menuData);
        setCategories(categoriesData);

      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    
    fetchData();
  }, [API_URL]);

  // Получаем названия основных категорий для CategoryBar
  const mainCategoryNames = ["Все", ...categories.map(cat => cat.name)];

  // Получаем подкатегории для выбранной категории
  const activeSubcategories = selectedCategory === "Все" 
    ? [] 
    : categories.find(cat => cat.name === selectedCategory)?.subcategories || [];

  // Получаем названия подкатегорий для CategoryBar
  const activeSubcategoryNames = activeSubcategories.map(sub => sub.name);

const filteredItems = menu.filter((item) => {
  if (selectedCategory === "Все") return true;

  // Если выбрана подкатегория - сравниваем с category_name
  if (selectedSubcategory) {
    return item.category_name === selectedSubcategory;
  }

  // Если выбрана основная категория
  const selectedCategoryObj = categories.find(cat => cat.name === selectedCategory);
  if (!selectedCategoryObj) return false;

  // Товары напрямую в этой категории
  if (item.category_id === selectedCategoryObj.id) return true;

  // Товары в подкатегориях этой категории
  const subcategoryIds = selectedCategoryObj.subcategories?.map(sub => sub.id) || [];
  return subcategoryIds.includes(item.category_id);
});

  // Debug фильтрации
  useEffect(() => {
    console.log("Filter debug:", {
      selectedCategory,
      selectedSubcategory,
      menuCount: menu.length,
      filteredCount: filteredItems.length,
      activeSubcategories: activeSubcategoryNames
    });
  }, [selectedCategory, selectedSubcategory, menu, filteredItems, activeSubcategoryNames]);

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Header />

      {/* Основные категории */}
      <CategoryBar
        categories={mainCategoryNames}
        selected={selectedCategory}
        onSelect={(categoryName) => {
          setSelectedCategory(categoryName);
          setSelectedSubcategory(null);
        }}
        subcategories={activeSubcategoryNames}
        selectedSubcategory={selectedSubcategory}
        onSelectSubcategory={(subcategoryName) => {
          setSelectedSubcategory(subcategoryName);
        }}
      />

      <MenuGrid items={filteredItems} onItemClick={setSelectedItem} />

      {selectedItem && (
        <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}