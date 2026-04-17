import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("shopassist.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    unit TEXT,
    cost_price REAL DEFAULT 0,
    retail_price REAL DEFAULT 0,
    wholesale_price REAL DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    expiry_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_info TEXT,
    balance REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS supplier_invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER,
    invoice_number TEXT,
    date TEXT,
    total_amount REAL,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  );

  CREATE TABLE IF NOT EXISTS supplier_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER,
    invoice_id INTEGER,
    amount REAL,
    date TEXT,
    payment_method TEXT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (invoice_id) REFERENCES supplier_invoices(id)
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    total_amount REAL,
    type TEXT, -- 'retail', 'wholesale', 'credit'
    customer_name TEXT,
    salesperson_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    unit_price REAL,
    cost_price REAL,
    subtotal REAL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    amount REAL,
    date TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS bank_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    balance REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS stock_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    change_type TEXT, -- 'sale', 'purchase', 'damage', 'expiry', 'adjustment'
    quantity INTEGER,
    date TEXT,
    old_price REAL,
    new_price REAL,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

try {
  db.exec("ALTER TABLE products ADD COLUMN barcode TEXT;");
} catch (e) {
  // column already exists
}

const defaultPasswordHash = bcrypt.hashSync("12345678", 10);

db.exec(`
  -- Seed Data
  INSERT OR IGNORE INTO bank_accounts (id, name, balance) VALUES (1, 'Main Cash Account', 5000.00);
  INSERT OR IGNORE INTO bank_accounts (id, name, balance) VALUES (2, 'Business Savings', 12500.00);

  INSERT OR IGNORE INTO products (id, name, category, unit, cost_price, retail_price, wholesale_price, stock_quantity, min_stock_level, expiry_date, barcode) 
  VALUES (1, 'Premium Coffee Beans', 'Groceries', 'kg', 12.50, 25.00, 20.00, 45, 10, null, '123456789012');
  INSERT OR IGNORE INTO products (id, name, category, unit, cost_price, retail_price, wholesale_price, stock_quantity, min_stock_level, expiry_date, barcode) 
  VALUES (2, 'Organic Green Tea', 'Groceries', 'box', 5.00, 12.00, 10.00, 8, 10, '2026-12-01', '987654321098');
  INSERT OR IGNORE INTO products (id, name, category, unit, cost_price, retail_price, wholesale_price, stock_quantity, min_stock_level, expiry_date, barcode) 
  VALUES (3, 'Wireless Mouse', 'Electronics', 'pcs', 15.00, 35.00, 30.00, 2, 5, null, '456789123456');

  INSERT OR IGNORE INTO users (id, username, password, role) VALUES (1, 'admin', '${defaultPasswordHash}', 'Admin');
  INSERT OR IGNORE INTO users (id, username, password, role) VALUES (2, 'sales1', '${defaultPasswordHash}', 'Salesperson');
  INSERT OR IGNORE INTO users (id, username, password, role) VALUES (3, 'inv1', '${defaultPasswordHash}', 'InventoryManager');

  INSERT OR IGNORE INTO suppliers (id, name, contact_info, balance) VALUES (1, 'Acme Corp', 'contact@acme.inc', 1500.00);
  INSERT OR IGNORE INTO supplier_invoices (id, supplier_id, invoice_number, date, total_amount, status) VALUES (1, 1, 'INV-2026-01', date('now', '-2 days'), 1500.00, 'pending');

  INSERT OR IGNORE INTO sales (id, date, total_amount, type, customer_name, salesperson_id)
  VALUES (1, date('now', '-1 day'), 75.00, 'retail', 'John Doe', 'user_1');
  INSERT OR IGNORE INTO sales (id, date, total_amount, type, customer_name, salesperson_id)
  VALUES (2, date('now'), 120.00, 'retail', 'Jane Smith', 'user_1');

  INSERT OR IGNORE INTO sale_items (sale_id, product_id, quantity, unit_price, cost_price, subtotal)
  VALUES (1, 1, 3, 25.00, 12.50, 75.00);
  INSERT OR IGNORE INTO sale_items (sale_id, product_id, quantity, unit_price, cost_price, subtotal)
  VALUES (2, 3, 2, 35.00, 15.00, 70.00);
  INSERT OR IGNORE INTO sale_items (sale_id, product_id, quantity, unit_price, cost_price, subtotal)
  VALUES (2, 2, 4, 12.50, 5.00, 50.00);

  INSERT OR IGNORE INTO expenses (id, category, amount, date, description)
  VALUES (1, 'Salary', 1200.00, date('now', 'start of month'), 'Staff salaries for March');
  INSERT OR IGNORE INTO expenses (id, category, amount, date, description)
  VALUES (2, 'Rent', 800.00, date('now', 'start of month'), 'Monthly shop rent');
  INSERT OR IGNORE INTO expenses (id, category, amount, date, description)
  VALUES (3, 'Utilities', 150.00, date('now', '-5 days'), 'Electricity and water bill');
`);

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // --- API Routes ---

  // Auth & Users
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    try {
      const user: any = db.prepare("SELECT id, username, password, role FROM users WHERE username = ?").get(username);
      if (user && bcrypt.compareSync(password, user.password)) {
        res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
      } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get("/api/users", (req, res) => {
    try {
      const users = db.prepare("SELECT id, username, role FROM users").all();
      res.json(users);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/users", (req, res) => {
    const { username, password, role } = req.body;
    try {
      const hash = bcrypt.hashSync(password, 10);
      const info = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(username, hash, role);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/users/:id", (req, res) => {
    const { username, role, password } = req.body;
    try {
      if (password) {
        const hash = bcrypt.hashSync(password, 10);
        db.prepare("UPDATE users SET username=?, role=?, password=? WHERE id=?").run(username, role, hash, req.params.id);
      } else {
        db.prepare("UPDATE users SET username=?, role=? WHERE id=?").run(username, role, req.params.id);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Products
  app.get("/api/products", (req, res) => {
    try {
      const products = db.prepare("SELECT * FROM products").all();
      res.json(products);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/products/scan/:barcode", (req, res) => {
    try {
      const product = db.prepare("SELECT * FROM products WHERE barcode = ?").get(req.params.barcode);
      if (product) {
        res.json(product);
      } else {
        res.status(404).json({ error: "Product not found" });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/products", (req, res) => {
    const { name, category, unit, cost_price, retail_price, wholesale_price, stock_quantity, min_stock_level, expiry_date, barcode } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO products (name, category, unit, cost_price, retail_price, wholesale_price, stock_quantity, min_stock_level, expiry_date, barcode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, category, unit, cost_price, retail_price, wholesale_price, stock_quantity, min_stock_level, expiry_date, barcode);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/products/:id/adjust", (req, res) => {
    const { quantity_change, reason, date } = req.body;
    try {
      const transaction = db.transaction(() => {
        db.prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?").run(quantity_change, req.params.id);
        const info = db.prepare(`
          INSERT INTO stock_history (product_id, change_type, quantity, date)
          VALUES (?, ?, ?, ?)
        `).run(req.params.id, reason, quantity_change, date);
        return info.lastInsertRowid;
      });
      res.json({ success: true, id: transaction() });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/products/:id", (req, res) => {
    const { name, category, unit, cost_price, retail_price, wholesale_price, stock_quantity, min_stock_level, expiry_date, barcode } = req.body;
    try {
      db.prepare(`
        UPDATE products SET name=?, category=?, unit=?, cost_price=?, retail_price=?, wholesale_price=?, stock_quantity=?, min_stock_level=?, expiry_date=?, barcode=?
        WHERE id=?
      `).run(name, category, unit, cost_price, retail_price, wholesale_price, stock_quantity, min_stock_level, expiry_date, barcode, req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Sales
  app.post("/api/sales", (req, res) => {
    const { date, total_amount, type, customer_name, salesperson_id, items } = req.body;
    try {
      const transaction = db.transaction(() => {
        const saleInfo = db.prepare(`
          INSERT INTO sales (date, total_amount, type, customer_name, salesperson_id)
          VALUES (?, ?, ?, ?, ?)
        `).run(date, total_amount, type, customer_name, salesperson_id);
        
        const saleId = saleInfo.lastInsertRowid;

        for (const item of items) {
          const product: any = db.prepare("SELECT cost_price, stock_quantity FROM products WHERE id = ?").get(item.product_id);
          db.prepare(`
            INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, cost_price, subtotal)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(saleId, item.product_id, item.quantity, item.unit_price, product.cost_price, item.subtotal);

          // Update stock
          db.prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?").run(item.quantity, item.product_id);
          
          // Log stock history
          db.prepare(`
            INSERT INTO stock_history (product_id, change_type, quantity, date)
            VALUES (?, 'sale', ?, ?)
          `).run(item.product_id, -item.quantity, date);
        }
        return saleId;
      });

      const saleId = transaction();
      res.json({ id: saleId });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/sales", (req, res) => {
    try {
      const sales = db.prepare("SELECT * FROM sales ORDER BY date DESC").all();
      res.json(sales);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Suppliers
  app.get("/api/suppliers", (req, res) => {
    try {
      const suppliers = db.prepare("SELECT * FROM suppliers").all();
      res.json(suppliers);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/suppliers", (req, res) => {
    const { name, contact_info } = req.body;
    try {
      const info = db.prepare("INSERT INTO suppliers (name, contact_info) VALUES (?, ?)").run(name, contact_info);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Supplier Invoices
  app.get("/api/supplier-invoices", (req, res) => {
    try {
      const invoices = db.prepare(`
        SELECT si.*, s.name as supplier_name 
        FROM supplier_invoices si
        JOIN suppliers s ON si.supplier_id = s.id
        ORDER BY date DESC
      `).all();
      res.json(invoices);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/supplier-invoices", (req, res) => {
    const { supplier_id, invoice_number, date, total_amount } = req.body;
    try {
      const transaction = db.transaction(() => {
        const info = db.prepare(`
          INSERT INTO supplier_invoices (supplier_id, invoice_number, date, total_amount, status)
          VALUES (?, ?, ?, ?, 'pending')
        `).run(supplier_id, invoice_number, date, total_amount);
        
        // Update supplier balance
        db.prepare("UPDATE suppliers SET balance = balance + ? WHERE id = ?").run(total_amount, supplier_id);
        
        return info.lastInsertRowid;
      });
      const id = transaction();
      res.json({ id });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Supplier Payments
  app.get("/api/supplier-payments", (req, res) => {
    try {
      const payments = db.prepare(`
        SELECT sp.*, si.invoice_number, s.name as supplier_name
        FROM supplier_payments sp
        JOIN supplier_invoices si ON sp.invoice_id = si.id
        JOIN suppliers s ON sp.supplier_id = s.id
        ORDER BY date DESC
      `).all();
      res.json(payments);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/supplier-payments", (req, res) => {
    const { supplier_id, invoice_id, amount, date, payment_method } = req.body;
    try {
      const transaction = db.transaction(() => {
        const info = db.prepare(`
          INSERT INTO supplier_payments (supplier_id, invoice_id, amount, date, payment_method)
          VALUES (?, ?, ?, ?, ?)
        `).run(supplier_id, invoice_id, amount, date, payment_method);
        
        // Update supplier balance
        db.prepare("UPDATE suppliers SET balance = balance - ? WHERE id = ?").run(amount, supplier_id);
        
        // Check invoice status
        const invoice: any = db.prepare("SELECT total_amount FROM supplier_invoices WHERE id = ?").get(invoice_id);
        const totalPaid: any = db.prepare("SELECT SUM(amount) as paid FROM supplier_payments WHERE invoice_id = ?").get(invoice_id);
        
        let newStatus = 'partial';
        if (totalPaid.paid >= invoice.total_amount) {
          newStatus = 'paid';
        }
        db.prepare("UPDATE supplier_invoices SET status = ? WHERE id = ?").run(newStatus, invoice_id);
        
        return info.lastInsertRowid;
      });
      
      const id = transaction();
      res.json({ id });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Expenses
  app.get("/api/expenses", (req, res) => {
    try {
      const expenses = db.prepare("SELECT * FROM expenses ORDER BY date DESC").all();
      res.json(expenses);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/expenses", (req, res) => {
    const { category, amount, date, description } = req.body;
    try {
      const info = db.prepare("INSERT INTO expenses (category, amount, date, description) VALUES (?, ?, ?, ?)").run(category, amount, date, description);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Bank Accounts
  app.get("/api/bank-accounts", (req, res) => {
    try {
      const accounts = db.prepare("SELECT * FROM bank_accounts").all();
      res.json(accounts);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/bank-accounts", (req, res) => {
    const { name, balance } = req.body;
    try {
      const info = db.prepare("INSERT INTO bank_accounts (name, balance) VALUES (?, ?)").run(name, balance);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Reports
  app.get("/api/reports/profit-loss", (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const sales: any = db.prepare(`
        SELECT SUM(si.subtotal) as revenue, SUM(si.quantity * si.cost_price) as cogs
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE s.date BETWEEN ? AND ?
      `).get(startDate, endDate);

      const expenses: any = db.prepare(`
        SELECT SUM(amount) as total_expenses
        FROM expenses
        WHERE date BETWEEN ? AND ?
      `).get(startDate, endDate);

      res.json({
        revenue: sales.revenue || 0,
        cogs: sales.cogs || 0,
        expenses: expenses.total_expenses || 0,
        grossProfit: (sales.revenue || 0) - (sales.cogs || 0),
        netProfit: (sales.revenue || 0) - (sales.cogs || 0) - (expenses.total_expenses || 0)
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/reports/stock-value", (req, res) => {
    try {
      const value = db.prepare("SELECT SUM(stock_quantity * cost_price) as total_value FROM products").get();
      res.json(value);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/reports/sales-trends", (req, res) => {
    try {
      const { year } = req.query;
      const trends = db.prepare(`
        SELECT strftime('%m', date) as month, SUM(total_amount) as total
        FROM sales
        WHERE strftime('%Y', date) = ?
        GROUP BY month
      `).all(year);
      res.json(trends);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Vite Setup ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
