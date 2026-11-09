# StockFlow MVP – SaaS Inventory Management System

> **Assessment Submission for Wexa AI**  
> Built strictly adhering to the *Phase 1 – 6-Hour MVP PRD (Scope-Reduced)*.

StockFlow is a multi-tenant SaaS inventory management web application where business owners can manage product catalogs, monitor inventory quantities, receive real-time low-stock alerts, and configure organization-wide stock thresholds—all with strict multi-tenant data isolation.

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite SPA), Tailwind CSS, Lucide React
* **Backend:** Node.js, Express.js (REST API)
* **Database & ORM:** MongoDB via Mongoose (with automatic in-memory MongoDB fallback for instant zero-config testing)
* **Authentication:** Stateless JWT (JSON Web Tokens), bcryptjs password hashing

---

## ✨ Core Features & PRD Mapping

1. **Authentication & Multi-Tenant Scoping (FR-1, FR-2):**
   * Tenant signup creates an `Organization` record and owner `User` account.
   * Strict multi-tenant isolation: all products, inventory, and settings are scoped to `organizationId`. Cross-tenant data leaks are mathematically prevented at the database and query layers.
2. **Product Catalog & Management (FR-3, FR-4):**
   * Product fields: Name, SKU (unique per organization), Description, Quantity on Hand, Cost Price, Selling Price, Low Stock Threshold.
   * Fast client-side search by Product Name or SKU.
   * Full CRUD operations with delete confirmation dialogs.
3. **Simple Stock Updates & Adjustments (FR-5):**
   * Direct stock quantity editing or quick inline stock delta (`+/- N units`) with optional audit note.
4. **Executive Dashboard (FR-6):**
   * Real-time KPI summary cards: Total Products, Total Units on Hand, and Low Stock Item Count.
   * Dedicated Low Stock Table highlighting items at or below threshold.
5. **Organization Settings (FR-7):**
   * Configurable Default Low Stock Threshold used dynamically for products without individual thresholds.

---

## 📁 Project Structure

```text
├── package.json              # Monorepo scripts (concurrently dev orchestration)
├── .gitignore                # Production gitignore (node_modules, .env, dist)
├── README.md                 # Project documentation
│
├── server/                   # Express Backend
│   ├── .env.example          # Environment variables template
│   ├── package.json          # Backend dependencies
│   └── src/
│       ├── config/           # Database connection & in-memory fallback
│       ├── models/           # Mongoose Schemas (Organization, User, Product)
│       ├── middleware/       # JWT Auth & Organization context extraction
│       ├── routes/           # Auth, Products, Dashboard, Settings endpoints
│       ├── seed.js           # Multi-tenant demo seed data script
│       └── server.js         # Express server entry point
│
└── client/                   # React Frontend (Vite)
    ├── index.html            # SPA entry HTML
    ├── vite.config.js        # Vite configuration with /api backend proxy
    ├── tailwind.config.js    # Tailwind styling system
    └── src/
        ├── api.js            # Centralized API service layer
        ├── context/          # Auth & Organization state provider
        ├── components/       # UI Components (Navbar, Modals, StatCards, Toast)
        ├── pages/            # Dashboard, Products, Settings, Login, Signup
        └── App.jsx           # Main application view & route gating
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* Node.js v18+ or v20+
* npm v9+

### 2. Setup
Install root, server, and client dependencies:
```bash
npm install
npm --prefix server install
npm --prefix client install
```

### 3. Environment Configuration
Copy the template to create your local `.env`:
```bash
cp server/.env.example server/.env
```
* **Zero-Setup Mode:** If `MONGODB_URI` is left blank, the app will automatically spin up an in-memory MongoDB instance.
* **MongoDB Atlas Cloud:** Set `MONGODB_URI` to your Atlas cluster connection string:
  ```env
  MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/stockflow?retryWrites=true&w=majority
  ```
  *(Note: URL-encode any special characters in the password, e.g. `@` as `%40`).*

### 4. Run Development Servers
Start both the Express API (`http://localhost:5000`) and the React UI (`http://localhost:5173`) concurrently in a single command:
```bash
npm run dev
```

### 5. Seed Demo Accounts
To populate isolated organizations for testing:
```bash
npm run seed
```

**Pre-seeded Demo Accounts:**
| Organization | Email | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Acme Retail Store** | `admin@acme.com` | `password123` | Demo products, low-stock items |
| **Beta Logistics Corp** | `demo@beta.com` | `password123` | Demonstrates multi-tenant isolation |

---

## 🔒 Multi-Tenant Security & Isolation
* Every product record carries an indexed `organizationId` foreign reference.
* SKU uniqueness is enforced per organization using a compound index: `{ organizationId: 1, sku: 1 }`.
* All API queries, mutations, and deletions require a validated JWT and enforce `{ organizationId: req.organizationId }` at the query level.

