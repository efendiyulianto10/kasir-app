// Tipe data untuk sistem konsinyasi (titip jual)

export interface ConsignmentSupplier {
  id: string;
  name: string;
  phone: string;
  products: ConsignmentProduct[];
}

export interface ConsignmentProduct {
  id: string;
  name: string;
  pricePerUnit: number; // Harga jual per unit
  costPerUnit: number;  // Harga beli/bayar ke supplier per unit
  unit: string;         // pcs, porsi, bungkus, dll
}

export interface ConsignmentForm {
  id: string;
  supplierId: string;
  supplierName: string;
  branchId: string;
  date: string;
  items: ConsignmentFormItem[];
  status: 'draft' | 'printed' | 'filled' | 'verified' | 'settled';
  photoUrl?: string;
  createdAt: string;
  verifiedAt?: string;
  settledAt?: string;
  notes?: string;
}

export interface ConsignmentFormItem {
  productId: string;
  productName: string;
  unit: string;
  pricePerUnit: number;
  costPerUnit: number;
  qtyBrought: number;      // Jumlah dibawa supplier (diisi supplier)
  qtyRemaining: number;    // Sisa (diisi kasir sore)
  qtySold: number;         // Terjual = dibawa - sisa
  totalRevenue: number;    // Pendapatan = terjual x harga jual
  totalCost: number;       // Bayar supplier = terjual x harga beli
  profit: number;          // Keuntungan = revenue - cost
}

export interface ConsignmentSettlement {
  id: string;
  formId: string;
  supplierId: string;
  supplierName: string;
  branchId: string;
  date: string;
  totalSold: number;
  totalRevenue: number;
  totalPayToSupplier: number;
  totalProfit: number;
  isPaid: boolean;
  paidAt?: string;
}
