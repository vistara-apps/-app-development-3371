# EcoStyle Match 🌱

> Discover eco-friendly fashion that perfectly matches your style.

EcoStyle Match is a Web3-native application that helps users find stylish, eco-friendly clothing by matching their personal style preferences with sustainable brands. Built as a Base Mini App with AI-powered recommendations and micro-transaction payments.

![EcoStyle Match Preview](https://via.placeholder.com/800x400/667eea/ffffff?text=EcoStyle+Match+Preview)

## ✨ Features

### Core Features
- **🎨 Style Profile Creation**: Input preferred brands, fits, aesthetics, and color palettes
- **🤖 AI-Powered Recommendations**: Personalized eco-friendly clothing suggestions using OpenAI
- **🌍 Eco-Impact Transparency**: Clear environmental impact information for each recommendation
- **💳 Micro-Transactions**: Pay-per-use model with $0.50 per recommendation
- **📦 Bundle Pricing**: Discounted bundles for frequent users
- **🔗 Wallet Integration**: Seamless Web3 payments via RainbowKit/Wagmi

### Advanced Features
- **📊 User Analytics**: Track your sustainable fashion journey
- **🎯 Quality Scoring**: AI-powered recommendation quality assessment
- **🏆 User Tiers**: Unlock benefits as you engage more with sustainable fashion
- **📱 Farcaster Integration**: Share recommendations and connect with the community
- **💾 Data Persistence**: Supabase backend for user profiles and history

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for data persistence)
- OpenAI API key (or OpenRouter)
- Neynar API key (for Farcaster integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vistara-apps/-app-development-3371.git
   cd -app-development-3371
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your API keys in `.env`:
   ```env
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_NEYNAR_API_KEY=your_neynar_api_key
   ```

4. **Set up Supabase database**
   
   Run these SQL commands in your Supabase SQL editor:
   ```sql
   -- User profiles table
   CREATE TABLE user_profiles (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id TEXT UNIQUE NOT NULL,
     style_preferences JSONB NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Recommendations table
   CREATE TABLE recommendations (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id TEXT NOT NULL,
     brand_name TEXT NOT NULL,
     item_name TEXT NOT NULL,
     description TEXT,
     eco_impact_summary TEXT,
     style_match TEXT,
     estimated_price TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Payments table
   CREATE TABLE payments (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id TEXT NOT NULL,
     amount TEXT NOT NULL,
     payment_method TEXT DEFAULT 'wallet',
     status TEXT DEFAULT 'completed',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS with custom design system
- **Web3**: RainbowKit + Wagmi + Viem
- **AI**: OpenAI API (via OpenRouter)
- **Database**: Supabase (PostgreSQL)
- **Social**: Farcaster (Neynar API)
- **Payments**: x402-axios for micro-transactions
- **Deployment**: Vercel

### Project Structure
```
src/
├── components/          # React components
│   ├── ErrorBoundary.jsx
│   ├── EcoTag.jsx
│   ├── PaymentModal.jsx
│   ├── ProfileForm.jsx
│   └── RecommendationCard.jsx
├── hooks/              # Custom React hooks
│   └── usePaymentContext.js
├── services/           # API and business logic
│   ├── businessLogic.js
│   ├── farcaster.js
│   ├── openai.js
│   └── supabase.js
├── App.jsx            # Main application component
├── main.jsx           # Application entry point
└── index.css          # Global styles
```

## 💰 Business Model

### Pricing Structure
- **Free**: 1 recommendation per user
- **Pay-per-use**: $0.50 per additional recommendation
- **Bundle 12**: $5.00 (save $1.00)
- **Bundle 25**: $10.00 (save $2.50)
- **Monthly Unlimited**: $15.00

### User Tiers
- **Starter**: Basic recommendations
- **Explorer**: Style tracking + impact metrics (5% discount)
- **Advanced**: Analytics + brand insights (10% discount)
- **Premium**: Priority support + exclusive features (15% discount)

## 🔧 Configuration

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_OPENAI_API_KEY` | OpenAI or OpenRouter API key | Yes |
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_NEYNAR_API_KEY` | Neynar API key for Farcaster | Optional |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID | Pre-configured |
| `VITE_PAYMENT_API_URL` | Payment service URL | Pre-configured |

### Design System
The app uses a custom design system defined in `tailwind.config.js`:

```javascript
colors: {
  primary: 'hsl(130, 70%, 45%)',    // Green
  accent: 'hsl(170, 80%, 50%)',     // Teal
  surface: 'hsl(0, 0%, 100%)',      // White
  'text-primary': 'hsl(0, 0%, 15%)', // Dark gray
  'text-secondary': 'hsl(0, 0%, 45%)' // Medium gray
}
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
# Upload dist/ folder to your hosting provider
```

### Docker
```bash
docker build -t ecostyle-match .
docker run -p 3000:3000 ecostyle-match
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### E2E Testing
```bash
npm run test:e2e
```

## 📊 Analytics & Monitoring

### Built-in Analytics
- User engagement metrics
- Recommendation quality scoring
- Revenue tracking
- A/B testing framework

### Error Monitoring
The app includes error boundaries and logging. In production, integrate with:
- Sentry for error tracking
- LogRocket for session replay
- PostHog for product analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all checks pass before submitting PR

## 📝 API Documentation

### OpenAI Integration
The app uses OpenAI's GPT models to generate personalized fashion recommendations based on user style profiles.

### Supabase Schema
- `user_profiles`: Store user style preferences
- `recommendations`: Track generated recommendations
- `payments`: Log payment transactions

### Farcaster Integration
- User authentication via Farcaster ID
- Social graph analysis for enhanced personalization
- Cast sharing for viral growth

## 🔒 Security

- Environment variables for sensitive data
- Input validation and sanitization
- Secure wallet connections via RainbowKit
- Rate limiting on API endpoints
- HTTPS enforcement in production

## 📈 Performance

- Lazy loading of components
- Image optimization
- Bundle splitting
- CDN deployment via Vercel
- Caching strategies for API calls

## 🐛 Troubleshooting

### Common Issues

**Build fails with "Module not found"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Wallet connection issues**
- Ensure WalletConnect project ID is set
- Check browser wallet extension is installed
- Try refreshing the page

**API errors**
- Verify all environment variables are set
- Check API key permissions
- Monitor rate limits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com) for AI-powered recommendations
- [Supabase](https://supabase.com) for backend infrastructure
- [RainbowKit](https://rainbowkit.com) for Web3 integration
- [Farcaster](https://farcaster.xyz) for social features
- [Tailwind CSS](https://tailwindcss.com) for styling

## 📞 Support

- 📧 Email: support@ecostyle-match.com
- 💬 Discord: [Join our community](https://discord.gg/ecostyle-match)
- 🐦 Twitter: [@EcoStyleMatch](https://twitter.com/EcoStyleMatch)
- 📖 Documentation: [docs.ecostyle-match.com](https://docs.ecostyle-match.com)

---

Made with 💚 for sustainable fashion and Web3 innovation.
