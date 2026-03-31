# fanzzer Dashboard

Admin dashboard frontend for the fanzzer.com creator monetization platform.

## Architecture

- **Framework**: React 19 + Vite 6
- **Routing**: React Router 6 (client-side)
- **Authentication**: Clerk React
- **Styling**: Tailwind CSS 4 + Custom dark theme
- **Icons**: Heroicons v2
- **API**: Connects to standalone Admin Service
- **Deployment**: Cloudflare Pages

## Features

- **User Management** - User accounts, roles, and permissions
- **Creator Management** - Creator verification, tiers, and analytics  
- **Content Moderation** - Content review, flags, and policy enforcement
- **Subscription Management** - Payment tracking, billing, and revenue analytics
- **Platform Analytics** - Growth metrics, performance insights, and reporting

## Development  

```bash
# Install dependencies
npm install

# Run locally (connects to deployed admin service)
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

## Environment Variables

Create `.env.local` for development or `.env.production` for deployment:

```bash
# Admin API Base URL - points to admin microservice
VITE_ADMIN_API_BASE_URL=https://fanzzer-admin.dlouis20.workers.dev

# Main app URL for navigation  
VITE_MAIN_APP_URL=https://www.fanzzer.com

# Clerk authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_key_here

# Domain configuration
VITE_DOMAIN=fanzzer.com
```

## Architecture

The dashboard is a standalone React SPA that communicates with the admin microservice via REST APIs. It handles authentication via Clerk and maintains no server-side dependencies on the main app.

### Key Components

- **AdminLayout** - Main layout with sidebar navigation and auth
- **Admin Pages** - Users, Creators, Content, Subscriptions, Analytics  
- **API Client** - Centralized admin service communication
- **Context Providers** - Sidebar state, date filtering, authentication

## Authentication

Uses Clerk React with admin role verification. The admin service validates permissions server-side.

## Deployment

Automated via GitHub Actions on push to main branch.

Manual deployment:
```bash
npm run build
npx wrangler pages deploy dist --project-name fanzzer-dashboard
```

## Live Dashboard

- **Production**: https://main.fanzzer-dashboard.pages.dev
- **Latest Deployment**: https://4d3dd5ef.fanzzer-dashboard.pages.dev

## Theme

Custom dark-first theme with fanzzer.com branding:
- Primary: `#914BF1` (purple)
- Backgrounds: `#272829`, `#1f1f21`, `#1a1a1f` 
- Text: `#FFFFFF`, `#D9D9D9`, `#A0A0A0`
