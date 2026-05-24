# 🍳 SMP (Sarapan Murah Pagi) - Business Management System

Sistem manajemen bisnis F&B all-in-one untuk operasional bisnis sarapan dengan model konsinyasi (titip-jual).

## 📋 Fitur Utama

### 1. 🛒 Kasir Web App (POS)
- Progressive Web App (PWA) offline-first
- Input stok pagi via QR Code scanner
- Transaksi ultra-cepat (<10 detik/pelanggan)
- Grid layout produk dengan foto besar
- Support pembayaran Cash, QRIS, Transfer
- Auto-sync ke server setiap 5 menit

### 2. 👥 Supplier Portal
- Pendaftaran mandiri supplier
- Dashboard real-time penjualan
- Download QR Code produk
- Riwayat pembayaran 30 hari
- Notifikasi stok menipis

### 3. 📊 Owner & Supervisor Dashboard
- Monitoring live transaksi (Realtime)
- Grafik omset per jam
- Scorecard supplier bulanan
- Alert otomatis (omset rendah, supplier telat)
- Rekonsiliasi keuangan harian

### 4. 🗺️ HQ Dashboard Multi-Cabang
- Peta Indonesia interaktif
- KPI konsolidasi nasional
- Ranking cabang terbaik/terlemah
- Monitoring royalti franchisee

## 💰 Model Bisnis

| Item | Nilai |
|------|-------|
| Harga Fixed | Rp 10.000/pcs |
| Share Supplier | 90% (Rp 9.000) |
| Share SMP | 10% (Rp 1.000) |
| Jam Operasi | 04:30 - 09:00 WIB |
| Peak Hour | 05:00 - 07:30 WIB |

## 🏗️ Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **State:** Zustand
- **Charts:** Recharts
- **Icons:** Lucide React
- **QR Code:** qrcode.react + @zxing/browser
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
- **Payment:** Midtrans/Xendit (QRIS)
- **Notifications:** Fonnte (WhatsApp), Telegram Bot
- **Reports:** Google Sheets API

## 📁 Struktur Folder

```
src/
├── components/
│   ├── layout/          # Sidebar, Header, Layout
│   └── ui/              # Button, Card, Modal, etc.
├── pages/
│   ├── Dashboard.tsx    # Main dashboard
│   ├── POS.tsx          # Point of Sale
│   ├── StockIn.tsx      # Stock input
│   ├── Suppliers.tsx    # Supplier management
│   ├── Products.tsx     # Product catalog
│   ├── Transactions.tsx # Transaction history
│   ├── Reports.tsx      # Analytics & reports
│   ├── Branches.tsx     # HQ multi-branch
│   ├── SupplierPortal.tsx # Supplier self-service
│   └── Login.tsx        # Authentication
├── store/               # Zustand stores
├── types/               # TypeScript types
├── data/                # Mock data
├── database/            # SQL schema
└── docs/                # Technical documentation
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 👤 Demo Login

Gunakan Quick Login buttons di halaman login:
- **Kasir** - Akses POS, Stock In
- **Supervisor** - Full branch access
- **CEO** - HQ Dashboard, Multi-branch
- **Supplier** - Supplier Portal

## 📊 Halaman Utama

| Route | Deskripsi |
|-------|-----------|
| `/` | Dashboard utama |
| `/pos` | Point of Sale (Kasir) |
| `/stock-in` | Input stok pagi |
| `/suppliers` | Manajemen supplier |
| `/products` | Katalog produk |
| `/transactions` | Riwayat transaksi |
| `/reports` | Laporan & analitik |
| `/branches` | HQ multi-cabang |
| `/supplier-portal` | Portal supplier |
| `/login` | Halaman login |

## 📱 PWA Features

- Offline-first dengan IndexedDB
- Install ke home screen
- Background sync
- Push notifications (planned)

## 🔒 Keamanan

- JWT Authentication dengan refresh token
- PIN 6 digit untuk kasir (rotasi mingguan)
- Row Level Security (RLS) di database
- Audit trail immutable
- Rate limiting 100 req/min/user

## 📈 Scorecard Supplier

| Kriteria | Bobot |
|----------|-------|
| Sell-through Rate | 40% |
| Konsistensi Kehadiran | 25% |
| Kualitas Produk | 25% |
| Kebersihan Packaging | 10% |

## 💵 Estimasi Biaya (100 Cabang)

| Service | Biaya/Bulan |
|---------|-------------|
| Supabase Pro | $25 |
| Vercel Pro | $20 |
| Upstash Redis | $10 |
| Fonnte WhatsApp | Rp 500.000 |
| Mapbox | ~$50 |
| **Total** | **~$150 + Rp 500.000** |

## 📅 Roadmap

- [x] Phase 1: MVP (1-3 Cabang)
- [ ] Phase 2: Scale (10 Cabang)
- [ ] Phase 3: Full System (100 Cabang)

## 📄 Dokumentasi

- `src/database/schema.sql` - Database schema lengkap
- `src/docs/TECHNICAL_SPEC.md` - Spesifikasi teknis
- `src/docs/EDGE_FUNCTIONS.md` - Supabase Edge Functions

---

**© 2025 SMP - Sarapan Murah Pagi**  
*Sistem tidak pernah down saat jam operasional 04:30-09:00 WIB*
