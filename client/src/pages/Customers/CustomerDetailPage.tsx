import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCustomerById, getFollowups, addFollowup } from '../../api/customers';
import { Customer, CustomerFollowup } from '../../types';
import { formatDate, formatDateTime, getApiError } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [followups, setFollowups] = useState<CustomerFollowup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteError, setNoteError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([getCustomerById(id), getFollowups(id)])
      .then(([customerData, followupsData]) => {
        setCustomer(customerData);
        setFollowups(followupsData);
      })
      .catch(() => setError('Failed to load customer'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      setNoteError('Note cannot be empty');
      return;
    }
    setIsAddingNote(true);
    setNoteError('');
    try {
      const followup = await addFollowup(id!, newNote.trim());
      setFollowups([followup, ...followups]);
      setNewNote('');
    } catch (err) {
      setNoteError(getApiError(err));
    } finally {
      setIsAddingNote(false);
    }
  };

  if (isLoading) {
    return <div className="loading-overlay"><div className="loading-spinner" style={{ width: 32, height: 32 }} /></div>;
  }

  if (error || !customer) {
    return <div className="alert alert-danger">{error || 'Customer not found'}</div>;
  }

  return (
    <div>
      <Link to="/customers" className="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Customers
      </Link>

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 18,
          }}>
            {customer.name[0].toUpperCase()}
          </div>
          <div>
            <h2 className="page-title">{customer.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <StatusBadge status={customer.status} />
              <StatusBadge status={customer.customer_type} />
            </div>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(`/customers/${id}/edit`)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit Customer
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Customer Information</span>
            </div>
            <div className="card-body">
              <div className="detail-grid">
                <div className="detail-field">
                  <div className="detail-label">Mobile</div>
                  <div className="detail-value">{customer.mobile}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-label">Email</div>
                  <div className="detail-value">{customer.email || '-'}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-label">Business Name</div>
                  <div className="detail-value">{customer.business_name || '-'}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-label">GST Number</div>
                  <div className="detail-value">{customer.gst_number || '-'}</div>
                </div>
                <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
                  <div className="detail-label">Address</div>
                  <div className="detail-value">{customer.address || '-'}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-label">Follow-up Date</div>
                  <div className="detail-value">{formatDate(customer.follow_up_date)}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-label">Created On</div>
                  <div className="detail-value">{formatDate(customer.created_at)}</div>
                </div>
                {customer.notes && (
                  <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
                    <div className="detail-label">Notes</div>
                    <div className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{customer.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Follow-up History</span>
              <span className="badge badge-gray">{followups.length}</span>
            </div>
            <div className="card-body" style={{ padding: '16px' }}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <textarea
                  className={`form-control ${noteError ? 'error' : ''}`}
                  placeholder="Add a follow-up note..."
                  value={newNote}
                  onChange={(e) => { setNewNote(e.target.value); setNoteError(''); }}
                  rows={3}
                  id="followup-note-input"
                />
                {noteError && <span className="form-error">{noteError}</span>}
              </div>
              <button
                className="btn btn-primary btn-sm btn-full"
                onClick={handleAddNote}
                disabled={isAddingNote}
                id="add-followup-btn"
              >
                {isAddingNote ? <span className="loading-spinner" style={{ width: 14, height: 14 }} /> : 'Add Note'}
              </button>

              {followups.length > 0 && (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {followups.map((f) => (
                    <div key={f.id} style={{
                      padding: '10px 12px',
                      backgroundColor: 'var(--gray-50)',
                      borderRadius: 'var(--border-radius)',
                      borderLeft: '3px solid var(--primary-400)',
                    }}>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-800)', marginBottom: 6, lineHeight: 1.5 }}>
                        {f.note}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-400)' }}>
                        {f.created_by_name} · {formatDateTime(f.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {followups.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--gray-400)', fontSize: 'var(--font-size-sm)' }}>
                  No follow-ups yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
