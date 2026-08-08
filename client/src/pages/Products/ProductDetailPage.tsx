import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById, getStockMovements, adjustStock } from '../../api/products';
import { Product, StockMovement } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDateTime, getApiError } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ quantity: '', movement_type: 'IN' as 'IN' | 'OUT', reason: '' });
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  const canManageStock = user?.role === 'admin' || user?.role === 'warehouse';

  useEffect(() => {
    if (!id) return;
    Promise.all([getProductById(id), getStockMovements(id)])
      .then(([productData, movementsData]) => {
        setProduct(productData);
        setMovements(movementsData);
      })
      .catch(() => setError('Failed to load product'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleAdjustStock = async () => {
    const qty = parseInt(adjustForm.quantity, 10);
    if (!qty || qty <= 0) { setAdjustError('Enter a valid quantity'); return; }
    if (!adjustForm.reason.trim()) { setAdjustError('Reason is required'); return; }
    setIsAdjusting(true);
    setAdjustError('');
    try {
      const updatedProduct = await adjustStock(id!, { quantity: qty, movement_type: adjustForm.movement_type, reason: adjustForm.reason });
      setProduct(updatedProduct);
      const updatedMovements = await getStockMovements(id!);
      setMovements(updatedMovements);
      setShowAdjust(false);
      setAdjustForm({ quantity: '', movement_type: 'IN', reason: '' });
    } catch (err) {
      setAdjustError(getApiError(err));
    } finally {
      setIsAdjusting(false);
    }
  };

  if (isLoading) return <div className="loading-overlay"><div className="loading-spinner" style={{ width: 32, height: 32 }} /></div>;
  if (error || !product) return <div className="alert alert-danger">{error || 'Product not found'}</div>;

  const isLow = product.current_stock <= product.min_stock_alert;

  return (
    <div>
      <Link to="/products" className="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Products
      </Link>

      <div className="page-header">
        <div>
          <h2 className="page-title">{product.name}</h2>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <span className="badge badge-gray">{product.sku}</span>
            {product.category && <span className="badge badge-blue">{product.category}</span>}
            {isLow && <span className="badge badge-red">Low Stock</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canManageStock && (
            <button className="btn btn-secondary" onClick={() => setShowAdjust(!showAdjust)}>
              Adjust Stock
            </button>
          )}
          {canManageStock && (
            <button className="btn btn-secondary" onClick={() => navigate(`/products/${id}/edit`)}>
              Edit Product
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Product Information</span></div>
            <div className="card-body">
              <div className="detail-grid">
                <div className="detail-field">
                  <div className="detail-label">Unit Price</div>
                  <div className="detail-value" style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>{formatCurrency(product.unit_price)}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-label">Location</div>
                  <div className="detail-value">{product.location || '-'}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-label">Minimum Stock Alert</div>
                  <div className="detail-value">{product.min_stock_alert} units</div>
                </div>
                <div className="detail-field">
                  <div className="detail-label">Category</div>
                  <div className="detail-value">{product.category || '-'}</div>
                </div>
              </div>
            </div>
          </div>

          {showAdjust && canManageStock && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><span className="card-title">Stock Adjustment</span></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {adjustError && <div className="alert alert-danger">{adjustError}</div>}
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label required">Movement Type</label>
                    <select className="form-control" value={adjustForm.movement_type} onChange={(e) => setAdjustForm({ ...adjustForm, movement_type: e.target.value as 'IN' | 'OUT' })}>
                      <option value="IN">IN (Add Stock)</option>
                      <option value="OUT">OUT (Remove Stock)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Quantity</label>
                    <input type="number" className="form-control" min={1} placeholder="Enter quantity" value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label required">Reason</label>
                  <input type="text" className="form-control" placeholder="e.g. Purchase order received, damage etc." value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={handleAdjustStock} disabled={isAdjusting}>
                    {isAdjusting ? <span className="loading-spinner" style={{ width: 16, height: 16 }} /> : 'Apply Adjustment'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowAdjust(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <span className="card-title">Stock Movement Log</span>
              <span className="badge badge-gray">{movements.length} entries</span>
            </div>
            {movements.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <div className="empty-state-title">No stock movements recorded</div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Reason</th>
                    <th>By</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td><StatusBadge status={m.movement_type} /></td>
                      <td className="font-medium">
                        <span style={{ color: m.movement_type === 'IN' ? 'var(--success-600)' : 'var(--danger-600)' }}>
                          {m.movement_type === 'IN' ? '+' : '-'}{m.quantity}
                        </span>
                      </td>
                      <td className="text-sm">{m.reason}</td>
                      <td className="text-muted text-sm">{m.created_by_name}</td>
                      <td className="text-muted text-sm">{formatDateTime(m.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header"><span className="card-title">Current Stock</span></div>
            <div className="card-body" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{
                fontSize: '4rem', fontWeight: 800,
                color: isLow ? 'var(--danger-600)' : 'var(--success-600)',
                lineHeight: 1,
              }}>
                {product.current_stock}
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-400)', marginTop: 8 }}>units in stock</div>
              {isLow && (
                <div className="alert alert-danger" style={{ marginTop: 20, textAlign: 'left' }}>
                  Stock is below minimum alert level of {product.min_stock_alert} units.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
