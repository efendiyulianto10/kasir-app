# Supabase Edge Functions - SMP System

## 1. Daily Report Generator (Cron Job)

File: `supabase/functions/daily-report/index.ts`

Runs every day at 21:00 WIB via Supabase Cron.

```typescript
// Supabase Edge Function: Daily Report Generator
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const GOOGLE_SPREADSHEET_ID = Deno.env.get('GOOGLE_SPREADSHEET_ID')!;
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_OWNER_CHAT_ID')!;

interface BranchReport {
  branch_id: string;
  branch_name: string;
  branch_code: string;
  total_transactions: number;
  total_items_sold: number;
  total_revenue: number;
  total_supplier_payout: number;
  total_smp_revenue: number;
  achievement_rate: number;
}

serve(async (req: Request) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`Generating daily report for ${today}`);

    // 1. Fetch all active branches
    const { data: branches } = await supabase
      .from('branches')
      .select('*')
      .eq('status', 'active');

    // 2. Calculate report for each branch
    const branchReports = [];
    for (const branch of branches || []) {
      const { data: settlement } = await supabase
        .from('daily_settlements')
        .select('*')
        .eq('branch_id', branch.id)
        .eq('date', today)
        .single();

      branchReports.push({
        branch_id: branch.id,
        branch_name: branch.name,
        branch_code: branch.code,
        total_transactions: settlement?.total_transactions || 0,
        total_items_sold: settlement?.total_items_sold || 0,
        total_revenue: settlement?.total_revenue || 0,
        total_supplier_payout: settlement?.total_supplier_payout || 0,
        total_smp_revenue: settlement?.total_smp_revenue || 0,
        achievement_rate: settlement 
          ? (settlement.total_revenue / branch.daily_target) * 100 
          : 0,
      });
    }

    // 3. Send to Google Sheets
    await sendToGoogleSheets(branchReports);

    // 4. Send Telegram notification
    await sendTelegramReport(branchReports);

    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
```

### Cron Configuration

Add to `supabase/config.toml`:

```toml
[functions.daily-report]
schedule = "0 14 * * *"  # 21:00 WIB = 14:00 UTC
```

---

## 2. Telegram Bot Webhook

File: `supabase/functions/telegram-bot/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const AUTHORIZED_CHAT_IDS = Deno.env.get('AUTHORIZED_CHAT_IDS')?.split(',') || [];

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name: string };
    chat: { id: number };
    text?: string;
  };
}

serve(async (req: Request) => {
  const update: TelegramUpdate = await req.json();
  const message = update.message;
  if (!message?.text) return new Response('OK');

  const chatId = message.chat.id.toString();
  const [command, ...args] = message.text.split(' ');

  switch (command.toLowerCase()) {
    case '/omset':
      await handleOmset(chatId);
      break;
    case '/supplier':
      await handleSupplier(chatId);
      break;
    case '/cabang':
      await handleCabang(chatId, args[0]);
      break;
    case '/laporan':
      await handleLaporan(chatId);
      break;
    case '/alert':
      await handleAlert(chatId);
      break;
    default:
      await sendMessage(chatId, 'Perintah tidak dikenal. Ketik /help');
  }

  return new Response('OK');
});

async function sendMessage(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
}

// Handler implementations...
```

### Setup Webhook

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://<PROJECT_REF>.supabase.co/functions/v1/telegram-bot"}'
```

---

## 3. WhatsApp Notification Function

File: `supabase/functions/send-whatsapp/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const FONNTE_API_KEY = Deno.env.get('FONNTE_API_KEY')!;

interface WhatsAppRequest {
  target: string;
  message: string;
  type?: 'text' | 'image';
  url?: string;
}

serve(async (req: Request) => {
  const { target, message, type = 'text', url } = await req.json() as WhatsAppRequest;

  const body: Record<string, string> = {
    target,
    message,
    countryCode: '62',
  };

  if (type === 'image' && url) {
    body.url = url;
  }

  const response = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      'Authorization': FONNTE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();
  return new Response(JSON.stringify(result));
});
```

---

## 4. Stock Alert Function (Real-time Trigger)

File: `supabase/functions/stock-alert/index.ts`

Triggered by database webhook when stock is low.

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  const payload = await req.json();
  const { record } = payload; // daily_stocks record

  // Check if stock is below threshold (20%)
  const stockPercentage = (record.current_stock / record.initial_stock) * 100;
  
  if (stockPercentage <= 20 && stockPercentage > 0) {
    // Get supplier info
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('phone, name')
      .eq('id', record.supplier_id)
      .single();

    // Get product info
    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', record.product_id)
      .single();

    // Send WhatsApp notification
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-whatsapp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: supplier.phone,
        message: `⚠️ *Stok Menipis*\n\nHai ${supplier.name},\n\nProduk "${product.name}" tersisa ${record.current_stock} pcs.\n\nSilakan restock atau tarik sisa produk.`,
      }),
    });
  }

  return new Response('OK');
});
```

### Database Webhook Setup

```sql
-- Create webhook trigger
CREATE OR REPLACE FUNCTION notify_stock_alert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/stock-alert',
    body := json_build_object('record', NEW)::text,
    headers := '{"Content-Type": "application/json"}'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_stock_alert
  AFTER UPDATE ON daily_stocks
  FOR EACH ROW
  WHEN (NEW.current_stock < OLD.current_stock)
  EXECUTE FUNCTION notify_stock_alert();
```

---

## Deployment Commands

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy daily-report

# View logs
supabase functions logs daily-report

# Set secrets
supabase secrets set TELEGRAM_BOT_TOKEN=xxx
supabase secrets set FONNTE_API_KEY=xxx
supabase secrets set GOOGLE_SERVICE_ACCOUNT='{"client_email":"...","private_key":"..."}'
```
