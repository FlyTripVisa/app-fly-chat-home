#!/usr/bin/env bash
set -euo pipefail

# ... (পূর্বের ফাংশনগুলো ঠিক থাকবে)

# উন্নত json_field ফাংশন
json_field() {
  node -e "
    const fs = require('fs');
    const data = fs.readFileSync(0, 'utf8');
    try {
      const o = JSON.parse(data);
      const val = process.argv[1].split('.').reduce((a, k) => (a && a[k] !== undefined) ? a[k] : undefined, o);
      console.log(val ?? '');
    } catch { console.log(''); }
  " "$1"
}

# ...

# 8. DATABASE_URL চেক আরও নির্ভুল করা হয়েছে
if ! grep -q '^DATABASE_URL=' .env.local 2>/dev/null; then
  warn "DATABASE_URL is not in .env.local."
  # শুধুমাত্র যদি .env.local ফাইলটি থাকে তবেই ফাইল মডিফিকেশন করুন
  if [ -f .env.local ]; then
     read -r -p "Paste DATABASE_URL (or press enter to skip): " DBURL
     if [ -n "${DBURL:-}" ]; then
       # পূর্বের ভ্যালু থাকলে রিমুভ করে নতুনটি যোগ করা
       grep -v '^DATABASE_URL=' .env.local > .env.local.tmp || true
       echo "DATABASE_URL=$DBURL" >> .env.local.tmp
       mv .env.local.tmp .env.local
     fi
  fi
fi

# ...
