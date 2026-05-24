# SMP (Sarapan Murah Pagi) - Technical Specification

## 📋 Ringkasan Sistem

SMP adalah sistem manajemen bisnis F&B all-in-one untuk operasional bisnis sarapan dengan model konsinyasi (titip-jual). Semua produk berharga **FIXED Rp 10.000/pcs** dengan bagi hasil **Supplier 90% (Rp 9.000)** dan **SMP 10% (Rp 1.000)**.

### Jam Operasional
- **Buka:** 04:30 WIB
- **Tutup:** 09:00 WIB
- **Peak Hour:** 05:00 - 07:30 WIB

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  React + Vite + Tailwind CSS (PWA)                              │
│  ├── Kasir Web App (Offline-first)                              │
│  ├── Supplier Portal (Mobile-responsive)                        │
│  ├── Owner/Supervisor Dashboard                                 │
│  └── HQ Dashboard (Multi-cabang)                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  Supabase                                                       │
│  ├── PostgreSQL Database                                        │
│  ├── Authentication (JWT + Refresh Token)                       │
│  ├── Realtime WebSocket                                         │
│  ├── Storage (Images, Documents)                                │
│  └── Edge Functions (Cron Jobs, Telegram Bot)                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     INTEGRATIONS                                 │
├─────────────────────────────────────────────────────────────────┤
│  ├── Midtrans/Xendit (Payment Gateway - QRIS)                   │
│  ├── Fonnte API (WhatsApp Notifications)                        │
│  ├── Telegram Bot API (Command Center)                          │
│  ├── Google Sheets API v4 (Automated Reports)                   │
│  ├── Resend (Email Notifications)                               │
│  └── Mapbox GL (Interactive Maps)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### Core Tables

#### branches
```sql
CREATE TABLE branches (
  id UUID PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,       -- e.g., "JKT01"
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(50) NOT NULL,
  province VARCHAR(50) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  type ENUM('coco', 'franchise') DEFAULT 'coco',
  status ENUM('active', 'inactive', 'maintenance', 'pending'),
  daily_target INTEGER DEFAULT 2000000,   -- Rupiah
  opening_time TIME DEFAULT '04:30',
  closing_time TIME DEFAULT '09:00',
  supervisor_id UUID REFERENCES users(id),
  franchise_owner_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('kasir', 'supervisor', 'owner_cabang', 'area_manager', 
            'hq_admin', 'ceo', 'investor', 'supplier'),
  branch_id UUID REFERENCES branches(id),
  pin_hash VARCHAR(255),                  -- 6-digit PIN (hashed)
  pin_expires_at TIMESTAMPTZ,             -- Auto-rotate weekly
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### suppliers
```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES branches(id),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  ktp_number VARCHAR(20) NOT NULL,
  ktp_photo_url TEXT NOT NULL,
  address TEXT NOT NULL,
  bank_name VARCHAR(50),
  bank_account_number VARCHAR(30),
  bank_account_name VARCHAR(100),
  status ENUM('pending', 'approved', 'suspended', 'rejected'),
  total_products INTEGER DEFAULT 0,
  avg_sell_through_rate DECIMAL(5, 2) DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_earnings BIGINT DEFAULT 0,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  photo_url TEXT NOT NULL,
  qr_code VARCHAR(50) UNIQUE NOT NULL,    -- Format: SMP-{BRANCH}-{SUPPLIER}-{SEQ}
  price INTEGER DEFAULT 10000 CHECK (price = 10000),
  supplier_share INTEGER DEFAULT 9000,
  smp_share INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  avg_daily_stock DECIMAL(5, 2) DEFAULT 0,
  avg_daily_sold DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### daily_stocks
```sql
CREATE TABLE daily_stocks (
  id UUID PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES branches(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  product_id UUID NOT NULL REFERENCES products(id),
  date DATE NOT NULL,
  initial_stock INTEGER NOT NULL CHECK (initial_stock >= 0),
  current_stock INTEGER NOT NULL CHECK (current_stock >= 0),
  sold_qty INTEGER DEFAULT 0,
  returned_qty INTEGER DEFAULT 0,
  checked_in_at TIMESTAMPTZ NOT NULL,
  checked_in_by UUID NOT NULL REFERENCES users(id),
  checked_out_at TIMESTAMPTZ,
  checked_out_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, date)
);
```

