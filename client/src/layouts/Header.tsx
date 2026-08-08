import { useLocation } from 'react-router-dom';
import './Header.css';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Overview of your business operations' },
  '/customers': { title: 'Customers', subtitle: 'Manage your customer relationships' },
  '/customers/new': { title: 'Add Customer', subtitle: 'Create a new customer record' },
  '/products': { title: 'Products', subtitle: 'Manage inventory and stock levels' },
  '/products/new': { title: 'Add Product', subtitle: 'Create a new product entry' },
  '/challans': { title: 'Sales Challans', subtitle: 'Manage delivery challans and orders' },
  '/challans/new': { title: 'Create Challan', subtitle: 'Generate a new sales challan' },
};

function getPageMeta(pathname: string): { title: string; subtitle: string } {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.includes('/customers/') && pathname.includes('/edit')) {
    return { title: 'Edit Customer', subtitle: 'Update customer information' };
  }
  if (pathname.includes('/products/') && pathname.includes('/edit')) {
    return { title: 'Edit Product', subtitle: 'Update product information' };
  }
  if (pathname.startsWith('/customers/')) {
    return { title: 'Customer Detail', subtitle: 'View customer profile and history' };
  }
  if (pathname.startsWith('/products/')) {
    return { title: 'Product Detail', subtitle: 'View product and stock information' };
  }
  if (pathname.startsWith('/challans/')) {
    return { title: 'Challan Detail', subtitle: 'View challan and line items' };
  }
  return { title: 'Mini ERP CRM', subtitle: '' };
}

export default function Header() {
  const location = useLocation();
  const { title, subtitle } = getPageMeta(location.pathname);

  return (
    <header className="app-header">
      <div className="header-content">
        <div>
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}
