import { useCallback, useEffect, useState } from "react";
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
import useActionFeedback from "../../hooks/useActionFeedback";
import { rules } from "../../lib/validation";
import { formatCurrency, formatDate } from "../../lib/format";
import { getProductImage } from "../../lib/visuals";

const EMPTY_FORM = {
    name: "",
    description: "",
    price: "",
    category_id: "",
    image: ""
};

/**
 * Mirrors `content.product` on the server.
 *
 * Price accepts zero deliberately: a "free" or "enquire" listing is a real
 * choice, and the server permits it. What is rejected is a blank or
 * non-numeric price, which would otherwise reach a DECIMAL column as NaN.
 */
const SCHEMA = {
    name: [
        rules.required("Product name"),
        rules.minLength(2, "Product name must be at least 2 characters"),
        rules.maxLength(200, "Product name must be 200 characters or fewer")
    ],
    description: [
        rules.maxLength(5000, "Description must be 5000 characters or fewer")
    ],
    price: [
        rules.required("Price"),
        rules.number({ label: "Price", min: 0, max: 10000000 })
    ],
    category_id: [rules.number({ label: "Category", integer: true, min: 1 })],
    image: [rules.maxLength(500, "Image reference is too long")]
};

function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const {
        values: form,
        fieldErrors,
        formError,
        announcement,
        pending: submitting,
        setValue,
        handleChange,
        handleBlur,
        validateAll,
        reset,
        run
    } = useActionFeedback({ schema: SCHEMA, initialValues: EMPTY_FORM });

    // Deleting is a separate action with its own button, so it gets its own
    // pending state rather than one shared flag that would grey out the form
    // while a row was being removed.
    const { run: runDelete } = useActionFeedback();

    const load = useCallback(() => {
        setLoading(true);
        fetchMyProducts()
            .then((data) => setProducts(data.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const closeForm = () => {
        reset(EMPTY_FORM);
        setEditId(null);
        setShowForm(false);
    };

    const toggleForm = () => {
        if (showForm) {
            closeForm();

            return;
        }

        // Opening a blank form must not inherit the last edited product.
        reset(EMPTY_FORM);
        setEditId(null);
        setShowForm(true);
    };

    const handleEdit = (product) => {
        reset({
            name: product.name,
            description: product.description || "",
            price: String(product.price),
            category_id: product.category_id
                ? String(product.category_id)
                : "",
            image: product.image || ""
        });
        setEditId(product.id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateAll(form)) {
            return;
        }

        const payload = {
            name: form.name.trim(),
            description: form.description.trim() || null,
            price: Number(form.price),
            category_id: form.category_id
                ? Number(form.category_id)
                : null,
            image: form.image.trim() || null
        };

        const { ok } = await run(
            () =>
                editId
                    ? updateProduct(editId, payload)
                    : createProduct(payload),
            {
                success: editId
                    ? "Product updated."
                    : "Product created.",
                retry: true
            }
        );

        if (ok) {
            closeForm();
            load();
        }
    };

    // The toast is the right home for a delete failure: it happened in the
// table, not in the form, so a banner above the form would be misleading.
    const handleDelete = async (id) => {
        setDeleting(id);

        const { ok } = await runDelete(() => deleteProduct(id), {
            success: "Product deleted.",
            retry: true
        });

        if (ok) {
            load();
        }

        setDeleting(null);
    };

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Products</h1>
                    <p className="mt-1 text-sm text-slate-500">Manage products you advertise on the marketplace.</p>
                </div>
                <Button onClick={toggleForm}>
                    {showForm ? "Close" : "+ New product"}
                </Button>
            </div>

            {showForm && (
                <Card className="mb-6 max-w-2xl p-6">
                    <h2 className="font-semibold text-slate-900">{editId ? "Edit product" : "New product"}</h2>
                    {formError && <div role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
                    <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
                        <Input
                            label="Product name"
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            maxLength={200}
                            error={fieldErrors.name}
                            required
                        />

                        <Textarea
                            label="Description"
                            id="description"
                            name="description"
                            rows="3"
                            value={form.description}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            maxLength={5000}
                            error={fieldErrors.description}
                        />

                        <Input
                            label="Price (M)"
                            id="price"
                            name="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.price}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={fieldErrors.price}
                            hint="Enter 0 if customers should enquire about the price."
                            required
                        />

                        <FileUpload
                            label="Product photo"
                            name="image"
                            kind="image"
                            value={form.image}
                            onChange={(url) => setValue("image", url)}
                            error={fieldErrors.image}
                        />

                        <div className="flex gap-3">
                            <Button type="submit" loading={submitting}>{editId ? "Update" : "Create"}</Button>
                            <Button variant="secondary" type="button" onClick={closeForm}>Cancel</Button>
                        </div>

                        <p aria-live="polite" className="sr-only">
                            {announcement}
                        </p>
                    </form>
                </Card>
            )}

            {loading ? (
                <div className="flex justify-center py-20"><Spinner /></div>
            ) : products.length === 0 ? (
                <EmptyState title="No products yet" description="Create your first product to advertise it on the marketplace." />
            ) : (
                <>
                    <Card className="hidden overflow-hidden md:block">
                        <div className="qf-scroll-x overflow-x-auto">
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

                    <div className="space-y-3 md:hidden">
                        {products.map((product) => (
                            <Card key={product.id} className="overflow-hidden">
                                <div className="flex items-start gap-3 p-4">
                                    <SmartImage
                                        src={getProductImage(product, product.id)}
                                        alt={product.name}
                                        seed={product.name}
                                        icon="inbox"
                                        className="h-16 w-16 shrink-0 rounded-xl object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-semibold leading-snug text-slate-900">
                                                {product.name}
                                            </h3>
                                            <span className="shrink-0 font-bold text-slate-900">
                                                {formatCurrency(product.price)}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 truncate text-sm text-slate-500">
                                            {product.category_name || "Uncategorised"}
                                        </p>
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <Badge color={product.status === "ACTIVE" ? "green" : "gray"}>
                                                {product.status.toLowerCase()}
                                            </Badge>
                                            <span className="text-xs text-slate-400">
                                                Added {formatDate(product.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 border-t border-slate-100 p-3">
                                    <Button
                                        size="md"
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => handleEdit(product)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        size="md"
                                        variant="danger"
                                        className="flex-1"
                                        loading={deleting === product.id}
                                        onClick={() => handleDelete(product.id)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default Products;