#### transactions
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES branches(id),
  transaction_number VARCHAR(30) UNIQUE NOT NULL,  -- Format: {BRANCH}{YYMMDD}{SEQ}
  date DATE NOT NULL,
  time TIME NOT NULL,
  cashier_id UUID NOT NULL REFERENCES users(id),
  total_items INTEGER NOT NULL CHECK (total_items > 0),
  total_amount BIGINT NOT NULL CHECK (total_amount > 0),
  payment_method ENUM('cash', 'qris', 'transfer'),
  payment_reference VARCHAR(100),
  status ENUM('completed', 'voided', 'pending') DEFAULT 'completed',
  voided_by UUID REFERENCES users(id),
  voided_at TIMESTAMPTZ,
  void_reason TEXT,
  synced_at TIMESTAMPTZ,                   -- NULL = pending sync (offline)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### transaction_items
```sql
CREATE TABLE transaction_items (
  id UUID PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  product_id UUID NOT NULL REFERENCES products(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER DEFAULT 10000,
  subtotal BIGINT NOT NULL,
  supplier_share BIGINT NOT NULL,
  smp_share BIGINT NOT NULL
);
```

---

## 🔐 Row Level Security (RLS)

### Policy Examples

```sql
-- Branch staff can only see their own branch data
CREATE POLICY "branch_isolation" ON transactions
  FOR ALL USING (
    branch_id = get_user_branch(auth.uid())
    OR get_user_role(auth.uid()) IN ('hq_admin', 'ceo', 'area_manager')
  );

-- Suppliers can only see their own data
CREATE POLICY "supplier_own_data" ON suppliers
  FOR SELECT USING (
    user_id = auth.uid()
    OR get_user_role(auth.uid()) IN ('supervisor', 'owner_cabang', 'hq_admin')
  );
```

---

## 📱 PWA Offline-First Architecture

### IndexedDB Schema (Client-side)

```javascript
// Database: smp_offline_db
{
  stores: {
    products: { keyPath: 'id', indexes: ['supplier_id', 'category'] },
    daily_stocks: { keyPath: 'id', indexes: ['product_id', 'date'] },
    pending_transactions: { keyPath: 'id', indexes: ['created_at'] },
    pending_stock_in: { keyPath: 'id', indexes: ['supplier_id'] },
    sync_queue: { keyPath: 'id', indexes: ['type', 'retry_count'] }
  }
}
```

### Sync Strategy

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Action   │ --> │  IndexedDB      │ --> │  Sync Queue     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                              ┌──────────────────────────┘
                              ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   UI Updated    │ <-- │  Realtime Sub   │ <-- │  Supabase       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

- **Auto-sync interval:** Every 5 minutes
- **Retry strategy:** Exponential backoff (max 5 retries)
- **Conflict resolution:** Server wins, with audit trail

---

## 🔔 Notification System

### WhatsApp via Fonnte

```javascript
// Stock low notification
POST https://api.fonnte.com/send
{
  "target": "6281234567890",
  "message": "⚠️ *SMP Cibubur*\n\nStok produk Anda tinggal sedikit:\n\n📦 Nasi Uduk Komplit: 3 pcs\n📦 Bubur Ayam: 2 pcs\n\nSegera restock sebelum habis!",
  "countryCode": "62"
}

// Closing settlement notification
{
  "target": "6281234567890",
  "message": "✅ *Laporan Penjualan*\nTanggal: 15 Jan 2025\n\n📊 Ringkasan:\n• Total Stok: 50 pcs\n• Terjual: 42 pcs\n• Sisa: 8 pcs\n\n💰 Penghasilan:\nRp 378.000\n\nTerima kasih telah bermitra dengan SMP! 🙏"
}
```

### Telegram Bot Commands

```
/omset - Lihat omset hari ini per cabang
/supplier - Top 10 supplier terlaris
/cabang [nama] - Detail spesifik satu cabang
/laporan - Generate & kirim PDF laporan
/alert - Lihat semua peringatan aktif
/rekap [bulan] - Laporan bulanan
```

---

## 📈 Supplier Scorecard Algorithm

```javascript
const calculateScorecard = (supplier, month) => {
  // Weights (total = 100%)
  const WEIGHTS = {
    sell_through_rate: 0.40,  // 40%
    attendance: 0.25,         // 25%
    quality: 0.25,            // 25%
    packaging: 0.10           // 10%
  };

  // Calculate sell-through rate (items sold / items supplied)
  const sellThroughScore = (soldItems / suppliedItems) * 100;
  
  // Calculate attendance (days present / total operating days)
  const attendanceScore = (daysPresent / totalDays) * 100;
  
  // Quality score from supervisor ratings (1-5 scale, normalized to 100)
  const qualityScore = (avgQualityRating / 5) * 100;
  
  // Packaging score from supervisor ratings
  const packagingScore = (avgPackagingRating / 5) * 100;

  // Final weighted score
  const totalScore = 
    sellThroughScore * WEIGHTS.sell_through_rate +
    attendanceScore * WEIGHTS.attendance +
    qualityScore * WEIGHTS.quality +
    packagingScore * WEIGHTS.packaging;

  return {
    sell_through_rate: sellThroughScore,
    attendance_rate: attendanceScore,
    quality_score: qualityScore,
    packaging_score: packagingScore,
    total_score: totalScore
  };
};
```

