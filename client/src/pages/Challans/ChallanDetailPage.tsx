import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getChallanById, confirmChallan, cancelChallan } from '../../api/challans';
import { Challan } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDateTime, getApiError } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function ChallanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<'confirm' | 'cancel' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canAct = user?.role === 'admin' || user?.role === 'sales';

  useEffect(() => {
    if (!id) return;
    getChallanById(id)
      .then(setChallan)
      .catch(() => setError('Failed to load challan'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleConfirm = async () => {
    setIsProcessing(true);
    setActionError('');
    try {
      const updated = await confirmChallan(id!);
      setChallan((prev) => prev ? { ...prev, status: updated.status } : null);
      setConfirmDialog(null);
    } catch (err) {
      setActionError(getApiError(err));
      setConfirmDialog(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    setActionError('');
    try {
      const updated = await cancelChallan(id!);
      setChallan((prev) => prev ? { ...prev, status: updated.status } : null);
      setConfirmDialog(null);
    } catch (err) {
      setActionError(getApiError(err));
      setConfirmDialog(null);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <div className="loading-overlay"><div className="loading-spinner" style={{ width: 32, height: 32 }} /></div>;
  if (error || !challan) return <div className="alert alert-danger">{error || 'Challan not found'}</div>;

  const customerSnap = challan.customer_snapshot as { name: string; mobile: string; address: string; business_name: string };
  const totalValue = (challan.items || []).reduce((sum, item) => sum + item.quantity * Number(item.unit_price), 0);

  return (
    <div>
      <Link to="/challans" className="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Challans
      </Link>

      <div className="page-header">
        <div>
          <h2 className="page-title">{challan.challan_number}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <StatusBadge status={challan.status} />
            <span className="text-muted text-sm">{formatDateTime(challan.created_at)}</span>
            <span className="text-muted text-sm">by {challan.created_by_name}</span>
          </div>
        </div>
        {canAct && challan.status === 'Draft' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-danger"
              onClick={() => setConfirmDialog('cancel')}
              disabled={isProcessing}
            >
              Cancel Challan
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setConfirmDialog('confirm')}
              disabled={isProcessing}
            >
              {isProcessing ? <span className="loading-spinner" style={{ width: 16, height: 16 }} /> : 'Confirm Challan'}
            </button>
          </div>
        )}
        {canAct && challan.status === 'Confirmed' && (
          <button className="btn btn-secondary" onClick={() => setConfirmDialog('cancel')} disabled={isProcessing}>
            Cancel Challan
          </button>
        )}
      </div>

      {actionError && <div className="alert alert-danger mb-4">{actionError}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Line Items</span></div>
            {!challan.items || challan.items.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <div className="empty-state-title">No items</div>
              </div>
            ) : (
              <>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Unit Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {challan.items.map((item) => {
                      const snap = item.product_snapshot as { name: string; sku: string; unit_price: number };
                      return (
                        <tr key={item.id}>
                          <td className="font-medium">{snap.name}</td>
                          <td className="text-muted text-sm">{snap.sku}</td>
                          <td>{formatCurrency(item.unit_price)}</td>
                          <td className="font-medium">{item.quantity}</td>
                          <td className="font-medium">{formatCurrency(item.quantity * Number(item.unit_price))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'flex-end', gap: 40 }}>
                  <div>
                    <span className="text-muted text-sm">Total Quantity: </span>
                    <span className="font-semibold">{challan.total_quantity} units</span>
                  </div>
                  <div>
                    <span className="text-muted text-sm">Total Value: </span>
                    <span className="font-semibold" style={{ fontSize: 'var(--font-size-lg)' }}>{formatCurrency(totalValue)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header"><span className="card-title">Customer</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="detail-field">
                <div className="detail-label">Name</div>
                <div className="detail-value">{customerSnap.name}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Business</div>
                <div className="detail-value">{customerSnap.business_name || '-'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Mobile</div>
                <div className="detail-value">{customerSnap.mobile}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Address</div>
                <div className="detail-value">{customerSnap.address || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirmDialog === 'confirm' && (
        <ConfirmDialog
          title="Confirm Challan"
          message="This will deduct stock for all items in this challan. Stock cannot go below zero. Are you sure?"
          confirmLabel="Yes, Confirm"
          variant="primary"
          isLoading={isProcessing}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {confirmDialog === 'cancel' && (
        <ConfirmDialog
          title="Cancel Challan"
          message={challan.status === 'Confirmed'
            ? 'Cancelling this confirmed challan will restore the stock for all items. Are you sure?'
            : 'Are you sure you want to cancel this draft challan?'}
          confirmLabel="Yes, Cancel Challan"
          variant="danger"
          isLoading={isProcessing}
          onConfirm={handleCancel}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
