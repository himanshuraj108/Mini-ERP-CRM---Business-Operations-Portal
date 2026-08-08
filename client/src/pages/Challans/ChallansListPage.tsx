import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getChallans } from '../../api/challans';
import { Challan, PaginatedResult } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate, getApiError } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';

export default function ChallansListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<PaginatedResult<Challan> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const canCreate = user?.role === 'admin' || user?.role === 'sales';

  const fetchChallans = useCallback(
    async (currentPage: number, currentSearch: string, currentStatus: string) => {
      setIsLoading(true);
      setError('');
      try {
        const data = await getChallans({ page: currentPage, limit: 20, search: currentSearch, status: currentStatus });
        setResult(data);
      } catch (err) {
        setError(getApiError(err));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const debouncedFetch = useDebounce(fetchChallans, 300);

  useEffect(() => {
    debouncedFetch(page, search, statusFilter);
  }, [page, search, statusFilter, debouncedFetch]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Sales Challans</h2>
          <p className="page-subtitle">{result ? `${result.total} challans total` : 'Loading...'}</p>
        </div>
        {canCreate && (
          <Link to="/challans/new" className="btn btn-primary" id="create-challan-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Challan
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
              placeholder="Search by challan number..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              id="challan-search"
            />
          </div>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            id="challan-status-filter"
          >
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {isLoading ? (
          <div className="loading-overlay"><div className="loading-spinner" style={{ width: 28, height: 28 }} /></div>
        ) : result && result.data.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No challans found</div>
            <div className="empty-state-desc">{search || statusFilter ? 'Try adjusting your filters.' : 'Create your first sales challan.'}</div>
            {canCreate && <Link to="/challans/new" className="btn btn-primary btn-sm">Create Challan</Link>}
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Challan No.</th>
                  <th>Customer</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {result?.data.map((challan) => (
                  <tr key={challan.id}>
                    <td>
                      <Link to={`/challans/${challan.id}`} className="font-medium text-primary">
                        {challan.challan_number}
                      </Link>
                    </td>
                    <td>{challan.customer_name || (challan.customer_snapshot as { name?: string })?.name || '-'}</td>
                    <td className="font-medium">{challan.total_quantity}</td>
                    <td><StatusBadge status={challan.status} /></td>
                    <td className="text-muted text-sm">{challan.created_by_name}</td>
                    <td className="text-muted text-sm">{formatDate(challan.created_at)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/challans/${challan.id}`)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result && (
              <Pagination page={result.page} totalPages={result.totalPages} total={result.total} limit={result.limit} onPageChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
