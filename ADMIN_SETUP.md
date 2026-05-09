# Admin Panel Setup Guide

This guide will help you set up the new admin panel with server-side data, role-based access control, and A/B testing.

## ✅ What Has Been Implemented

### 1. **Database Schema** (`supabase/complete_schema.sql`)
- ✅ Roles table (admin, user)
- ✅ User roles mapping with auto-assignment trigger
- ✅ Admin emails: `goyalchirag721@gmail.com`, `anuraggoyal231@gmail.com`
- ✅ All content tables: articles, modules, videos, events, junior
- ✅ A/B testing tables with variant management
- ✅ Row Level Security (RLS) policies
- ✅ Views for analytics

### 2. **Authentication & Roles** (`src/contexts/AuthContext.tsx`)
- ✅ Fetch user role from database on login
- ✅ `isAdmin` boolean in AuthContext
- ✅ Automatic admin assignment for configured emails

### 3. **Content Hooks** (`src/hooks/useContent.ts`)
- ✅ React Query hooks for all content types
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Real-time cache invalidation

### 4. **A/B Testing Hooks** (`src/hooks/useABTesting.ts`)
- ✅ Test management
- ✅ Variant assignment with weighted traffic distribution
- ✅ Metrics tracking (views, clicks, conversions)

### 5. **Admin Pages**
- ✅ Dashboard with stats overview
- ✅ Articles CRUD (list, create, edit, delete)
- ✅ Modules CRUD
- ✅ Videos CRUD
- ✅ Events CRUD
- ✅ Junior Content CRUD
- ✅ A/B Testing management

### 6. **Admin Layout** (`src/components/admin/AdminLayout.tsx`)
- ✅ Sidebar navigation
- ✅ Mobile responsive
- ✅ Protected routes

---

## 🚀 Setup Instructions

### Step 1: Run the Database Schema

1. Go to your Supabase Dashboard → SQL Editor
2. Open `supabase/complete_schema.sql`
3. Run the entire SQL script

**This will:**
- Create all necessary tables
- Set up RLS policies
- Insert default roles (admin, user)
- Create the auto-assignment trigger

### Step 2: Seed the Database (Optional)

To migrate existing dummy data to Supabase:

```bash
# Install ts-node if not already installed
npm install -g ts-node

# Run the seed script
npx ts-node supabase/seed_data.ts
```

Or manually run the seed function from your code.

### Step 3: Test Admin Access

1. Sign up or log in with one of the admin emails:
   - `goyalchirag721@gmail.com`
   - `anuraggoyal231@gmail.com`

2. The trigger will automatically assign the `admin` role on account creation

3. Navigate to `/admin` to access the admin panel

### Step 4: Verify Setup

Check that:
- ✅ Non-admin users are redirected away from `/admin`
- ✅ Admin users see the dashboard at `/admin`
- ✅ You can create/edit/delete articles from the admin panel
- ✅ Changes reflect immediately in the public site

---

## 📝 Usage Guide

### Adding Content

1. Go to `/admin/articles` (or modules/videos/events/junior)
2. Click "New Article" button
3. Fill in the form:
   - Title, excerpt, content (HTML supported)
   - Category, tags, image URL
   - Toggle "Publish" to make it public
4. Click "Create Article"

### Managing A/B Tests

1. Go to `/admin/ab-tests`
2. Click "New Test"
3. Configure:
   - Name: e.g., "Homepage CTA Test"
   - Type: CTA, Avatar, Mascot, or Layout
   - Description: what you're testing
4. Add variants with different content/configurations
5. Click "Start" to begin the test

### Testing Avatar/Mascot Variations

For the A/B test of avatars (static vs dynamic motion graphic):

1. Create an A/B Test with type "avatar"
2. Add variants:
   - Control: Current static avatar config
   - Variant A: Dynamic motion graphic avatar config
3. Start the test
4. The `useABTestVariantForUser` hook will handle variant assignment
5. Use the variant data in your ChatbotWidget component

---

## 🔒 Security

### Row Level Security (RLS)

All tables have RLS enabled:
- **Public users**: Can only read published content
- **Authenticated users**: Can manage their own likes and activities
- **Admins**: Full CRUD access to all content

### Admin-only Access

The `/admin/*` routes are protected by `AdminProtectedRoute` which:
1. Checks if user is logged in
2. Verifies `isAdmin` from AuthContext
3. Redirects non-admins to home page

---

## 🧩 Key Files Reference

### Database
- `supabase/complete_schema.sql` - Complete database schema
- `supabase/seed_data.ts` - Migration script for existing data

### Hooks
- `src/hooks/useContent.ts` - All content CRUD operations
- `src/hooks/useABTesting.ts` - A/B testing management

### Components
- `src/components/admin/AdminLayout.tsx` - Admin sidebar layout
- `src/components/admin/ProtectedRoute.tsx` - Admin route guard

### Pages
- `src/pages/admin/AdminDashboard.tsx` - Dashboard overview
- `src/pages/admin/AdminArticles.tsx` - Articles list
- `src/pages/admin/ArticleEditor.tsx` - Article create/edit
- `src/pages/admin/AdminModules.tsx` - Modules list
- `src/pages/admin/AdminVideos.tsx` - Videos list
- `src/pages/admin/AdminEvents.tsx` - Events list
- `src/pages/admin/AdminJunior.tsx` - Junior content list
- `src/pages/admin/AdminABTests.tsx` - A/B tests management

### Auth
- `src/contexts/AuthContext.tsx` - Updated with role fetching

### Types
- `src/lib/types.ts` - Database types added

---

## 🔄 Next Steps

### For Frontend Integration:

Update your public-facing pages to use the server-side data:

```typescript
// Instead of importing from data.ts
import { DUMMY_POSTS } from '@/lib/data';

// Use the hook
import { useArticles } from '@/hooks/useContent';

function NewsletterPage() {
  const { data: articles, isLoading } = useArticles({ published: true });
  // ...
}
```

### For A/B Testing Integration:

```typescript
import { useABTestVariantForUser } from '@/hooks/useABTesting';
import { useAuth } from '@/contexts/AuthContext';

function ChatbotWidget() {
  const { user } = useAuth();
  const { data: variant } = useABTestVariantForUser('avatar-test', user?.id);
  
  // Use variant.content to determine which avatar to show
  const avatarType = variant?.content?.type || 'static';
  
  return (
    // Render based on avatarType
  );
}
```

---

## 🐛 Troubleshooting

### Issue: Admin access not working
- Check that the user has a record in `user_roles` table
- Verify `handle_new_user` trigger is working
- Check browser console for errors

### Issue: Content not loading
- Verify Supabase URL and key in `.env`
- Check RLS policies allow reading
- Check browser Network tab for API errors

### Issue: Can't create content
- Ensure user is admin (check `user_roles` table)
- Verify RLS policies allow inserts for admins
- Check for validation errors in form

---

## 📊 Analytics Views

The schema includes helpful views:
- `user_engagement_summary` - User activity stats
- `content_performance` - Content views/likes
- `daily_active_users` - DAU metrics

Query these from Supabase SQL Editor or your admin dashboard.

---

## ✅ Summary

All requested features have been implemented:

1. ✅ **Server-side data** - All content now lives in Supabase
2. ✅ **Two user types** - Admin and User roles with automatic assignment
3. ✅ **A/B Testing** - Full system for CTAs, avatars, and mascots
4. ✅ **Admin CRUD** - Complete content management panel at `/admin`
5. ✅ **Maximum Supabase usage** - All data stored in Supabase with RLS

**Microsoft Clarity** was excluded as requested.

---

For questions or issues, check the browser console and Supabase logs.
