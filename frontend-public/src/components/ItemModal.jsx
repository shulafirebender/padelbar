import { useEffect, useState } from "react";

export default function ItemModal({ item, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (item) {
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
    }
  }, [item]);

  if (!item) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-t-3xl w-full max-w-xl px-6 py-7 
        transform transition-all duration-300 shadow-xl
        ${visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Image */}
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full max-h-72 object-cover rounded-2xl mb-5"
          />
        )}

        {/* Description */}
        {item.description && (
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            {item.description}
          </p>
        )}

        {/* Price */}
        <div className="text-blue-600 font-bold text-2xl">
          {item.price ? `${item.price} ₸` : ""}
        </div>
      </div>
    </div>
  );
}
