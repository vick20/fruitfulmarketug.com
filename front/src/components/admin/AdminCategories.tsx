"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Layers, Plus, Edit2, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  productsCount: number;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {
      toast.error("Failed to load categories.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, slug: newSlug }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create category");
      }

      toast.success(`Category "${newName}" added.`);
      setIsCreateOpen(false);
      setNewName("");
      setNewSlug("");
      fetchCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(msg);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editName.trim()) return;

    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCategory.id,
          name: editName,
          slug: editSlug,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("Category updated.");
      setEditingCategory(null);
      fetchCategories();
    } catch {
      toast.error("Failed to update category.");
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    try {
      const res = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cat.id }),
      });

      if (!res.ok) throw new Error("Delete failed");

      toast.success(`Category "${cat.name}" removed.`);
      fetchCategories();
    } catch {
      toast.error("Failed to delete category.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-primary">Store Categories</h2>
          <p className="text-xs text-text-muted">Manage product departments and classification</p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-primary-dark cursor-pointer"
        >
          <Plus className="h-4 w-4 text-accent" />
          <span>New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center text-xs text-text-muted">
          <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center text-xs text-text-muted">
          No categories found. Click &quot;New Category&quot; to organize your store.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-xs transition hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-fresh/15 text-primary">
                    <Layers className="h-4 w-4" />
                  </span>
                  <span className="rounded-full bg-background px-2.5 py-0.5 text-[11px] font-bold text-text-muted tabular-nums">
                    {cat.productsCount} products
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold text-primary">{cat.name}</h3>
                <p className="font-mono text-xs text-text-muted">slug: {cat.slug}</p>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(cat);
                    setEditName(cat.name);
                    setEditSlug(cat.slug);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-text hover:bg-background cursor-pointer"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cat)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-primary">New Category</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-full p-1 text-text-muted hover:bg-background cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-text mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (!newSlug) {
                      setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                    }
                  }}
                  placeholder="e.g. Fresh Dairy"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Slug</label>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="e.g. fresh-dairy"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-medium text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-text hover:bg-background cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-primary-dark cursor-pointer"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setEditingCategory(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-primary">Edit Category</h3>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="rounded-full p-1 text-text-muted hover:bg-background cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-text mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-text mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-medium text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-text hover:bg-background cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-primary-dark cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
