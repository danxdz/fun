# Database Migration Instructions

## 🚨 IMPORTANT: Update Supabase Schema

The application expects certain database fields that are missing from the current schema. You need to run the migration script to add these fields.

## 📋 What's Missing:

### Users Table:
- `githubToken` - Stores GitHub OAuth token
- `githubUsername` - GitHub username
- `githubAvatar` - GitHub profile picture URL
- `cursorApiKey` - Cursor API key for user

### Projects Table:
- `status` - Project status (active/inactive/archived)
- `githubData` - JSON field storing GitHub repo metadata (stars, forks, etc.)

### Bots Table:
- `description` - Bot description field

## 🔧 How to Run Migration:

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the contents of `migration-add-missing-fields.sql`**
4. **Click "Run"**

## ✅ After Migration:

The migration script will:
- Add all missing columns with proper defaults
- Create indexes for better performance
- Update existing data to match new schema
- Run verification queries to confirm changes

## 🧪 Test After Migration:

1. Try creating a bot - should work without schema errors
2. Check dashboard - should show real data
3. Update profile - should save GitHub info and Cursor API key
4. Import projects - should work with GitHub data

## 📞 If Issues Persist:

If you still get schema errors after running the migration:
1. Check the verification queries at the end of the migration script
2. Make sure all columns were added successfully
3. Try refreshing your Supabase connection
4. Check the application logs for specific error messages