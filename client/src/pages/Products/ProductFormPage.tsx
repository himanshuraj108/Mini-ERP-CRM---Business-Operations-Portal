import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { getProductById, createProduct, updateProduct } from '../../api/products';
import { getApiError } from '../../utils/format';

interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  unit_price: string;
  current_stock: string;
  min_stock_alert: string;
  location: string;
}

function validateProductForm(data: ProductFormData): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!data.name || data.name.length < 2) errs.name = 'Name must be at least 2 characters';
  if (!data.sku || data.sku.length < 2) errs.sku = 'SKU must be at least 2 characters';
  if (!data.unit_price || Number(data.unit_price) <= 0) errs.unit_price = 'Unit price must be greater than 0';
  if (data.current_stock === '' || Number(data.current_stock) < 0) errs.current_stock = 'Stock cannot be negative';
  if (data.min_stock_alert === '' || Number(data.min_stock_alert) < 0) errs.min_stock_alert = 'Min alert cannot be negative';
  return errs;
}

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [isLoadingData, setIsLoadingData] = useState(isEditing);
  const [apiError, setApiError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { register, handleSubmit, reset } = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      sku: '',
      category: '',
      unit_price: '',
      current_stock: '0',
      min_stock_alert: '10',
      location: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditing || !id) return;
    getProductById(id)
      .then((product) => {
        reset({
          name: product.name,
          sku: product.sku,
          category: product.category || '',
          unit_price: String(product.unit_price),
          current_stock: String(product.current_stock),
          min_stock_alert: String(product.min_stock_alert),
          location: product.location || '',
        });
      })
      .catch(() => setApiError('Failed to load product data'))
      .finally(() => setIsLoadingData(false));
  }, [id, isEditing, reset]);

  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    const errs = validateProductForm(data);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setFormErrors({});
    setApiError('');
    setIsSubmitting(true);

    const payload = {
      name: data.name,
      sku: data.sku,
      category: data.category || undefined,
      unit_price: Number(data.unit_price),
      current_stock: Number(data.current_stock),
      min_stock_alert: Number(data.min_stock_alert),
      location: data.location || undefined,
    };

    try {
      if (isEditing && id) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }
      navigate('/products');
    } catch (err) {
      setApiError(getApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) return <div className="loading-overlay"><div className="loading-spinner" style={{ width: 32, height: 32 }} /></div>;

  return (
    <div style={{ maxWidth: 720 }}>
      <Link to="/products" className="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Products
      </Link>

      <h2 className="page-title" style={{ margin: '12px 0 24px' }}>
        {isEditing ? 'Edit Product' : 'Add New Product'}
      </h2>

      {apiError && <div className="alert alert-danger mb-4">{apiError}</div>}

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div className="form-section-title">Product Details</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required" htmlFor="name">Product Name</label>
                  <input id="name" className={`form-control ${formErrors.name ? 'error' : ''}`} placeholder="Product name" {...register('name')} />
                  {formErrors.name && <span className="form-error">{formErrors.name}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label required" htmlFor="sku">SKU / Code</label>
                  <input id="sku" className={`form-control ${formErrors.sku ? 'error' : ''}`} placeholder="e.g. EL-WM-001" {...register('sku')} />
                  {formErrors.sku && <span className="form-error">{formErrors.sku}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="category">Category</label>
                  <input id="category" className="form-control" placeholder="e.g. Electronics, Furniture" {...register('category')} />
                </div>
                <div className="form-group">
                  <label className="form-label required" htmlFor="unit_price">Unit Price (INR)</label>
                  <input id="unit_price" type="number" step="0.01" className={`form-control ${formErrors.unit_price ? 'error' : ''}`} placeholder="0.00" {...register('unit_price')} />
                  {formErrors.unit_price && <span className="form-error">{formErrors.unit_price}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="location">Location / Warehouse</label>
                  <input id="location" className="form-control" placeholder="e.g. Warehouse A, Rack 3" {...register('location')} />
                </div>
              </div>
            </div>

            <div>
              <div className="form-section-title">Stock Settings</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required" htmlFor="current_stock">
                    {isEditing ? 'Current Stock (use stock adjustment to change)' : 'Initial Stock'}
                  </label>
                  <input
                    id="current_stock"
                    type="number"
                    className={`form-control ${formErrors.current_stock ? 'error' : ''}`}
                    placeholder="0"
                    readOnly={isEditing}
                    style={isEditing ? { backgroundColor: 'var(--gray-50)', cursor: 'not-allowed' } : {}}
                    {...register('current_stock')}
                  />
                  {formErrors.current_stock && <span className="form-error">{formErrors.current_stock}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label required" htmlFor="min_stock_alert">Minimum Stock Alert</label>
                  <input id="min_stock_alert" type="number" className={`form-control ${formErrors.min_stock_alert ? 'error' : ''}`} placeholder="10" {...register('min_stock_alert')} />
                  {formErrors.min_stock_alert && <span className="form-error">{formErrors.min_stock_alert}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--gray-200)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/products')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} id="submit-product-btn">
              {isSubmitting
                ? <span className="loading-spinner" style={{ width: 16, height: 16 }} />
                : isEditing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
