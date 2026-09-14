import { useEffect, useState } from "react";
import { fetchCategories, fetchProducts } from "../../services/catalogueService";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Icon from "../../components/ui/Icon";
import SmartImage from "../../components/ui/SmartImage";
import { formatCurrency } from "../../lib/format";
import { getProductImage, getBusinessImage } from "../../lib/visuals";

function Products() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [activeCategoryId, setActiveCategoryId] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");

            try {
                const [categoriesData, productsData] = await Promise.all([
                    fetchCategories(),
                    fetchProducts({
                        categoryId: activeCategoryId || undefined,
                        search: search || undefined
                    })
                ]);

                if (!cancelled) {
                    setCategories(categoriesData.data);
                    setProducts(productsData.data);
                }
            } catch {
                if (!cancelled) {
                    setError(
                        "Unable to load products. Please try again later."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [activeCategoryId, search]);

    const activeCategory = categories.find(
        (category) => category.id === activeCategoryId
    );

    return (
        <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        {activeCategory ? activeCategory.name : "Products"}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Products advertised by stores and cafes. Contact the
                        store directly to enquire and buy.
                    </p>
                </div>
                <div className="w-full max-w-xs">
                    <div className="relative">
                        <Icon
                            name="search"
                            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        />
                        <Input
                            type="search"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Search products"
                            className="pl-9"
                        />
                    </div>
                </div>
            </div>

            {/* Category chips */}
            <div className="mt-5 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setActiveCategoryId(null)}
                    className={[
                        "rounded-full px-4 py-1.5 text-sm font-medium transition",
                        !activeCategoryId
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    ].join(" ")}
                >
                    All
                </button>

                {categories.map((category) => (
                    <button
                        key={category.id}
                        type="button"
                        onClick={() =>
                            setActiveCategoryId(
                                activeCategoryId === category.id
                                    ? null
                                    : category.id
                            )
                        }
                        className={[
                            "rounded-full px-4 py-1.5 text-sm font-medium transition",
                            activeCategoryId === category.id
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        ].join(" ")}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Spinner />
                </div>
            ) : error ? (
                <EmptyState
                    title="Something went wrong"
                    description={error}
                />
            ) : products.length === 0 ? (
                <EmptyState
                    title="No products found"
                    description="Try a different search or category."
                />
            ) : (
                <>
                    <p className="mb-4 mt-6 text-sm text-slate-500">
                        <strong className="text-slate-900">{products.length}</strong>{" "}
                        {products.length === 1 ? "product" : "products"} available
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {products.map((product) => (
                            <Card
                                key={product.id}
                                className="group flex h-full flex-col overflow-hidden p-0 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg"
                            >
                                <div className="relative h-36 overflow-hidden">
                                    <SmartImage
                                        src={getProductImage(product, product.id)}
                                        alt={product.name}
                                        seed={product.name}
                                        icon="inbox"
                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                    />
                                    {product.business_verification_status ===
                                        "APPROVED" && (
                                        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-emerald-600 shadow">
                                            <Icon name="checkBadge" className="h-3.5 w-3.5" />
                                            Verified
                                        </span>
                                    )}
                                    <span className="absolute left-2 top-2 rounded-full bg-slate-950/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                                        {product.category_name || "General"}
                                    </span>
                                </div>

                                <div className="flex flex-1 flex-col p-4">
                                    <h3 className="font-bold text-slate-900">
                                        {product.name}
                                    </h3>

                                    {product.description && (
                                        <p className="mt-1 flex-1 text-sm text-slate-600 line-clamp-2">
                                            {product.description}
                                        </p>
                                    )}

                                    <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                                        <SmartImage
                                            src={getBusinessImage(product)}
                                            alt={`${product.business_name} store`}
                                            seed={`${product.business_name}-store`}
                                            icon="building"
                                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                                                <span className="truncate">
                                                    {product.business_name}
                                                </span>
                                                {product.business_verification_status ===
                                                    "APPROVED" && (
                                                    <Icon
                                                        name="checkBadge"
                                                        className="h-3.5 w-3.5 shrink-0 text-emerald-500"
                                                    />
                                                )}
                                            </p>
                                            {product.business_location && (
                                                <p className="inline-flex items-center gap-0.5 text-xs text-slate-500">
                                                    <Icon
                                                        name="location"
                                                        className="h-3 w-3"
                                                    />
                                                    {product.business_location}
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-lg font-extrabold text-slate-900">
                                            {formatCurrency(product.price)}
                                        </p>
                                    </div>
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