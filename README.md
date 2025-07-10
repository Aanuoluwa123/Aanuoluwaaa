# Fintr

A comprehensive finance management application that helps users track their income, expenses, and budget across different categories.

## Features

- **User Authentication**: Secure login and registration
- **Transaction Management**: Add, view, and delete income and expense transactions
- **Budget Categories**: Create custom categories with budget limits
- **Financial Reports**: Visualize your financial data with charts and summaries
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Visualization**: Chart.js
- **Deployment**: Vercel

## Development Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account (for database and authentication)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/finance-tracker.git
   cd finance-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the project root with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Development Mode

The application includes a development mode that works without Supabase credentials:

- When running on localhost, you can use the "Development Mode Login" button
- Sample data is provided for demonstration purposes
- Changes are saved to localStorage and persist between page refreshes

## Database Setup

The application requires the following tables in your Supabase database:

### Categories Table
```sql
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  budget_limit numeric NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for user access
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  category_id uuid REFERENCES categories(id) NULL
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for user access
```

## Production Deployment

### Deploying to Vercel

1. Create a production environment file:
   ```bash
   cp .env .env.production
   ```

2. Update `.env.production` with your production Supabase credentials.

3. Deploy to Vercel:
   ```bash
   vercel
   ```

### Environment Variables

Set the following environment variables in your deployment platform:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_APP_MODE`: Set to `production`

## License

[MIT](LICENSE)

## Acknowledgments

- Developed by ASHIYANBI AANUOLUWA HIKMAT 