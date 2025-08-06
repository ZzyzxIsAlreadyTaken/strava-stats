# Strava Stats App Setup

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

> **Note**: The app uses server-side data fetching with cookies for authentication and direct database calls for data, eliminating the need for internal API requests. For OAuth redirects, it dynamically detects the base URL using environment variables like `VERCEL_URL` or `NEXTAUTH_URL`.

```env
# Strava OAuth Configuration
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret

# Auth Configuration
AUTH_SECRET=your_auth_secret_key_here

# Database Configuration
DATABASE_URL=your_neon_database_url

# App Configuration (optional - will be auto-detected)
NEXTAUTH_URL=http://localhost:3000
```

## Setup Steps

1. **Create a Strava App**:
   - Go to https://www.strava.com/settings/api
   - Create a new application
   - Set the Authorization Callback Domain to `localhost`
   - Copy the Client ID and Client Secret

2. **Set up your database**:
   - Run `npm run db:push` to create the database tables
   - Run `npm run db:studio` to view your database

3. **Generate AUTH_SECRET**:
   - Run `openssl rand -base64 32` to generate a secure secret

4. **Configure Strava App**:
   - Set the Authorization Callback Domain to `localhost` for development
   - For production, set it to your domain (e.g., `yourdomain.com`)

5. **Start the development server**:
   - Run `npm run dev`

## Next Steps

### 1. Add Charts and Graphs

Install a charting library like Chart.js or Recharts:

```bash
npm install recharts
```

### 2. Implement Friend Comparison

- Add friend selection UI
- Fetch friends' activities from Strava API
- Create comparison charts

### 3. Add Time Period Filtering

- Implement date range selection
- Filter activities by time period
- Add weekly/monthly/yearly views

### 4. Add More Stats

- Average pace
- Elevation gain
- Personal records
- Progress tracking

### 5. Add Social Features

- Share achievements
- Challenge friends
- Leaderboards

## Current Features

✅ Strava OAuth authentication
✅ User profile display
✅ Activity syncing from Strava
✅ Basic stats display (activities, distance, time)
✅ Recent activities list
✅ Database storage for users and activities

## API Endpoints

- `GET /api/auth/session` - Get current session
- `POST /api/sync` - Sync user data and activities from Strava
- `GET /api/stats` - Get user statistics
- `GET /api/auth/signin` - Sign in with Strava
- `GET /api/auth/signout` - Sign out
