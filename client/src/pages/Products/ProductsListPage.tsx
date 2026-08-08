import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts, deleteProduct } from '../../api/products';
import { Product, PaginatedResult } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import { formatCurrency, getApiError } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function ProductsListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<PaginatedResult<Product> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'warehouse';

  const fetchProducts = useCallback(
    async (currentPage: number, currentSearch: string, currentLowStock: boolean) => {
      setIsLoading(true);
      setError('');
      try {
        const data = await getProducts({
          page: currentPage,
          limit: 20,
          search: currentSearch,
          low_stock: currentLowStock,
        });
        setResult(data);
      } catch (err) {
        setError(getApiError(err));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const debouncedFetch = useDebounce(fetchProducts, 300);

  useEffect(() => {
    debouncedFetch(page, search, lowStock);
  }, [page, search, lowStock, debouncedFetch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      fetchProducts(page, search, lowStock);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Products</h2>
          <p className="page-subtitle">
            {result ? `${result.total} products total` : 'Loading...'}
          </p>
        </div>
        {canManage && (
          <Link to="/products/new" className="btn btn-primary" id="add-product-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Product
          </Link>
        )}
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      <div className="card">
        <div className="search-bar" style={{ padding: '16px 16px 0' }}>
          <div className="search-input-wrapper">
            <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              id="product-search"
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={lowStock}
              onChange={(e) => { setLowStock(e.target.checked); setPage(1); }}
              id="low-stock-filter"
            />
            Low stock only
          </label>
        </div>

        {isLoading ? (
          <div className="loading-overlay"><div className="loading-spinner" style={{ width: 28, height: 28 }} /></div>
        ) : result && result.data.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No products found</div>
            <div className="empty-state-desc">
              {search || lowStock ? 'Try adjusting your filters.' : 'Add your first product to get started.'}
            </div>
            {canManage && <Link to="/products/new" className="btn btn-primary btn-sm">Add Product</Link>}
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Stock</th>
                  <th>Min Alert</th>
                  <th>Location</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {result?.data.map((product) => {
                  const isLow = product.current_stock <= product.min_stock_alert;
                  return (
                    <tr key={product.id}>
                      <td>
                        <Link to={`/products/${product.id}`} className="font-medium text-primary">
                          {product.name}
                        </Link>
                      </td>
                      <td className="text-muted text-sm">{product.sku}</td>
                      <td>{product.category || <span className="text-muted">-</span>}</td>
                      <td className="font-medium">{formatCurrency(product.unit_price)}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: isLow ? 'var(--danger-600)' : 'var(--success-600)' }}>
                          {product.current_stock}
                        </span>
                        {isLow && <StatusBadge status="Lead" />}
                      </td>
                      <td className="text-muted">{product.min_stock_alert}</td>
                      <td className="text-muted text-sm">{product.location || '-'}</td>
                      <td>
                        <div className="table-actions">
                          {canManage && (
                            <>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => navigate(`/products/${product.id}/edit`)}
                                title="Edit product"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              {user?.role === 'admin' && (
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => setDeleteTarget(product)}
                                  title="Delete product"
                                  style={{ color: 'var(--danger-600)' }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6l-1 14H6L5 6" />
                                    <path d="M10 11v6M14 11v6" />
                                    <path d="M9 6V4h6v2" />
                                  </svg>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {result && (
              <Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={result.limit} onPageChange={setPage} />
            )}
          </>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Product"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
