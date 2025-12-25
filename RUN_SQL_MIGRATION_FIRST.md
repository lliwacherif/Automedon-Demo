# ⚠️ URGENT: Run This SQL Migration First!

## Problem
You're getting error: **"Could not find the 'image_url' column of 'cars' in the schema cache"**

## Solution
You need to add the `image_url` column to your `cars` table in Supabase.

---

## 🔧 Steps to Fix

### 1. Open Supabase Dashboard
Go to: **https://supabase.com** → Your Project → **SQL Editor**

### 2. Copy and Run This SQL

```sql
-- Add image_url column for car images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cars' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE cars ADD COLUMN image_url TEXT;
    END IF;
END $$;
```

### 3. Click "Run"

That's it! The column will be added if it doesn't already exist.

---

## ✅ Verify It Worked

After running the SQL:

1. Go to **Table Editor** → `cars` table
2. Check that `image_url` column appears in the columns list
3. Refresh your app
4. Try uploading a car image again
5. The error should be gone! ✨

---

## 📌 What This Does

- Adds an optional `image_url` TEXT column to the `cars` table
- Safe to run multiple times (won't create duplicates)
- Allows storing the Supabase Storage URLs for car images

---

## 🎉 After Migration

Once the column is added:
- ✅ File uploads will work
- ✅ Images will display on Home and Fleet pages
- ✅ No more schema cache errors
