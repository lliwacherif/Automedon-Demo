# Supabase Storage Setup for Car Images

## Step 1: Create Storage Bucket

You need to create a storage bucket in Supabase for car images:

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Configure the bucket:
   - **Name**: `car-images`
   - **Public bucket**: ✅ **Enable** (so images are publicly accessible)
   - **File size limit**: 5 MB (recommended)
   - **Allowed MIME types**: Leave empty or restrict to `image/*`
4. Click **"Create bucket"**

## Step 2: Set Up Storage Policies (Optional but Recommended)

For better security, you can set up Row Level Security (RLS) policies:

### Allow Public Read Access
```sql
CREATE POLICY "Public can read car images"
ON storage.objects FOR SELECT
USING (bucket_id = 'car-images');
```

### Allow Authenticated Users to Upload
```sql
CREATE POLICY "Authenticated users can upload car images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'car-images' AND auth.role() = 'authenticated');
```

### Allow Authenticated Users to Update
```sql
CREATE POLICY "Authenticated users can update car images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'car-images' AND auth.role() = 'authenticated');
```

### Allow Authenticated Users to Delete
```sql
CREATE POLICY "Authenticated users can delete car images"
ON storage.objects FOR DELETE
USING (bucket_id = 'car-images' AND auth.role() = 'authenticated');
```

## Step 3: Test the Upload

1. Go to Admin panel → Cars → Add New Car
2. Select an image file (PNG, JPG, JPEG up to 5MB)
3. See the preview
4. Submit the form
5. The image will be uploaded to Supabase Storage and the URL saved in the database

## File Upload Features

- ✅ **File validation**: Only images allowed (PNG, JPG, JPEG)
- ✅ **Size limit**: Maximum 5MB
- ✅ **Preview**: Shows image preview before upload
- ✅ **Remove**: Can remove selected image before submit
- ✅ **Unique filenames**: Uses timestamp + random string to avoid conflicts
- ✅ **Organized storage**: Files stored in `car-images/cars/` folder

## File Naming Convention

Files are automatically renamed with format:
```
{timestamp}-{random}.{extension}
Example: 1700582400000-abc123.jpg
```

This ensures:
- No filename conflicts
- Organized file structure
- Easy to identify when files were uploaded
