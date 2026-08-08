import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createCustomer, getCustomerById, updateCustomer } from '../../api/customers';
import { getApiError } from '../../utils/format';

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().min(10, 'Enter a valid mobile number'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  business_name: z.string().optional(),
  gst_number: z.string().optional(),
  customer_type: z.enum(['Retail', 'Wholesale', 'Distributor']),
  address: z.string().optional(),
  status: z.enum(['Lead', 'Active', 'Inactive']),
  follow_up_date: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function CustomerFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [isLoadingData, setIsLoadingData] = useState(isEditing);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customer_type: 'Retail',
      status: 'Lead',
    },
  });

  useEffect(() => {
    if (!isEditing || !id) return;
    getCustomerById(id)
      .then((customer) => {
        reset({
          name: customer.name,
          mobile: customer.mobile,
          email: customer.email || '',
          business_name: customer.business_name || '',
          gst_number: customer.gst_number || '',
          customer_type: customer.customer_type,
          address: customer.address || '',
          status: customer.status,
          follow_up_date: customer.follow_up_date
            ? customer.follow_up_date.slice(0, 10)
            : '',
          notes: customer.notes || '',
        });
      })
      .catch(() => setApiError('Failed to load customer data'))
      .finally(() => setIsLoadingData(false));
  }, [id, isEditing, reset]);

  const onSubmit = async (data: CustomerFormData) => {
    setApiError('');
    try {
      if (isEditing && id) {
        await updateCustomer(id, data);
      } else {
        await createCustomer(data);
      }
      navigate('/customers');
    } catch (err) {
      setApiError(getApiError(err));
    }
  };

  if (isLoadingData) {
    return <div className="loading-overlay"><div className="loading-spinner" style={{ width: 32, height: 32 }} /></div>;
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <Link to="/customers" className="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Customers
      </Link>

      <h2 className="page-title" style={{ margin: '12px 0 24px' }}>
        {isEditing ? 'Edit Customer' : 'Add New Customer'}
      </h2>

      {apiError && <div className="alert alert-danger mb-4">{apiError}</div>}

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div className="form-section-title">Basic Information</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required" htmlFor="name">Full Name</label>
                  <input id="name" className={`form-control ${errors.name ? 'error' : ''}`} placeholder="Customer full name" {...register('name')} />
                  {errors.name && <span className="form-error">{errors.name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label required" htmlFor="mobile">Mobile Number</label>
                  <input id="mobile" className={`form-control ${errors.mobile ? 'error' : ''}`} placeholder="10-digit mobile number" {...register('mobile')} />
                  {errors.mobile && <span className="form-error">{errors.mobile.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email Address</label>
                  <input id="email" type="email" className={`form-control ${errors.email ? 'error' : ''}`} placeholder="email@example.com" {...register('email')} />
                  {errors.email && <span className="form-error">{errors.email.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="business_name">Business Name</label>
                  <input id="business_name" className="form-control" placeholder="Company or shop name" {...register('business_name')} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="gst_number">GST Number</label>
                  <input id="gst_number" className="form-control" placeholder="Optional" {...register('gst_number')} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="address">Address</label>
                  <input id="address" className="form-control" placeholder="Full address" {...register('address')} />
                </div>
              </div>
            </div>

            <div>
              <div className="form-section-title">CRM Settings</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required" htmlFor="customer_type">Customer Type</label>
                  <select id="customer_type" className={`form-control ${errors.customer_type ? 'error' : ''}`} {...register('customer_type')}>
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label required" htmlFor="status">Status</label>
                  <select id="status" className={`form-control ${errors.status ? 'error' : ''}`} {...register('status')}>
                    <option value="Lead">Lead</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="follow_up_date">Follow-up Date</label>
                  <input id="follow_up_date" type="date" className="form-control" {...register('follow_up_date')} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" htmlFor="notes">Notes</label>
                  <textarea id="notes" className="form-control" rows={3} placeholder="Any additional notes..." {...register('notes')} />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--gray-200)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/customers')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} id="submit-customer-btn">
              {isSubmitting
                ? <span className="loading-spinner" style={{ width: 16, height: 16 }} />
                : isEditing ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
