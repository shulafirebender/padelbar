export default function MenuGrid({ items, onItemClick }) {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-500">
        <p>Меню пока пустое</p>
      </div>
    );
  }

  return (
    <div className="px-30 py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onItemClick(item)}
          className="bg-white rounded-xl shadow-sm hover:shadow-md
            transition-all duration-200 cursor-pointer active:scale-[0.99]
            overflow-hidden border border-gray-100"
        >
          {/* Image */}
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-32 object-cover"
            />
          ) : (
            <div className="w-full h-32 bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
              Нет фото
            </div>
          )}

          {/* Text */}
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-900 truncate">
              {item.name}
            </h2>

            {item.category && (
              <p className="text-gray-500 text-xs mt-0.5 truncate">
                {item.category}
              </p>
            )}

            <p className="text-blue-600 font-bold mt-2 text-base">
              {item.price ? `${item.price} ₸` : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
