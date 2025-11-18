# Frontend

This is the React frontend for UniDocs.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
echo "VITE_API_URL=http://localhost:8001" > .env
```

3. Run in development mode:
```bash
npm run dev
```

The app will be available at http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code

## Project Structure

```
src/
├── App.tsx            # Main app component
├── main.tsx           # Entry point
├── pages/             # Page components
├── components/        # Reusable components
├── contexts/          # React contexts (AuthContext, etc.)
├── hooks/             # Custom React hooks
├── services/          # API service layer
├── utils/             # Helper functions
└── types/             # TypeScript types
```

## Features

- Authentication (login/register)
- Student dashboard
- Pedagogue dashboard
- Admin dashboard
- Document generation
- Document verification via QR code
- Responsive design with TailwindCSS

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:8001)
