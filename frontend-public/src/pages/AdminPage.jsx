import { useEffect, useState } from "react";
import Header from "../components/Header";

export default function AdminPage() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // auth
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");

  // ui
  const [tab, setTab] = useState("items");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  // data
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);

  // forms
  const emptyItem = {
    id: null,
    name: "",
    price: "",
    description: "",
    image_url: "",
    category_id: "",
  };
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [itemPreview, setItemPreview] = useState("");

  const [categoryName, setCategoryName] = useState("");
  const [categoryParentId, setCategoryParentId] = useState("");

  // --------------------------------
  useEffect(() => {
    if (authed) refreshAll();
  }, [authed]);

function authHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };
  
  // Добавляем Authorization только если есть пароль
  if (password) {
    headers["Authorization"] = password;
  }
  
  return headers;
}

async function checkAuth() {
  if (!password.trim()) {
    setAuthError("Введите пароль");
    return;
  }

  // Проверяем пароль перед установкой authed
  try {
    const testRes = await fetch(`${API_URL}/api/admin/items`, {
      method: "GET",
      headers: {
        "Authorization": password,
        "Content-Type": "application/json"
      }
    });
    
    if (testRes.status === 401) {
      setAuthError("Неверный пароль");
      return;
    }
    
    setAuthError("");
    setAuthed(true);
    setToast("Вы вошли в режим администратора");
    setTimeout(() => setToast(""), 3000);
    
  } catch (err) {
    setAuthError("Ошибка проверки авторизации");
  }
}

  async function refreshAll() {
    setLoading(true);
    try {
      const [catsRes, itemsRes] = await Promise.all([
        fetch(`${API_URL}/api/categories`),
        fetch(`${API_URL}/api/menu`),
      ]);
      const cats = await catsRes.json();
      const its = await itemsRes.json();
      setCategories(Array.isArray(cats) ? cats : []);
      setItems(Array.isArray(its) ? its : []);
    } catch (err) {
      console.error(err);
      setToast("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  }

  // ---------------- Category Actions ----------------
  async function createCategory(e) {
    e.preventDefault();
    if (!categoryName.trim()) {
      setToast("Название категории обязательно");
      return;
    }
    try {
      const payload = {
        name: categoryName.trim(),
        parent_id: categoryParentId || null,
        admin_password: password,
      };
      const res = await fetch(`${API_URL}/api/admin/categories`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        setToast(err.error || "Ошибка создания категории");
        return;
      }
      setCategoryName("");
      setCategoryParentId("");
      setToast("Категория создана");
      await refreshAll();
    } catch (err) {
      setToast("Ошибка сети при создании");
    }
    setTimeout(() => setToast(""), 2500);
  }

  // ---------------- Category Delete Functions ----------------
async function deleteCategory(categoryId) {
  if (!confirm("Удалить категорию? Это действие нельзя отменить.")) return;
  
  try {
    const res = await fetch(`${API_URL}/api/admin/categories/${categoryId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (!res.ok) {
      const err = await res.json();
      if (err.items_count > 0 || err.subcategories_count > 0) {
        // Предлагаем принудительное удаление
        if (confirm(
          `Категория содержит ${err.items_count || 0} элементов и ${err.subcategories_count || 0} подкатегорий. Удалить принудительно?`
        )) {
          await forceDeleteCategory(categoryId);
          return;
        }
        return;
      }
      setToast(err.error || "Ошибка удаления");
      return;
    }
    
    setToast("Категория удалена");
    await refreshAll();
  } catch (err) {
    setToast("Ошибка сети при удалении");
  }
  setTimeout(() => setToast(""), 2500);
}

async function forceDeleteCategory(categoryId) {
  try {
    const res = await fetch(`${API_URL}/api/admin/categories/${categoryId}/force`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (!res.ok) {
      const err = await res.json();
      setToast(err.error || "Ошибка принудительного удаления");
      return;
    }
    
    setToast("Категория и подкатегории удалены");
    await refreshAll();
  } catch (err) {
    setToast("Ошибка сети при удалении");
  }
  setTimeout(() => setToast(""), 2500);
}

async function deleteSubcategory(parentCategoryId, subcategoryId) {
  if (!confirm("Удалить подкатегорию?")) return;
  
  try {
    const res = await fetch(`${API_URL}/api/admin/categories/${subcategoryId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (!res.ok) {
      const err = await res.json();
      setToast(err.error || "Ошибка удаления подкатегории");
      return;
    }
    
    setToast("Подкатегория удалена");
    await refreshAll();
  } catch (err) {
    setToast("Ошибка сети при удалении");
  }
  setTimeout(() => setToast(""), 2500);
}

  // ---------------- Item Actions ----------------
  function openEditItem(it) {
    const cat = categories
      .flatMap((c) => [c, ...(c.subcategories || [])])
      .find((x) => x.name === it.category);
    setEditingItem(it);
    setItemForm({
      id: it.id,
      name: it.name,
      price: it.price,
      description: it.description,
      image_url: it.image_url,
      category_id: cat?.id || "",
    });
    setItemPreview(it.image_url || "");
  }

  async function submitItem(e) {
    e.preventDefault();
    if (!itemForm.name.trim() || !itemForm.category_id) {
      setToast("Название и категория обязательны");
      return;
    }

    const payload = {
      name: itemForm.name.trim(),
      price: parseFloat(itemForm.price) || 0,
      description: itemForm.description || "",
      image_url: itemForm.image_url || "",
      category_id: itemForm.category_id,
      admin_password: password,
    };

    try {
      const url = editingItem
        ? `${API_URL}/api/admin/items/${editingItem.id}`
        : `${API_URL}/api/admin/items`;
      const method = editingItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        setToast(err.error || "Ошибка сохранения");
        return;
      }
      setToast(editingItem ? "Элемент обновлён" : "Элемент создан");
      setItemForm(emptyItem);
      setEditingItem(null);
      await refreshAll();
    } catch {
      setToast("Ошибка сети при сохранении");
    }
    setTimeout(() => setToast(""), 2500);
  }

  async function deleteItem(id) {
    if (!confirm("Удалить элемент?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/items/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        setToast(err.error || "Ошибка удаления");
        return;
      }
      setToast("Удалено");
      await refreshAll();
    } catch {
      setToast("Ошибка сети при удалении");
    }
    setTimeout(() => setToast(""), 2500);
  }

  function categoryOptionsList() {
    const opts = [];
    categories.forEach((c) => {
      opts.push({ id: c.id, name: c.name });
      (c.subcategories || []).forEach((s) =>
        opts.push({ id: s.id, name: `${c.name} → ${s.name}` })
      );
    });
    return opts;
  }

  // ---------------- Render ----------------
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-5xl mx-auto p-4">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-semibold">Admin Panel</h1>

          {!authed ? (
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-3 py-2 border rounded"
              />
              <button
                onClick={checkAuth}
                className="px-3 py-2 bg-blue-600 text-white rounded"
              >
                Войти
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthed(false);
                setPassword("");
              }}
              className="px-3 py-2 border rounded text-sm"
            >
              Выйти
            </button>
          )}
        </div>

        {authError && <div className="text-red-500 mb-2">{authError}</div>}

        {!authed ? (
          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-700">
              Введите пароль администратора, чтобы редактировать меню.
            </p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {["items", "categories"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    tab === t ? "bg-blue-600 text-white" : "bg-gray-100"
                  }`}
                >
                  {t === "items" ? "Items" : "Categories"}
                </button>
              ))}
              <button
                onClick={refreshAll}
                className="ml-auto px-3 py-2 border rounded text-sm"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {/* ---------------- Items ---------------- */}
            {tab === "items" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <form
                  onSubmit={submitItem}
                  className="bg-white p-4 rounded shadow space-y-3"
                >
                  <h2 className="font-semibold">
                    {editingItem ? "Edit Item" : "New Item"}
                  </h2>

                  <input
                    className="w-full p-2 border rounded"
                    placeholder="Name"
                    value={itemForm.name}
                    onChange={(e) =>
                      setItemForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />

                  <select
                    className="w-full p-2 border rounded"
                    value={itemForm.category_id}
                    onChange={(e) =>
                      setItemForm((f) => ({ ...f, category_id: e.target.value }))
                    }
                  >
                    <option value="">— select category —</option>
                    {categoryOptionsList().map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <input
                    className="w-full p-2 border rounded"
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={itemForm.price}
                    onChange={(e) =>
                      setItemForm((f) => ({ ...f, price: e.target.value }))
                    }
                  />

                  <input
                    className="w-full p-2 border rounded"
                    placeholder="Image URL"
                    value={itemForm.image_url}
                    onChange={(e) => {
                      setItemForm((f) => ({
                        ...f,
                        image_url: e.target.value,
                      }));
                      setItemPreview(e.target.value);
                    }}
                  />

                  {itemPreview && (
                    <img
                      src={itemPreview}
                      alt="preview"
                      className="w-full max-h-48 object-cover rounded"
                      onError={() => setItemPreview("")}
                    />
                  )}

                  <textarea
                    className="w-full p-2 border rounded"
                    placeholder="Description"
                    value={itemForm.description}
                    onChange={(e) =>
                      setItemForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                  />

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded"
                    >
                      {editingItem ? "Update" : "Create"}
                    </button>
                    {editingItem && (
                      <button
                        type="button"
                        onClick={() => deleteItem(editingItem.id)}
                        className="px-4 py-2 border rounded text-red-600"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </form>

                <div className="bg-white p-4 rounded shadow overflow-auto max-h-[65vh]">
                  <h2 className="font-semibold mb-3">
                    Existing Items ({items.length})
                  </h2>
                  {items.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center gap-3 p-2 border rounded mb-2 hover:bg-gray-50"
                    >
                      <img
                        src={it.image_url}
                        alt={it.name}
                        className="w-16 h-16 rounded object-cover bg-gray-100"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{it.name}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {it.category || "—"} • {it.price} ₸
                        </div>
                      </div>
                      <button
                        onClick={() => openEditItem(it)}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="text-sm text-gray-500">
                      No items available
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* ---------------- Categories ---------------- */}
          {tab === "categories" && (
            <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-3">Categories</h2>
            <form
      onSubmit={createCategory}
      className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6"
    >
      <input
        className="p-2 border rounded"
        placeholder="Category name"
        value={categoryName}
        onChange={(e) => setCategoryName(e.target.value)}
      />
      <select
        className="p-2 border rounded"
        value={categoryParentId}
        onChange={(e) => setCategoryParentId(e.target.value)}
      >
        <option value="">— Parent (optional) —</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button className="bg-green-600 text-white px-4 py-2 rounded">
        Add Category
      </button>
    </form>

    <div className="space-y-4">
      {categories.map((c) => (
        <div key={c.id} className="p-4 border rounded bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium text-lg">{c.name}</div>
            <button
              onClick={() => deleteCategory(c.id)}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Delete
            </button>
          </div>
          
          {/* Подкатегории */}
          {(c.subcategories || []).length > 0 && (
            <div className="ml-4 mt-2">
              <div className="text-sm font-semibold text-gray-600 mb-2">Subcategories:</div>
              <div className="space-y-2">
                {c.subcategories.map((s) => (
                  <div key={s.id} className="flex justify-between items-center p-2 bg-white border rounded">
                    <span className="text-sm">{s.name}</span>
                    <button
                      onClick={() => deleteSubcategory(c.id, s.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          

        </div>
      ))}
      
      {categories.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No categories yet. Create your first category!
        </div>
      )}
    </div>
  </div>
    )}
  </>
)}

{toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded shadow">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
