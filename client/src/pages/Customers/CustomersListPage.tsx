import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCustomers, deleteCustomer } from '../../api/customers';
import { Customer, PaginatedResult } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate, getApiError } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function CustomersListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<PaginatedResult<Customer> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCustomers = useCallback(
    async (currentPage: number, currentSearch: string, currentStatus: string, currentType: string) => {
      setIsLoading(true);
      setError('');
      try {
        const data = await getCustomers({
          page: currentPage,
          limit: 20,
          search: currentSearch,
          status: currentStatus,
          customer_type: currentType,
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

  const debouncedFetch = useDebounce(fetchCustomers, 300);

  useEffect(() => {
    debouncedFetch(page, search, statusFilter, typeFilter);
  }, [page, search, statusFilter, typeFilter, debouncedFetch]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCustomer(deleteTarget.id);
      setDeleteTarget(null);
      fetchCustomers(page, search, statusFilter, typeFilter);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = user?.role === 'admin';

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Customers</h2>
          <p className="page-subtitle">
            {result ? `${result.total} customers total` : 'Loading...'}
          </p>
        </div>
        <Link to="/customers/new" className="btn btn-primary" id="add-customer-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Customer
        </Link>
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
              placeholder="Search by name, mobile, or email..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              id="customer-search"
            />
          </div>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            id="status-filter"
          >
            <option value="">All Status</option>
            <option value="Lead">Lead</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            id="type-filter"
          >
            <option value="">All Types</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Distributor">Distributor</option>
          </select>
        </div>

        {isLoading ? (
          <div className="loading-overlay">
            <div className="loading-spinner" style={{ width: 28, height: 28 }} />
          </div>
        ) : result && result.data.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No customers found</div>
            <div className="empty-state-desc">
              {search || statusFilter || typeFilter
                ? 'Try adjusting your filters.'
                : 'Add your first customer to get started.'}
            </div>
            <Link to="/customers/new" className="btn btn-primary btn-sm">Add Customer</Link>
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Business</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                  <th>Added</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {result?.data.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <Link to={`/customers/${customer.id}`} className="font-medium text-primary">
                        {customer.name}
                      </Link>
                    </td>
                    <td>{customer.mobile}</td>
                    <td>{customer.business_name || <span className="text-muted">-</span>}</td>
                    <td><StatusBadge status={customer.customer_type} /></td>
                    <td><StatusBadge status={customer.status} /></td>
                    <td className="text-muted text-sm">{formatDate(customer.follow_up_date)}</td>
                    <td className="text-muted text-sm">{formatDate(customer.created_at)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => navigate(`/customers/${customer.id}/edit`)}
                          title="Edit customer"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        {canDelete && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setDeleteTarget(customer)}
                            title="Delete customer"
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {result && (
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                total={result.total}
                limit={result.limit}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Customer"
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
