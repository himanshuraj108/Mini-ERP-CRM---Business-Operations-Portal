import { Customer, Product, Challan, StockMovement } from '../types';

type StatusValue =
  | Customer['status']
  | Customer['customer_type']
  | Product['current_stock']
  | Challan['status']
  | StockMovement['movement_type']
  | string;

const STATUS_MAP: Record<string, string> = {
  Active: 'badge-green',
  Confirmed: 'badge-green',
  Lead: 'badge-yellow',
  Draft: 'badge-yellow',
  Inactive: 'badge-gray',
  Cancelled: 'badge-red',
  IN: 'badge-green',
  OUT: 'badge-red',
  Retail: 'badge-blue',
  Wholesale: 'badge-info',
  Distributor: 'badge-gray',
};

interface StatusBadgeProps {
  status: StatusValue;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusStr = String(status);
  const className = STATUS_MAP[statusStr] || 'badge-gray';

  return <span className={`badge ${className}`}>{statusStr}</span>;
}
