# FedEx Tracking System

A static mirror of the FedEx tracking system with:
- User signup/login
- Package tracking with Supabase backend
- Admin portal for managing trackings
- Image upload support

## Features

- ✅ User authentication (signup/login)
- ✅ Package tracking with progress timeline
- ✅ Admin dashboard for managing all trackings
- ✅ Image upload for proof of delivery
- ✅ FedEx-style design with captured CSS/fonts

## Setup

### Supabase Configuration

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema in Supabase Dashboard → SQL Editor
3. Create an admin user in Authentication → Users
4. Create a Storage bucket named `tracking-proofs`

### Environment Variables

Create a `.env` file (optional) or update the HTML files with:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Deploy to Netlify

1. Connect this repo to Netlify
2. Set publish directory to `/`
3. Deploy

## File Structure

```
├── index.html              # Homepage
├── tracking-user.html      # Customer tracking page
├── admin-portal.html       # Admin dashboard
├── css/                    # Stylesheets
├── images/                 # Icons and images
└── fonts/                  # FedExSans fonts
```

## Testing

- **User**: Sign up → Login → Track shipment → See progress
- **Admin**: Login as `admin@fedex-tracking.local` / `Admin123!` → Manage trackings
