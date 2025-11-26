import { motion, AnimatePresence } from "framer-motion";

export default function CategoryBar({
  categories,
  selected,
  onSelect,
  subcategories = [],
  selectedSubcategory,
  onSelectSubcategory,
}) {
  return (
    <div className="bg-[#F6FAFF] border-b border-[#D8E7FF] py-3">
      
      {/* Основные категории */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1 justify-center">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
              ${
                selected === cat
                  ? "bg-[#1b91d4] text-white shadow-sm" 
                  : "bg-white text-[#445A75] border border-[#D8E7FF] hover:bg-[#E8F2FF]"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Подкатегории */}
      <AnimatePresence>
        {subcategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-2 overflow-x-auto no-scrollbar mt-3 px-4 pb-1 justify-center"
          >
            {subcategories.map((sub) => (
              <button
                key={sub}
                onClick={() => onSelectSubcategory(sub)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                  ${
                    selectedSubcategory === sub
                      ? "bg-[#6EA7FF] text-white shadow-sm"
                      : "bg-white text-[#445A75] border border-[#D8E7FF] hover:bg-[#E8F2FF]"
                  }`}
              >
                {sub}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
