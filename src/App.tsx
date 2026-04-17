/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Settings, 
  Plus, 
  Search,
  AlertTriangle,
  DollarSign,
  Briefcase,
  Calendar,
  ChevronRight,
  Menu,
  X,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  History
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { cn, formatCurrency } from './lib/utils';
import { Product, Sale, Expense, BankAccount, Supplier, User, SupplierInvoice, SupplierPayment, Role } from './types';
import toast, { Toaster } from 'react-hot-toast';

// Components
const Card = ({ children, className }: { children: React.ReactNode, className?: string, key?: any }) => (
  <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden", className)}>
    {children}
  </div>
);

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
  <Card className="p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon size={20} className="text-white" />
      </div>
      {trend && (
        <div className={cn("flex items-center text-xs font-medium", trend === 'up' ? 'text-emerald-600' : 'text-rose-600')}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trendValue}
        </div>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </Card>
);

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [stockValue, setStockValue] = useState(0);
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Modals
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isBankAccountModalOpen, setIsBankAccountModalOpen] = useState(false);
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [cart, setCart] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);

  // Added barcode scan handling for POS
  const [scanBarcode, setScanBarcode] = useState('');

  // Forms data
  const [productForm, setProductForm] = useState({ name: '', category: 'Groceries', unit: 'pcs', cost_price: 0, retail_price: 0, wholesale_price: 0, stock_quantity: 0, min_stock_level: 5, expiry_date: '', barcode: '' });
  const [invoiceForm, setInvoiceForm] = useState({ supplier_id: '', invoice_number: '', date: format(new Date(), 'yyyy-MM-dd'), total_amount: 0 });
  const [supplierForm, setSupplierForm] = useState({ name: '', contact_info: '' });
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'Salesperson' });
  const [expenseForm, setExpenseForm] = useState({ category: 'Rent', amount: 0, date: format(new Date(), 'yyyy-MM-dd'), description: '' });
  const [bankAccountForm, setBankAccountForm] = useState({ name: '', balance: 0 });
  const [adjustStockForm, setAdjustStockForm] = useState({ product_id: '', quantity_change: 0, reason: 'adjustment' });
  const [paymentForm, setPaymentForm] = useState({ supplier_id: '', invoice_id: '', amount: 0, date: format(new Date(), 'yyyy-MM-dd'), payment_method: 'Bank Transfer' });
  const [salesTrends, setSalesTrends] = useState<any[]>([]);
  const [reportYear, setReportYear] = useState<string>(new Date().getFullYear().toString());

  // Fetch Data
  useEffect(() => {
    if (currentUser) {
      fetchData();
      fetchSalesTrends(reportYear);
    }
  }, [currentUser, reportYear]);

  const fetchSalesTrends = async (year: string) => {
    try {
      const res = await fetch(`/api/reports/sales-trends?year=${year}`);
      if(res.ok) setSalesTrends(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    try {
      const [pRes, sRes, eRes, bRes, supRes, svRes, plRes, invRes, uRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/sales'),
        fetch('/api/expenses'),
        fetch('/api/bank-accounts'),
        fetch('/api/suppliers'),
        fetch('/api/reports/stock-value'),
        fetch(`/api/reports/profit-loss?startDate=${format(startOfMonth(new Date()), 'yyyy-MM-dd')}&endDate=${format(endOfMonth(new Date()), 'yyyy-MM-dd')}`),
        fetch('/api/supplier-invoices'),
        fetch('/api/users')
      ]);

      if(pRes.ok) setProducts(await pRes.json());
      if(sRes.ok) setSales(await sRes.json());
      if(eRes.ok) setExpenses(await eRes.json());
      if(bRes.ok) setBankAccounts(await bRes.json());
      if(supRes.ok) setSuppliers(await supRes.json());
      if(svRes.ok) setStockValue((await svRes.json()).total_value || 0);
      if(plRes.ok) setProfitLoss(await plRes.json());
      if(invRes.ok) setInvoices(await invRes.json());
      if(uRes.ok) setUsers(await uRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error('Failed to load dashboard data');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        toast.success(`Welcome back, ${data.user.username}!`);
      } else {
        setLoginError(data.message || 'Login failed');
      }
    } catch (e: any) {
      setLoginError("Could not connect to server.");
    }
  };

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 font-sans text-slate-900">
        <Toaster />
        <Card className="w-full max-w-md p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-emerald-500 p-3 rounded-xl mb-4 text-white">
              <TrendingUp size={32} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">ShopAssist</h1>
            <p className="text-slate-500">Log in to manage your retail business.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input 
                type="text" 
                autoCapitalize="none"
                autoComplete="off"
                required
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                value={loginForm.username}
                onChange={e => setLoginForm({...loginForm, username: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
              />
            </div>
            <button type="submit" className="w-full bg-emerald-500 text-white py-2 rounded-lg font-bold hover:bg-emerald-600 transition-colors">
              Login
            </button>
          </form>
          
          <div className="mt-6 text-xs text-slate-500 text-center">
            <p>Demo accounts (password: "12345678"):</p>
            <p>admin | sales1 | inv1</p>
          </div>
        </Card>
      </div>
    );
  }

  const hasPermission = (allowedRoles: Role[]) => {
    return allowedRoles.includes(currentUser.role);
  };

  const today = new Date();
  const thirtyDaysFromNow = addDays(today, 30);
  const expiringProducts = products.filter(p => {
    if (!p.expiry_date) return false;
    const expDate = parseISO(p.expiry_date);
    return isBefore(expDate, thirtyDaysFromNow) && p.stock_quantity > 0;
  });

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const saleData = {
      date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      total_amount: total,
      type: 'retail',
      customer_name: 'Walk-in Customer',
      salesperson_id: currentUser?.username || 'user_1',
      items: cart
    };

    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData)
    });

    if (res.ok) {
      setIsSaleModalOpen(false);
      setCart([]);
      fetchData();
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock_quantity) return; // limit to stock
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      if (product.stock_quantity <= 0) return; // Prevent out of stock addition
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        quantity: 1,
        unit_price: product.retail_price,
        subtotal: product.retail_price
      }]);
    }
  };

  const handleBarcodeScanForPos = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && scanBarcode.trim()) {
      e.preventDefault();
      try {
        const res = await fetch(`/api/products/scan/${scanBarcode.trim()}`);
        if (res.ok) {
          const product = await res.json();
          addToCart(product);
          setScanBarcode(''); // clear after success
        } else {
          alert('Product not found / invalid barcode');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const totalCash = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const lowStockCount = products.filter(p => p.stock_quantity <= p.min_stock_level).length;

  const NAV_ITEMS = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['Admin', 'Salesperson', 'InventoryManager'] },
    { id: 'inventory', icon: Package, label: 'Inventory', roles: ['Admin', 'InventoryManager'] },
    { id: 'sales', icon: ShoppingCart, label: 'Sales & POS', roles: ['Admin', 'Salesperson'] },
    { id: 'suppliers', icon: Users, label: 'Suppliers', roles: ['Admin', 'InventoryManager'] },
    { id: 'expenses', icon: Briefcase, label: 'Expenses', roles: ['Admin'] },
    { id: 'reports', icon: TrendingUp, label: 'Reports', roles: ['Admin'] },
    { id: 'users', icon: Settings, label: 'User Roles', roles: ['Admin'] }
  ];

  const visibleNavItems = NAV_ITEMS.filter(item => hasPermission(item.roles as Role[]));

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Modals */}
      {isPaymentModalOpen && hasPermission(['Admin', 'InventoryManager']) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Record Payment</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch('/api/supplier-payments', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(paymentForm)
                });
                if (res.ok) {
                  setIsPaymentModalOpen(false);
                  fetchData();
                }
              } catch (e) {
                console.error(e);
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                <input type="number" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: Number(e.target.value)})} required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input type="date" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                <select value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit">Credit</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 text-white font-medium hover:bg-emerald-600 rounded-lg transition-colors border border-emerald-600">Save Payment</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {isAdjustStockModalOpen && hasPermission(['Admin', 'InventoryManager']) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Adjust Stock</h2>
              <button onClick={() => setIsAdjustStockModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch(`/api/products/${adjustStockForm.product_id}/adjust`, {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ ...adjustStockForm, date: format(new Date(), 'yyyy-MM-dd HH:mm:ss') })
                });
                if (res.ok) {
                  setIsAdjustStockModalOpen(false);
                  fetchData();
                }
              } catch (e) {
                console.error(e);
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity Change (e.g. -5 or 10)</label>
                <input type="number" value={adjustStockForm.quantity_change} onChange={e => setAdjustStockForm({...adjustStockForm, quantity_change: Number(e.target.value)})} required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                <select value={adjustStockForm.reason} onChange={e => setAdjustStockForm({...adjustStockForm, reason: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="adjustment">General Adjustment</option>
                  <option value="damage">Damage</option>
                  <option value="loss">Loss</option>
                  <option value="count">Count Correction</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAdjustStockModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 text-white font-medium hover:bg-emerald-600 rounded-lg transition-colors border border-emerald-600">Adjust</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {isInvoiceModalOpen && hasPermission(['Admin', 'InventoryManager']) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Add Supplier Invoice</h2>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const payload = {
                supplier_id: fd.get('supplier_id'),
                invoice_number: fd.get('invoice_number'),
                date: fd.get('date'),
                total_amount: Number(fd.get('total_amount')),
              };
              const res = await fetch('/api/supplier-invoices', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
              });
              if (res.ok) {
                setIsInvoiceModalOpen(false);
                fetchData();
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
                <select name="supplier_id" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-white" required>
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} (Bal: {formatCurrency(s.balance)})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Number</label>
                <input type="text" name="invoice_number" required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input type="date" name="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount ($)</label>
                <input type="number" step="0.01" name="total_amount" required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsInvoiceModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 text-white font-medium hover:bg-emerald-600 rounded-lg transition-colors border border-emerald-600">Save Invoice</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {isSupplierModalOpen && hasPermission(['Admin', 'InventoryManager']) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Add Supplier</h2>
              <button onClick={() => setIsSupplierModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch('/api/suppliers', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(supplierForm)
                });
                if (res.ok) {
                  toast.success('Supplier added successfully');
                  setIsSupplierModalOpen(false);
                  setSupplierForm({ name: '', contact_info: '' });
                  fetchData();
                } else {
                  toast.error('Failed to add supplier');
                }
              } catch (e) {
                toast.error('Network error');
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Name</label>
                <input type="text" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Info</label>
                <input type="text" value={supplierForm.contact_info} onChange={e => setSupplierForm({...supplierForm, contact_info: e.target.value})} required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 text-white font-medium hover:bg-emerald-600 rounded-lg transition-colors border border-emerald-600">Save Supplier</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {isUserModalOpen && hasPermission(['Admin']) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">{editingUserId ? 'Edit User' : 'Add User'}</h2>
              <button onClick={() => {
                setIsUserModalOpen(false);
                setEditingUserId(null);
                setUserForm({ username: '', password: '', role: 'Salesperson' });
              }} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const method = editingUserId ? 'PUT' : 'POST';
                const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users';
                
                // Only send password if it's new or being changed, avoiding empty password on PUT
                const bodyData = { ...userForm };
                if (editingUserId && !userForm.password) {
                  delete (bodyData as any).password;
                }

                const res = await fetch(url, {
                  method: method,
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(bodyData)
                });
                if (res.ok) {
                  toast.success(editingUserId ? 'User updated successfully' : 'User added successfully');
                  setIsUserModalOpen(false);
                  setEditingUserId(null);
                  setUserForm({ username: '', password: '', role: 'Salesperson' });
                  fetchData();
                } else {
                  const errInfo = await res.json();
                  toast.error(errInfo.error || 'Failed to save user');
                }
              } catch (e) {
                toast.error('Network error');
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input type="text" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password {editingUserId && <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>}</label>
                <input type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required={!editingUserId} minLength={6} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500">
                  <option value="Salesperson">Salesperson</option>
                  <option value="InventoryManager">InventoryManager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => {
                  setIsUserModalOpen(false);
                  setEditingUserId(null);
                  setUserForm({ username: '', password: '', role: 'Salesperson' });
                }} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 text-white font-medium hover:bg-emerald-600 rounded-lg transition-colors border border-emerald-600">{editingUserId ? 'Save Changes' : 'Save User'}</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {isExpenseModalOpen && hasPermission(['Admin']) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Record Expense</h2>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch('/api/expenses', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(expenseForm)
                });
                if (res.ok) {
                  toast.success('Expense recorded');
                  setIsExpenseModalOpen(false);
                  setExpenseForm({ category: 'Rent', amount: 0, date: format(new Date(), 'yyyy-MM-dd'), description: '' });
                  fetchData();
                } else {
                  toast.error('Failed to record expense');
                }
              } catch (e) {
                toast.error('Network error');
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <input type="text" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input type="date" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
                <input type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: parseFloat(e.target.value)})} required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input type="text" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 text-white font-medium hover:bg-emerald-600 rounded-lg transition-colors border border-emerald-600">Save Expense</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {isBankAccountModalOpen && hasPermission(['Admin']) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Add Bank Account</h2>
              <button onClick={() => setIsBankAccountModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch('/api/bank-accounts', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(bankAccountForm)
                });
                if (res.ok) {
                  toast.success('Bank Account created');
                  setIsBankAccountModalOpen(false);
                  setBankAccountForm({ name: '', balance: 0 });
                  fetchData();
                } else {
                  toast.error('Failed to create account');
                }
              } catch (e) {
                toast.error('Network error');
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label>
                <input type="text" value={bankAccountForm.name} onChange={e => setBankAccountForm({...bankAccountForm, name: e.target.value})} required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Initial Balance ($)</label>
                <input type="number" step="0.01" value={bankAccountForm.balance} onChange={e => setBankAccountForm({...bankAccountForm, balance: parseFloat(e.target.value)})} required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsBankAccountModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 text-white font-medium hover:bg-emerald-600 rounded-lg transition-colors border border-emerald-600">Save Account</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {isProductModalOpen && hasPermission(['Admin', 'InventoryManager']) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Add New Product</h2>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const payload = Object.fromEntries(fd.entries());
              const res = await fetch('/api/products', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
              });
              if (res.ok) {
                setIsProductModalOpen(false);
                fetchData();
              }
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                  <input type="text" name="name" required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input type="text" name="category" required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                  <input type="text" name="unit" required placeholder="e.g. kg, pcs, box" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Barcode (Optional)</label>
                  <input type="text" name="barcode" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 font-mono" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock</label>
                  <input type="number" name="stock_quantity" required defaultValue="0" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min. Stock Level</label>
                  <input type="number" name="min_stock_level" required defaultValue="5" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price ($)</label>
                  <input type="number" step="0.01" name="cost_price" required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Retail Price ($)</label>
                  <input type="number" step="0.01" name="retail_price" required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Wholesale Price ($)</label>
                  <input type="number" step="0.01" name="wholesale_price" required className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date (Optional)</label>
                  <input type="date" name="expiry_date" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 text-white font-medium hover:bg-emerald-600 rounded-lg transition-colors border border-emerald-600">Save Product</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {isSaleModalOpen && hasPermission(['Admin', 'Salesperson']) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">New Sale (POS)</h2>
              <div className="relative ml-4 flex-1 max-w-sm">
                <input 
                  type="text"
                  autoFocus
                  value={scanBarcode}
                  onChange={e => setScanBarcode(e.target.value)}
                  onKeyDown={handleBarcodeScanForPos}
                  placeholder="Scan Barcode & Press Enter..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button onClick={() => setIsSaleModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-hidden flex">
              <div className="w-2/3 p-6 overflow-y-auto border-r border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  {products.map(product => (
                    <button 
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={product.stock_quantity <= 0}
                      className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group disabled:opacity-50 disabled:grayscale"
                    >
                      <p className="font-bold text-slate-800 group-hover:text-emerald-700">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.category} {product.barcode ? `• ${product.barcode}` : ''}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-slate-900">{formatCurrency(product.retail_price)}</span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold", product.stock_quantity > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                          {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-1/3 p-6 bg-slate-50 flex flex-col">
                <h3 className="font-bold text-slate-800 mb-4">Cart</h3>
                <div className="flex-1 overflow-y-auto space-y-3">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.quantity} x {formatCurrency(item.unit_price)}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(cart.reduce((sum, item) => sum + item.subtotal, 0))}</span>
                  </div>
                  <button 
                    onClick={handleAddSale}
                    disabled={cart.length === 0}
                    className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                  >
                    Complete Sale
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-slate-900 text-slate-300 transition-all duration-300 flex flex-col shrink-0",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-lg shrink-0">
            <TrendingUp className="text-white" size={24} />
          </div>
          {isSidebarOpen && <span className="font-bold text-xl text-white tracking-tight">ShopAssist</span>}
        </div>

        <div className="px-4 pb-4">
           {isSidebarOpen ? (
             <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-700 pb-2 mb-2">
               User: {currentUser.username} ({currentUser.role})
             </div>
           ) : (
             <div className="border-b border-slate-700 pb-2 mb-2 text-center text-xs text-slate-500 uppercase font-semibold">
               {currentUser.username.substring(0, 2)}
             </div>
           )}
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors overflow-hidden",
                activeTab === item.id 
                  ? "bg-emerald-500/10 text-emerald-400 font-medium" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon size={20} className="shrink-0" />
              {isSidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Menu size={20} className="shrink-0" />
            {isSidebarOpen && <span>Collapse Sidebar</span>}
          </button>
          <button 
            onClick={() => setCurrentUser(null)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>


      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-bottom border-slate-200 px-8 py-4 sticky top-0 z-10 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800 capitalize">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 w-64"
              />
            </div>
            <button 
              onClick={() => setIsSaleModalOpen(true)}
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              <Plus size={18} /> New Transaction
            </button>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Total Cash Flow" 
                  value={formatCurrency(totalCash)} 
                  icon={DollarSign} 
                  trend="up" 
                  trendValue="12.5%" 
                  color="bg-blue-500"
                />
                <StatCard 
                  title="Stock Value" 
                  value={formatCurrency(stockValue)} 
                  icon={Package} 
                  color="bg-purple-500"
                />
                <StatCard 
                  title="Monthly Revenue" 
                  value={formatCurrency(profitLoss?.revenue || 0)} 
                  icon={TrendingUp} 
                  trend="up" 
                  trendValue="8.2%" 
                  color="bg-emerald-500"
                />
                <StatCard 
                  title="Low Stock Items" 
                  value={lowStockCount} 
                  icon={AlertTriangle} 
                  color="bg-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sales Chart */}
                <Card className="lg:col-span-2 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-slate-800">Sales Overview</h2>
                    <select className="text-sm border-slate-200 rounded-md">
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                    </select>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sales.slice(0, 7).reverse().map(s => ({ name: format(new Date(s.date), 'MMM d'), total: s.total_amount }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Recent Transactions */}
                <Card className="p-6">
                  <h2 className="font-bold text-slate-800 mb-6">Recent Sales</h2>
                  <div className="space-y-4">
                    {sales.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">No recent sales.</p>
                    )}
                    {sales.slice(0, 5).map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-full",
                            sale.type === 'retail' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                          )}>
                            <ShoppingCart size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{sale.customer_name || 'Walk-in Customer'}</p>
                            <p className="text-xs text-slate-500">{format(new Date(sale.date), 'MMM d, h:mm a')}</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(sale.total_amount)}</p>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-6 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-1">
                    View All <ChevronRight size={16} />
                  </button>
                </Card>
              </div>

              {/* Bottom Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Low Stock Alert */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                      <AlertTriangle className="text-amber-500" size={20} /> Low Stock Alerts
                    </h2>
                    <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">{lowStockCount} Items</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-100">
                          <th className="pb-3 font-medium">Product</th>
                          <th className="pb-3 font-medium">Category</th>
                          <th className="pb-3 font-medium">In Stock</th>
                          <th className="pb-3 font-medium">Min Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {products.filter(p => p.stock_quantity <= p.min_stock_level).slice(0, 5).map(product => (
                          <tr key={product.id} className="group">
                            <td className="py-4 font-medium text-slate-800">{product.name}</td>
                            <td className="py-4 text-slate-500">{product.category}</td>
                            <td className="py-4">
                              <span className="text-rose-600 font-bold">{product.stock_quantity}</span> {product.unit}
                            </td>
                            <td className="py-4 text-slate-500">{product.min_stock_level}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Expiry Alerts */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                      <AlertTriangle className="text-rose-500" size={20} /> Expiring Soon
                    </h2>
                    <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-xs font-bold">{expiringProducts.length} Items</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-100">
                          <th className="pb-3 font-medium">Product</th>
                          <th className="pb-3 font-medium">In Stock</th>
                          <th className="pb-3 font-medium">Expiry Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {expiringProducts.length === 0 && (
                          <tr><td colSpan={3} className="py-4 text-center text-slate-500">No products expiring soon.</td></tr>
                        )}
                        {expiringProducts.slice(0, 5).map(product => (
                          <tr key={product.id} className="group">
                            <td className="py-4 font-medium text-slate-800">{product.name}</td>
                            <td className="py-4"><span className="font-bold">{product.stock_quantity}</span> {product.unit}</td>
                            <td className="py-4">
                              <span className="bg-rose-100/50 text-rose-700 px-2 py-1 rounded text-xs font-bold border border-rose-200 shadow-sm flex items-center w-fit gap-1">
                                <AlertTriangle size={12} /> {format(parseISO(product.expiry_date!), 'MMM d, yyyy')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Bank Balances */}
                <Card className="p-6">
                  <h2 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <CreditCard className="text-blue-500" size={20} /> Bank Accounts
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {bankAccounts.map(account => (
                      <div key={account.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{account.name}</p>
                        <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(account.balance)}</p>
                      </div>
                    ))}
                    <button onClick={() => setIsBankAccountModalOpen(true)} className="p-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all flex flex-col items-center justify-center gap-1">
                      <Plus size={20} />
                      <span className="text-xs font-medium">Add Account</span>
                    </button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search / Scan barcode..." 
                      className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 w-80"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <select 
                    className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm"
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {Array.from(new Set(products.map(p => p.category))).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => setIsProductModalOpen(true)} className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2">
                  <Plus size={18} /> Add Product
                </button>
              </div>

              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <th className="px-6 py-4 font-medium">Barcode / ID</th>
                        <th className="px-6 py-4 font-medium">Product Name</th>
                        <th className="px-6 py-4 font-medium">Category</th>
                        <th className="px-6 py-4 font-medium">Stock</th>
                        <th className="px-6 py-4 font-medium">Cost Price</th>
                        <th className="px-6 py-4 font-medium">Retail Price</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products
                        .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.includes(searchQuery) || String(p.id).includes(searchQuery))
                        .filter(p => !categoryFilter || p.category === categoryFilter)
                        .length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                            No products found matching criteria.
                          </td>
                        </tr>
                      )}
                      {products
                        .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.includes(searchQuery) || String(p.id).includes(searchQuery))
                        .filter(p => !categoryFilter || p.category === categoryFilter)
                        .map(product => (
                        <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-600 font-mono text-xs">{product.barcode || `#${product.id}`}</td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">{product.name}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{product.category}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "font-bold",
                              product.stock_quantity <= product.min_stock_level ? "text-rose-600" : "text-slate-900"
                            )}>{product.stock_quantity}</span> {product.unit}
                          </td>
                          <td className="px-6 py-4 text-slate-600">{formatCurrency(product.cost_price)}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(product.retail_price)}</td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => {
                              setAdjustStockForm({ product_id: product.id, quantity_change: 0, reason: 'adjustment' });
                              setIsAdjustStockModalOpen(true);
                            }} className="text-emerald-500 font-medium text-sm hover:underline">Adjust Stock</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'suppliers' && hasPermission(['Admin', 'InventoryManager']) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Supplier Management</h2>
                <button onClick={() => setIsSupplierModalOpen(true)} className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2">
                  <Plus size={18} /> Add Supplier
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suppliers.map(supplier => (
                  <Card key={supplier.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                        <Users size={20} />
                      </div>
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded",
                        supplier.balance > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {supplier.balance > 0 ? 'Outstanding Balance' : 'Clear'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">{supplier.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{supplier.contact_info}</p>
                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400 font-medium uppercase">Balance</p>
                        <p className="text-xl font-bold text-slate-900">{formatCurrency(supplier.balance)}</p>
                      </div>
                      <button onClick={() => setIsInvoiceModalOpen(true)} className="text-emerald-600 font-medium text-sm hover:underline">Add Invoice</button>
                    </div>
                  </Card>
                ))}
              </div>
              
              {/* Added Invoices List */}
              <Card className="mt-8">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Recent Supplier Invoices</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <th className="px-6 py-4 font-medium">Invoice #</th>
                        <th className="px-6 py-4 font-medium">Supplier</th>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Total</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                            No recent invoices.
                          </td>
                        </tr>
                      )}
                      {invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{inv.invoice_number}</td>
                          <td className="px-6 py-4 text-slate-600">{inv.supplier_name}</td>
                          <td className="px-6 py-4 text-slate-600">{format(new Date(inv.date), 'MMM d, yyyy')}</td>
                          <td className="px-6 py-4 font-bold text-rose-600">{formatCurrency(inv.total_amount)}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded",
                              inv.status === 'paid' ? "bg-emerald-100 text-emerald-700" :
                              inv.status === 'partial' ? "bg-amber-100 text-amber-700" :
                              "bg-rose-100 text-rose-700"
                            )}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {inv.status !== 'paid' && (
                              <button onClick={() => {
                                setPaymentForm({ ...paymentForm, supplier_id: inv.supplier_id, invoice_id: inv.id });
                                setIsPaymentModalOpen(true);
                              }} className="text-emerald-600 text-sm font-medium hover:underline">
                                Record Payment
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'expenses' && hasPermission(['Admin']) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Business Expenses</h2>
                <button onClick={() => setIsExpenseModalOpen(true)} className="bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors flex items-center gap-2">
                  <Plus size={18} /> Record Expense
                </button>
              </div>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Category</th>
                        <th className="px-6 py-4 font-medium">Description</th>
                        <th className="px-6 py-4 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {expenses.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                            No expenses recorded.
                          </td>
                        </tr>
                      )}
                      {expenses.map(expense => (
                        <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-600">{format(new Date(expense.date), 'MMM d, yyyy')}</td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold uppercase">{expense.category}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{expense.description}</td>
                          <td className="px-6 py-4 text-right font-bold text-rose-600">{formatCurrency(expense.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'users' && hasPermission(['Admin']) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">User Management</h2>
                <button onClick={() => setIsUserModalOpen(true)} className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2">
                  <Plus size={18} /> Add User
                </button>
              </div>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <th className="px-6 py-4 font-medium">Username</th>
                        <th className="px-6 py-4 font-medium">Role</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                            No users found.
                          </td>
                        </tr>
                      )}
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">{user.username}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "text-xs font-bold px-2 py-1 rounded",
                              user.role === 'Admin' ? "bg-purple-100 text-purple-700" :
                              user.role === 'InventoryManager' ? "bg-blue-100 text-blue-700" :
                              "bg-emerald-100 text-emerald-700"
                            )}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              className="text-slate-400 hover:text-emerald-500 font-medium"
                              onClick={() => {
                                setEditingUserId(user.id);
                                setUserForm({ username: user.username, password: '', role: user.role });
                                setIsUserModalOpen(true);
                              }}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'reports' && hasPermission(['Admin']) && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                    <Calendar size={18} className="text-slate-400" />
                    <input type="date" className="text-sm border-none focus:ring-0 p-0" defaultValue={format(startOfMonth(new Date()), 'yyyy-MM-dd')} />
                    <span className="text-slate-400">to</span>
                    <input type="date" className="text-sm border-none focus:ring-0 p-0" defaultValue={format(endOfMonth(new Date()), 'yyyy-MM-dd')} />
                  </div>
                  <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                    Generate Report
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profit & Loss */}
                <Card className="p-8">
                  <h2 className="text-lg font-bold text-slate-800 mb-8">Profit & Loss Statement</h2>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <span className="text-slate-600">Total Revenue</span>
                      <span className="font-bold text-slate-900">{formatCurrency(profitLoss?.revenue || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <span className="text-slate-600">Cost of Goods Sold (COGS)</span>
                      <span className="font-bold text-rose-600">-{formatCurrency(profitLoss?.cogs || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-4 bg-slate-50 rounded-lg">
                      <span className="font-semibold text-slate-800">Gross Profit</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(profitLoss?.grossProfit || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <span className="text-slate-600">Operating Expenses</span>
                      <span className="font-bold text-rose-600">-{formatCurrency(profitLoss?.expenses || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 px-4 bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-500/20">
                      <span className="font-bold text-lg">Net Profit</span>
                      <span className="font-bold text-2xl">{formatCurrency(profitLoss?.netProfit || 0)}</span>
                    </div>
                  </div>
                </Card>

                {/* Sales Analytics */}
                <Card className="p-8 lg:col-span-2">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-lg font-bold text-slate-800">Monthly Sales Trends</h2>
                    <select 
                      className="text-sm border-slate-200 rounded-lg px-4 py-2 bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                      value={reportYear}
                      onChange={(e) => setReportYear(e.target.value)}
                    >
                      <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                      <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                      <option value={new Date().getFullYear() - 2}>{new Date().getFullYear() - 2}</option>
                    </select>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesTrends}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" name="Total Sales" dataKey="total" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
