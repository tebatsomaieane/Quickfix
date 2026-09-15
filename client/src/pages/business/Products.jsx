import { useEffect, useState } from "react";
import {
    fetchMyProducts,
    createProduct,
    updateProduct,
    deleteProduct
} from "../../services/businessService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import SmartImage from "../../components/ui/SmartImage";
import FileUpload from "../../components/ui/FileUpload";
import { formatCurrency, formatDate } from "../../lib/format";
import { getProductImage } from "../../lib/visuals";

function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ name: "", description: "", price: "", category_id: "", image: "" });
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const load = () => {
        setLoading(true);
        fetchMyProducts()
            .then((data) => setProducts(data.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const resetForm = () => {
        setForm({ name: "", description: "", price: "", category_id: "", image: "" });
        setEditId(null);
        setShowForm(false);
        setFormError("");
    };

    const handleEdit = (product) => {
        setForm({
            name: product.name,
            description: product.description || "",
            price: String(product.price),
            category_id: product.category_id ? String(product.category_id) : "",
            image: product.image || ""
        });
        setEditId(product.id);
        setShowForm(true);
        setFormError("");
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        if (!form.name.trim()) { setFormError("Product name is required."); return; }
        if (!form.price || Number(form.price) < 0) { setFormError("A valid price is required."); return; }

        setSubmitting(true);
        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim() || null,
                price: Number(form.price),
                category_id: form.category_id ? Number(form.category_id) : null,
                image: form.image.trim() || null
            };

            if (editId) {
                await updateProduct(editId, payload);
            } else {
                await createProduct(payload);
            }
            resetForm();
            load();
        } catch (err) {
            setFormError(err.response?.data?.message || "Action failed.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        setDeleting(id);
        try {
            await deleteProduct(id);
            load();
        } catch {} finally {
            setDeleting(null);
        }
    };

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Products</h1>
                    <p className="mt-1 text-sm text-slate-500">Manage products you advertise on the marketplace.</p>
                </div>
                <Button onClick={() => { resetForm(); setShowForm((v) => !v); }}>
                    {showForm ? "Close" : "+ New product"}
                </Button>
            </div>

            {showForm && (
                <Card className="mb-6 max-w-2xl p-6">
                    <h2 className="font-semibold text-slate-900">{editId ? "Edit product" : "New product"}</h2>
                    {formError && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                        <Input label="Product name" id="name" name="name" value={form.name} onChange={handleChange} required />
                        <div>
                            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
                            <Textarea id="description" name="description" rows="3" value={form.description} onChange={handleChange} />
                        </div>
                        <Input label="Price" id="price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required />
                        <FileUpload
                            label="Product photo"
                            kind="image"
                            value={form.image}
                            onChange={(url) => setForm({ ...form, image: url })}
                        />
                        <div className="flex gap-3">
                            <Button type="submit" loading={submitting}>{editId ? "Update" : "Create"}</Button>
                            <Button variant="secondary" type="button" onClick={resetForm}>Cancel</Button>
                        </div>
                    </form>
                </Card>
            )}

            {loading ? (
                <div className="flex justify-center py-20"><Spinner /></div>
            ) : products.length === 0 ? (
                <EmptyState title="No products yet" description="Create your first product to advertise it on the marketplace." />
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-slate-50 text-xs font-semibold tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Price</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Created</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {products.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <SmartImage
                                                    src={getProductImage(product, product.id)}
                                                    alt={product.name}
                                                    seed={product.name}
                                                    icon="inbox"
                                                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                                                />
                                                <span className="font-medium text-slate-900">
                                                    {product.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">{formatCurrency(product.price)}</td>
                                        <td className="px-4 py-3 text-slate-500">{product.category_name || "—"}</td>
                                        <td className="px-4 py-3">
                                            <Badge color={product.status === "ACTIVE" ? "green" : "gray"}>
                                                {product.status.toLowerCase()}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400">{formatDate(product.created_at)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="secondary" onClick={() => handleEdit(product)}>Edit</Button>
                                                <Button size="sm" variant="danger" loading={deleting === product.id} onClick={() => handleDelete(product.id)}>Delete</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}

export default Products;