---

## 🌐 API Endpoints

### Authentication
```
POST /auth/login          - Login with email/PIN
POST /auth/refresh        - Refresh JWT token
POST /auth/logout         - Logout & invalidate token
POST /auth/reset-pin      - Request PIN reset
```

### Transactions
```
GET  /api/transactions              - List transactions (paginated)
POST /api/transactions              - Create new transaction
GET  /api/transactions/:id          - Get transaction detail
POST /api/transactions/:id/void     - Void transaction (supervisor only)
POST /api/transactions/sync         - Sync offline transactions
```

### Stock
```
GET  /api/stocks/daily              - Get today's stock
POST /api/stocks/check-in           - Record supplier check-in
POST /api/stocks/check-out          - Record supplier check-out (closing)
GET  /api/stocks/history            - Stock history
```

### Suppliers
```
GET  /api/suppliers                 - List suppliers
POST /api/suppliers/register        - Supplier self-registration
GET  /api/suppliers/:id             - Supplier detail
PUT  /api/suppliers/:id/status      - Approve/reject supplier
GET  /api/suppliers/:id/products    - List supplier's products
GET  /api/suppliers/:id/earnings    - Supplier earnings history
```

### Dashboard
```
GET  /api/dashboard/branch          - Branch dashboard data
GET  /api/dashboard/national        - National KPI (HQ only)
GET  /api/dashboard/realtime        - WebSocket subscription
```

### Reports
```
GET  /api/reports/daily             - Daily report
GET  /api/reports/weekly            - Weekly summary
GET  /api/reports/monthly           - Monthly report
POST /api/reports/export/pdf        - Generate PDF
POST /api/reports/export/sheets     - Send to Google Sheets
```

---

## 💰 Estimasi Biaya Hosting (100 Cabang)

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Supabase | Pro | $25 |
| Vercel | Pro | $20 |
| Upstash Redis | Pro | $10 |
| Fonnte WhatsApp | Enterprise | Rp 500.000 |
| Google Sheets API | Free tier | $0 |
| Mapbox | Pay as you go | ~$50 |
| Sentry | Team | $26 |
| **Total** | | **~$150 + Rp 500.000/bulan** |

---

## 📅 Development Timeline

### Phase 1: MVP (1-3 Cabang) - 8 Minggu
- Week 1-2: Database setup, Auth, Core API
- Week 3-4: Kasir PWA (POS, Stock In)
- Week 5-6: Supplier Portal, Dashboard
- Week 7-8: Testing, Bug fixes, Deployment

### Phase 2: Scale (10 Cabang) - 4 Minggu
- Multi-branch support
- HQ Dashboard
- Automated reports
- Telegram Bot

### Phase 3: Full System (100 Cabang) - 4 Minggu
- Performance optimization
- Advanced analytics
- Franchise management
- CCTV integration (optional)

---

## 🔒 Security Checklist

- [x] JWT with short expiry (15 min) + refresh token (7 days)
- [x] PIN rotation weekly (auto-generated, sent via WhatsApp)
- [x] Rate limiting (100 req/min/user)
- [x] Row Level Security on all tables
- [x] Audit trail (immutable, no UPDATE/DELETE)
- [x] Input validation (Zod schemas)
- [x] SQL injection prevention (parameterized queries)
- [x] XSS prevention (React auto-escaping)
- [x] HTTPS only
- [x] Encrypted sensitive data (bank accounts)

---

## 📝 Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Payment Gateway
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx

# Notifications
FONNTE_API_KEY=xxx
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
TELEGRAM_OWNER_CHAT_ID=-1001234567890

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms

# Mapbox
VITE_MAPBOX_TOKEN=pk.xxx

# Redis (Upstash)
UPSTASH_REDIS_URL=https://xxx.upstash.io
UPSTASH_REDIS_TOKEN=xxx

# Email (Resend)
RESEND_API_KEY=re_xxx
```

---

## 🚀 Deployment Guide

### 1. Setup Supabase
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize project
supabase init

# Link to remote project
supabase link --project-ref YOUR_PROJECT_REF

# Push database migrations
supabase db push
```

### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### 3. GitHub Actions CI/CD
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

*Document Version: 1.0.0*
*Last Updated: January 2025*
