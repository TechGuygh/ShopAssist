export type Role = 'Admin' | 'Salesperson' | 'InventoryManager';

export interface User {
  id: number;
  username: string;
  role: Role;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  unit: string;
  cost_price: number;
  retail_price: number;
  wholesale_price: number;
  stock_quantity: number;
  min_stock_level: number;
  expiry_date?: string;
  barcode?: string;
}

export interface Sale {
  id: number;
  date: string;
  total_amount: number;
  type: 'retail' | 'wholesale' | 'credit';
  customer_name: string;
  salesperson_id: string;
}

export interface Expense {
  id: number;
  category: string;
  amount: number;
  date: string;
  description: string;
}

export interface BankAccount {
  id: number;
  name: string;
  balance: number;
}

export interface Supplier {
  id: number;
  name: string;
  contact_info: string;
  balance: number;
}

export interface SupplierInvoice {
  id: number;
  supplier_id: number;
  invoice_number: string;
  date: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'partial';
}

export interface SupplierPayment {
  id: number;
  supplier_id: number;
  invoice_id: number;
  amount: number;
  date: string;
  payment_method: string;
}

