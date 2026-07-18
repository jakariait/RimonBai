# Rimon Medical Equipment - SaaS Application

A production-ready Medical Equipment Reseller management system built with the MERN stack. Features inventory management, sales & purchase tracking, invoicing, expense management, profit & loss reports, and role-based access control.

## Tech Stack

### Backend
- **Node.js** + **Express.js** - API server
- **MongoDB** + **Mongoose** - Database & ODM
- **JWT** + **Refresh Tokens** - Authentication
- **bcryptjs** - Password hashing
- **Zod** - Validation
- **Helmet** / **CORS** / **Rate Limiter** - Security

### Frontend
- **React** + **Vite** - UI framework
- **Tailwind CSS** + **shadcn/ui** - Styling
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form** + **Zod** - Form management
- **Recharts** - Charts
- **Framer Motion** - Animations (via Tailwind)
- **Sonner** - Toast notifications
- **Lucide** - Icons

---

## Folder Structure

```
├── backennd/                    # Backend API
│   ├── src/
│   │   ├── config/              # Configuration
│   │   ├── constants/           # Constants & enums
│   │   ├── controllers/         # Route handlers
│   │   ├── database/            # Database connection
│   │   ├── middleware/           # Auth, validation, security
│   │   ├── models/              # Mongoose models (13 models)
│   │   ├── routes/              # Express routes
│   │   ├── scripts/             # CLI utilities (create-user, seed)
│   │   ├── services/            # Business logic layer
│   │   ├── uploads/             # File uploads directory
│   │   ├── utils/               # Helper functions
│   │   ├── validators/          # Zod validation schemas
│   │   ├── app.js               # Express app setup
│   │   └── server.js            # Entry point
│   ├── .env                     # Environment variables
│   └── package.json
│
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # Sidebar, Header, AppLayout
│   │   │   └── ui/              # Button, Input, Card, Table, Modal, etc.
│   │   ├── hooks/               # Custom React hooks + TanStack Query wrappers
│   │   ├── lib/                 # API client, utils, validation schemas
│   │   ├── pages/
│   │   │   ├── auth/            # Login
│   │   │   ├── dashboard/       # Business overview with charts
│   │   │   ├── suppliers/       # CRUD supplier management
│   │   │   ├── customers/       # CRUD customer management
│   │   │   ├── products/        # CRUD product management
│   │   │   ├── purchases/       # Purchase orders with items
│   │   │   ├── sales/           # Sales invoices with print
│   │   │   ├── expenses/        # Expense tracking
│   │   │   ├── inventory/       # Stock overview & movements
│   │   │   ├── reports/         # P&L, Sales, Purchase, Inventory reports
│   │   │   ├── users/           # User management (admin)
│   │   │   └── settings/        # Business & invoice settings
│   │   ├── store/               # Zustand stores
│   │   ├── App.jsx              # Router & app entry
│   │   └── main.jsx             # React DOM entry
│   ├── .env                     # Frontend environment
│   └── package.json
│
└── README.md
```

---

## Installation Guide

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone & Install Backend

```bash
cd backennd
npm install
```

### 2. Configure Backend Environment

```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
```

### 3. Seed Initial Data (Optional)

```bash
npm run seed
```

### 4. Create Admin User

```bash
npm run create-user
# Follow the prompts to create a super admin user
```

### 5. Start Backend

```bash
npm run dev
# Server starts at http://localhost:5050
```

### 6. Install & Start Frontend

```bash
cd frontend
npm install
npm run dev
# App starts at http://localhost:5173
```

---

## Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5050` |
| `NODE_ENV` | Environment | `development` |
| `CLIENT_URL` | Allowed CORS origins | `http://localhost:5173` |
| `MONGO_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | Access token expiry | `7d` |
| `JWT_REFRESH_SECRET` | Refresh token secret | Required |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `30d` |

### Frontend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5050/api` |

---

## API Documentation

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/refresh-token` | Refresh access token | No |
| POST | `/api/auth/logout` | Logout user | Yes |
| GET | `/api/auth/profile` | Get user profile | Yes |
| PUT | `/api/auth/change-password` | Change password | Yes |

### Users

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/users` | List users | Admin+ |
| POST | `/api/users` | Create user | Admin+ |
| GET | `/api/users/:id` | Get user | Admin+ |
| PUT | `/api/users/:id` | Update user | Admin+ |
| DELETE | `/api/users/:id` | Delete user | Admin+ |

### Suppliers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/suppliers` | List suppliers (search, paginate) |
| POST | `/api/suppliers` | Create supplier |
| GET | `/api/suppliers/:id` | Get supplier |
| PUT | `/api/suppliers/:id` | Update supplier |
| DELETE | `/api/suppliers/:id` | Delete supplier |
| GET | `/api/suppliers/:id/ledger` | Supplier ledger with balance |

### Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List customers (search, paginate) |
| POST | `/api/customers` | Create customer |
| GET | `/api/customers/:id` | Get customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |
| GET | `/api/customers/:id/ledger` | Customer ledger with balance |

### Products & Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (search, filter) |
| POST | `/api/products` | Create product |
| GET | `/api/products/:id` | Get product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/products/:id/movements` | Stock movements for product |
| PUT | `/api/products/:id/adjust-stock` | Adjust stock quantity |
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category |

### Purchases

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/purchases` | List purchases |
| POST | `/api/purchases` | Create purchase (auto-updates stock) |
| GET | `/api/purchases/:id` | Get purchase details |
| PUT | `/api/purchases/:id/status` | Update purchase status |

### Sales

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales` | List sales |
| POST | `/api/sales` | Create sale (auto-deducts stock) |
| GET | `/api/sales/:id` | Get sale details |
| PUT | `/api/sales/:id/status` | Update sale status |

### Expenses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List expenses |
| POST | `/api/expenses` | Create expense |
| GET | `/api/expenses/reports` | Expense report by category |
| GET | `/api/expenses/:id` | Get expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory/summary` | Inventory valuation & stats |
| GET | `/api/inventory/low-stock` | Low stock products |
| GET | `/api/inventory/out-of-stock` | Out of stock products |
| GET | `/api/inventory/movements` | Stock movement report |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard stats & charts |
| GET | `/api/analytics/profit-loss` | Profit & loss statement |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings/business` | Get business settings |
| PUT | `/api/settings/business` | Update business settings |
| GET | `/api/settings/invoice` | Get invoice settings |
| PUT | `/api/settings/invoice` | Update invoice settings |

### Response Format

Success:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Error:
```json
{
  "success": false,
  "message": "Error description"
}
```

Paginated:
```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Roles & Permissions

| Role | Level | Permissions |
|------|-------|-------------|
| **Super Admin** | Full | All access including user management & settings |
| **Admin** | High | All operational access (no user management) |
| **Sales** | Limited | Sales, customers, products, reports |
| **Accountant** | Medium | Purchases, expenses, reports, P&L |

---

## Scripts

### Backend

```bash
npm run dev          # Development with nodemon
npm start            # Production start
npm run create-user  # CLI tool to create users
npm run seed         # Seed initial data (admin, categories, settings)
```

### Frontend

```bash
npm run dev          # Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
```

---

## Features

- **Dashboard** - Real-time business overview with revenue, profit, expenses, charts
- **Supplier Management** - CRUD, search, ledger, outstanding balance tracking
- **Customer Management** - CRUD, search, ledger, due balance tracking
- **Product Management** - CRUD, category, stock tracking, barcode, SKU generation
- **Purchase Orders** - Create with multiple items, auto stock increase, due tracking
- **Sales Invoicing** - Create with multiple items, auto stock deduction, print invoice
- **Invoice Printing** - Clean print layout with business & customer details
- **Expense Tracking** - Categorized expenses (Office, Salary, Marketing, etc.)
- **Inventory** - Stock valuation, low stock alerts, movement history
- **Profit & Loss** - Daily/weekly/monthly/yearly P&L with charts
- **Reports** - Sales, Purchase, Inventory, Customer, Supplier, Expense reports with CSV export
- **User Management** - Role-based access with CRUD
- **Settings** - Business info, invoice defaults, password change
- **Dark Mode** - Toggle between light and dark themes
- **Responsive** - Mobile-friendly sidebar and layouts
- **Security** - JWT, refresh tokens, helmet, rate limiting, XSS protection, NoSQL injection prevention

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Enable MongoDB authentication with strong credentials
- [ ] Set up MongoDB backups (daily)
- [ ] Use a process manager (PM2) for the backend
- [ ] Configure reverse proxy (Nginx) for the frontend
- [ ] Enable HTTPS with Let's Encrypt
- [ ] Set appropriate rate limits for production
- [ ] Set `secure: true` on cookies (HTTPS only)
- [ ] Remove or secure the `/uploads` directory
- [ ] Configure proper CORS origins
- [ ] Set up logging (Winston or similar)
- [ ] Monitor MongoDB connection pool
- [ ] Set up CI/CD pipeline

---

## Deployment

### Backend (VPS / DigitalOcean / AWS)

```bash
npm ci --production
npm start
```

### Frontend (Vercel / Netlify)

```bash
npm run build
# Deploy the dist/ folder
```

Set `VITE_API_URL` to your production backend URL.

---

## License

Private - All rights reserved.
# RimonBai
