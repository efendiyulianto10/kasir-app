// Supabase sync configuration and functions

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
  lastSync?: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  try {
    const data = localStorage.getItem('smp_supabase_config');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem('smp_supabase_config', JSON.stringify(config));
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem('smp_supabase_config');
}

// Test connection to Supabase
export async function testConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
    });
    
    if (response.ok || response.status === 200) {
      return { success: true, message: 'Koneksi berhasil!' };
    } else if (response.status === 401) {
      return { success: false, message: 'API Key tidak valid' };
    } else {
      return { success: false, message: `Error: ${response.status}` };
    }
  } catch (error) {
    return { success: false, message: 'Tidak bisa terhubung ke Supabase. Periksa URL.' };
  }
}

// Get all local data for sync
function getAllLocalData(): Record<string, unknown> {
  const keys = ['regions', 'branches', 'suppliers', 'products', 'transactions', 'stock', 'demand_tests', 'notifications', 'users'];
  const data: Record<string, unknown> = {};
  
  keys.forEach(key => {
    const val = localStorage.getItem(`smp_${key}`);
    if (val) {
      try {
        data[key] = JSON.parse(val);
      } catch {
        data[key] = [];
      }
    }
  });
  
  return data;
}

// Push data to Supabase
export async function pushToSupabase(config: SupabaseConfig): Promise<{ success: boolean; message: string }> {
  try {
    const data = getAllLocalData();
    
    // We'll store all data in a single table called 'smp_sync' with a JSON column
    const syncData = {
      id: 'main_data',
      data: JSON.stringify(data),
      updated_at: new Date().toISOString(),
    };

    // Try to upsert the data
    const response = await fetch(`${config.url}/rest/v1/smp_sync?on_conflict=id`, {
      method: 'POST',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(syncData),
    });

    if (response.ok || response.status === 201) {
      // Update last sync time
      const updatedConfig = { ...config, lastSync: new Date().toISOString() };
      saveSupabaseConfig(updatedConfig);
      return { success: true, message: 'Data berhasil di-push ke Supabase!' };
    } else {
      const errorText = await response.text();
      
      // Check if table doesn't exist
      if (errorText.includes('relation') && errorText.includes('does not exist')) {
        return { 
          success: false, 
          message: 'Tabel "smp_sync" belum ada di Supabase. Silakan buat tabel terlebih dahulu.' 
        };
      }
      
      return { success: false, message: `Gagal push: ${errorText}` };
    }
  } catch (error) {
    return { success: false, message: `Error: ${error}` };
  }
}

// Pull data from Supabase
export async function pullFromSupabase(config: SupabaseConfig): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
  try {
    const response = await fetch(`${config.url}/rest/v1/smp_sync?id=eq.main_data&select=*`, {
      method: 'GET',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      
      if (result && result.length > 0 && result[0].data) {
        const data = typeof result[0].data === 'string' ? JSON.parse(result[0].data) : result[0].data;
        
        // Save to localStorage
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(`smp_${key}`, JSON.stringify(value));
        });
        
        // Update last sync time
        const updatedConfig = { ...config, lastSync: new Date().toISOString() };
        saveSupabaseConfig(updatedConfig);
        
        return { success: true, message: 'Data berhasil di-pull dari Supabase! Halaman akan di-refresh.', data };
      } else {
        return { success: false, message: 'Tidak ada data di Supabase. Push data terlebih dahulu.' };
      }
    } else {
      const errorText = await response.text();
      
      if (errorText.includes('relation') && errorText.includes('does not exist')) {
        return { 
          success: false, 
          message: 'Tabel "smp_sync" belum ada di Supabase.' 
        };
      }
      
      return { success: false, message: `Gagal pull: ${errorText}` };
    }
  } catch (error) {
    return { success: false, message: `Error: ${error}` };
  }
}

// SQL to create table in Supabase
export const createTableSQL = `
-- Jalankan SQL ini di Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS smp_sync (
  id TEXT PRIMARY KEY DEFAULT 'main_data',
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (opsional, untuk keamanan)
ALTER TABLE smp_sync ENABLE ROW LEVEL SECURITY;

-- Policy untuk allow all (sesuaikan dengan kebutuhan)
CREATE POLICY "Allow all access" ON smp_sync
  FOR ALL
  USING (true)
  WITH CHECK (true);
`;
