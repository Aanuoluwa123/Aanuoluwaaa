# Finance Tracker

A simple yet powerful financial management application that helps you track your income and expenses, create budget categories, and visualize your financial data.

## Features

- User authentication with Supabase
- Income and expense tracking
- Budget categories with spending limits
- Financial reports and visualizations
- Responsive design for mobile and desktop

## Tech Stack

- React with TypeScript
- Tailwind CSS for styling
- Chart.js for data visualization
- Supabase for backend and database

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Supabase account

### Supabase Setup

1. Create a new Supabase project at [https://app.supabase.com](https://app.supabase.com)
2. In your Supabase project, go to SQL Editor and run the migration scripts from the `supabase/migrations` folder
3. Enable Email Auth in Authentication settings
4. Get your Supabase URL and anon key from the API settings

### Local Development

1. Clone the repository
   ```
   git clone <repository-url>
   cd finance-tracker
   ```

2. Install dependencies
   ```
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server
   ```
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Deployment

### Vercel Deployment

1. Fork or clone this repository to your GitHub account
2. Sign up for [Vercel](https://vercel.com) if you haven't already
3. Create a new project in Vercel and import your GitHub repository
4. Add the following environment variables in the Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy the project

### Netlify Deployment

1. Fork or clone this repository to your GitHub account
2. Sign up for [Netlify](https://netlify.com) if you haven't already
3. Create a new site in Netlify and import your GitHub repository
4. Add the following environment variables in the Netlify site settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy the site

## Usage

1. Sign up for an account
2. Create budget categories for your income and expenses
3. Add transactions and assign them to categories
4. View your financial reports and track your spending against budget limits

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 