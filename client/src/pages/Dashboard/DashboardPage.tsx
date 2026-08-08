import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../../api/dashboard';
import { DashboardStats } from '../../types';
import { formatDate, formatNumber } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';

function StatCard({
  label,
  value,
  sub,
  iconBg,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  iconBg: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ backgroundColor: iconBg }}>
        {icon}
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{formatNumber(Number(value))}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (error || !stats) {
    return <div className="alert alert-danger">{error || 'No data'}</div>;
  }

  return (
    <div>
      <div className="stat-grid">
        <StatCard
          label="Total Customers"
          value={stats.customers.total}
          sub={`${stats.customers.active} active · ${stats.customers.leads} leads`}
          iconBg="#dbeafe"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <StatCard
          label="Total Products"
          value={stats.products.total}
          sub={`${stats.products.low_stock} low on stock`}
          iconBg="#dcfce7"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          }
        />
        <StatCard
          label="Total Challans"
          value={stats.challans.total}
          sub={`${stats.challans.confirmed} confirmed · ${stats.challans.draft} draft`}
          iconBg="#fef3c7"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        />
        <StatCard
          label="Low Stock Alerts"
          value={stats.products.low_stock}
          sub="Products below minimum stock level"
          iconBg="#fee2e2"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Challans</span>
            <Link to="/challans" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {stats.recentChallans.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="empty-state-title">No challans yet</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Challan No.</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentChallans.map((challan) => (
                  <tr key={challan.id}>
                    <td>
                      <Link to={`/challans/${challan.id}`} className="text-primary font-medium">
                        {challan.challan_number}
                      </Link>
                    </td>
                    <td>{challan.customer_name || (challan.customer_snapshot as { name?: string })?.name || '-'}</td>
                    <td><StatusBadge status={challan.status} /></td>
                    <td className="text-muted">{formatDate(challan.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Low Stock Alerts</span>
            <Link to="/products?low_stock=true" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {stats.lowStockProducts.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="empty-state-title">All products have sufficient stock</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Min</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <Link to={`/products/${product.id}`} className="text-primary font-medium">
                        {product.name}
                      </Link>
                    </td>
                    <td className="text-muted text-sm">{product.sku}</td>
                    <td>
                      <span style={{ color: 'var(--danger-600)', fontWeight: 600 }}>
                        {product.current_stock}
                      </span>
                    </td>
                    <td className="text-muted">{product.min_stock_alert}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
