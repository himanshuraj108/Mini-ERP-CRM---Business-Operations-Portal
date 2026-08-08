import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCustomers } from '../../api/customers';
import { getProducts } from '../../api/products';
import { createChallan } from '../../api/challans';
import { Customer, Product } from '../../types';
import { formatCurrency, getApiError } from '../../utils/format';

interface ChallanLine {
  product_id: string;
  product: Product;
  quantity: number;
}

export default function ChallanCreatePage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [lines, setLines] = useState<ChallanLine[]>([]);
  const [saveDraft, setSaveDraft] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    Promise.all([
      getCustomers({ limit: 100 }),
      getProducts({ limit: 200 }),
    ])
      .then(([custResult, prodResult]) => {
        setCustomers(custResult.data);
        setProducts(prodResult.data);
      })
      .catch(() => setApiError('Failed to load data'))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      !lines.find((l) => l.product_id === p.id) &&
      (p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const addProduct = (product: Product) => {
    setLines([...lines, { product_id: product.id, product, quantity: 1 }]);
    setProductSearch('');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setLines(lines.map((l) => (l.product_id === productId ? { ...l, quantity } : l)));
  };

  const removeLine = (productId: string) => {
    setLines(lines.filter((l) => l.product_id !== productId));
  };

  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);
  const totalValue = lines.reduce((sum, l) => sum + l.quantity * Number(l.product.unit_price), 0);

  const handleSubmit = async () => {
    setApiError('');
    if (!selectedCustomerId) { setApiError('Please select a customer'); return; }
    if (lines.length === 0) { setApiError('Please add at least one product'); return; }
    const invalidLine = lines.find((l) => !l.quantity || l.quantity < 1);
    if (invalidLine) { setApiError(`Invalid quantity for "${invalidLine.product.name}"`); return; }

    setIsSubmitting(true);
    try {
      const challan = await createChallan({
        customer_id: selectedCustomerId,
        items: lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
        status: saveDraft ? 'Draft' : 'Confirmed',
      });
      navigate(`/challans/${challan.id}`);
    } catch (err) {
      setApiError(getApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="loading-overlay"><div className="loading-spinner" style={{ width: 32, height: 32 }} /></div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <Link to="/challans" className="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Challans
      </Link>

      <h2 className="page-title" style={{ margin: '12px 0 24px' }}>Create New Challan</h2>

      {apiError && <div className="alert alert-danger mb-4">{apiError}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Select Customer</span></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label required" htmlFor="customer-select">Customer</label>
                <select
                  id="customer-select"
                  className="form-control"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">-- Select a customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.business_name ? `(${c.business_name})` : ''} - {c.mobile}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Add Products</span>
              <span className="badge badge-gray">{lines.length} items</span>
            </div>
            <div className="card-body">
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" htmlFor="product-search-input">Search and add products</label>
                <input
                  id="product-search-input"
                  type="text"
                  className="form-control"
                  placeholder="Type product name or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              {productSearch && filteredProducts.length > 0 && (
                <div style={{
                  border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--border-radius)',
                  marginBottom: 16,
                  maxHeight: 200,
                  overflowY: 'auto',
                }}>
                  {filteredProducts.slice(0, 8).map((product) => (
                    <div
                      key={product.id}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--gray-100)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background-color 150ms',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray-50)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      onClick={() => addProduct(product)}
                    >
                      <div>
                        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--gray-800)' }}>{product.name}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-400)' }}>{product.sku} · Stock: {product.current_stock}</div>
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--gray-700)' }}>
                        {formatCurrency(product.unit_price)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {lines.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray-400)', fontSize: 'var(--font-size-sm)' }}>
                  Search for products above to add them to this challan
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Stock</th>
                      <th>Unit Price</th>
                      <th style={{ width: 120 }}>Quantity</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr key={line.product_id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{line.product.name}</div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-400)' }}>{line.product.sku}</div>
                        </td>
                        <td>
                          <span style={{ color: line.product.current_stock < line.quantity ? 'var(--danger-600)' : 'var(--success-600)', fontWeight: 600 }}>
                            {line.product.current_stock}
                          </span>
                        </td>
                        <td>{formatCurrency(line.product.unit_price)}</td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            style={{ padding: '6px 8px', textAlign: 'center' }}
                            min={1}
                            max={line.product.current_stock}
                            value={line.quantity}
                            onChange={(e) => updateQuantity(line.product_id, parseInt(e.target.value, 10) || 1)}
                          />
                        </td>
                        <td className="font-medium">{formatCurrency(line.quantity * Number(line.product.unit_price))}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => removeLine(line.product_id)} style={{ color: 'var(--danger-600)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ position: 'sticky', top: 80 }}>
            <div className="card-header"><span className="card-title">Challan Summary</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                <span className="text-muted">Total Items</span>
                <span className="font-semibold">{lines.length} products</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                <span className="text-muted">Total Quantity</span>
                <span className="font-semibold">{totalQuantity} units</span>
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted font-medium">Total Value</span>
                <span style={{ fontWeight: 700, fontSize: 'var(--font-size-xl)' }}>{formatCurrency(totalValue)}</span>
              </div>

              <div className="divider" />

              <div className="form-group">
                <label className="form-label">Save as</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 'var(--font-size-sm)' }}>
                    <input type="radio" name="status" checked={saveDraft} onChange={() => setSaveDraft(true)} />
                    <div>
                      <div className="font-medium">Draft</div>
                      <div className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>Save without deducting stock</div>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 'var(--font-size-sm)' }}>
                    <input type="radio" name="status" checked={!saveDraft} onChange={() => setSaveDraft(false)} />
                    <div>
                      <div className="font-medium">Confirmed</div>
                      <div className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>Deduct stock immediately</div>
                    </div>
                  </label>
                </div>
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={handleSubmit}
                disabled={isSubmitting || lines.length === 0 || !selectedCustomerId}
                id="create-challan-submit"
              >
                {isSubmitting
                  ? <span className="loading-spinner" style={{ width: 16, height: 16 }} />
                  : saveDraft ? 'Save as Draft' : 'Confirm Challan'}
              </button>
              <button className="btn btn-secondary btn-full" onClick={() => navigate('/challans')} disabled={isSubmitting}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
