# Cloud VM Comparison Frontend

A modern React-based frontend for the Cloud VM Comparison API. This application provides an intuitive interface for browsing, comparing, and getting recommendations for virtual machines across multiple cloud providers.

## Features

### 🔍 VM Browser
- Browse thousands of VMs across 15+ cloud providers
- Advanced filtering by CPU, memory, GPU, price, region, and more
- Real-time search with instant results
- Grid and list view modes
- Select multiple VMs for comparison

### ⚖️ VM Comparison
- Side-by-side comparison of VM specifications
- Detailed comparison tables
- Summary insights (cheapest, most powerful, best value)
- Visual comparison cards
- Export comparison results

### 💡 Smart Recommendations
- AI-powered VM recommendations based on workload requirements
- Customizable criteria (CPU, memory, GPU, budget, regions)
- Workload type optimization (compute, memory, GPU, balanced)
- Scoring system with detailed reasoning
- Tips and best practices

### 📊 Statistics Dashboard
- Real-time statistics and analytics
- Interactive charts and visualizations
- Provider distribution analysis
- Price range analysis
- GPU availability metrics

### ⚙️ Admin Panel
- System health monitoring
- Database management
- Data reload functionality
- Preview database contents
- API status monitoring

## Technology Stack

- **React 18** - Modern React with hooks and functional components
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Charts and data visualization
- **Lucide React** - Beautiful icons
- **Axios** - HTTP client for API calls

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- The backend API running on `http://localhost:8000`

### Installation

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

### Environment Configuration

Create a `.env` file in the frontend directory to customize the API URL:

```env
REACT_APP_API_URL=http://localhost:8000
```

## Project Structure

```
frontend/
├── public/
│   ├── index.html          # HTML template
│   └── ...
├── src/
│   ├── components/         # Reusable components
│   │   ├── Common/         # Common UI components
│   │   ├── Layout/         # Layout components
│   │   └── VMs/           # VM-specific components
│   ├── pages/             # Page components
│   │   ├── VMBrowser.jsx   # Main VM browsing page
│   │   ├── VMCompare.jsx   # VM comparison page
│   │   ├── VMRecommendations.jsx # Recommendations page
│   │   ├── Statistics.jsx  # Statistics dashboard
│   │   └── Admin.jsx      # Admin panel
│   ├── services/          # API services
│   │   └── api.js         # API client and endpoints
│   ├── App.jsx            # Main app component
│   ├── index.js           # App entry point
│   └── index.css          # Global styles
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind configuration
└── README.md             # This file
```

## Key Components

### VMCard
Displays VM information in a card format with:
- Provider and instance type
- CPU, memory, and GPU specifications
- Pricing information (on-demand and spot)
- Region and availability zone
- Selection for comparison

### VMFilters
Advanced filtering interface with:
- Provider selection
- Resource requirements (CPU, memory)
- GPU filtering
- Price range
- Region selection
- Sorting options

### Layout Components
- **Header**: Navigation with responsive design
- **Layout**: Main layout wrapper with consistent styling

## API Integration

The frontend communicates with the backend API through:

- **GET /vms** - Browse and filter VMs
- **POST /vms/compare** - Compare selected VMs
- **POST /vms/recommendations** - Get VM recommendations
- **GET /stats** - Fetch statistics
- **GET /health** - Health check
- **POST /reload** - Reload data (admin)

## Styling

The application uses Tailwind CSS with:
- Custom color palette (primary blue theme)
- Responsive design for mobile, tablet, and desktop
- Custom component classes for consistency
- Dark mode support (can be extended)

## State Management

- **React Query** for server state management
- **Local State** with React hooks for UI state
- **localStorage** for persisting comparison selections

## Performance Optimizations

- **Code Splitting** with React.lazy (can be added)
- **Memoization** with React.memo for expensive components
- **Query Caching** with React Query
- **Debounced Search** for filter inputs
- **Virtual Scrolling** for large lists (can be added)

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Code Style

- **ESLint** for code linting
- **Prettier** for code formatting (can be added)
- **Functional Components** with hooks
- **TypeScript** support (can be added)

## Deployment

### Build for Production

```bash
npm run build
```

This creates a `build` folder with optimized production files.

### Deployment Options

1. **Static Hosting** (Netlify, Vercel, GitHub Pages)
2. **Docker** (create Dockerfile)
3. **Traditional Web Server** (Apache, Nginx)

### Environment Variables

For production, set:
- `REACT_APP_API_URL` - Backend API URL

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **API Connection Error**
   - Ensure backend is running on `http://localhost:8000`
   - Check CORS configuration
   - Verify API URL in environment variables

2. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

3. **Styling Issues**
   - Ensure Tailwind CSS is properly configured
   - Check for conflicting CSS

### Performance Issues

- Enable React DevTools Profiler
- Check network tab for slow API calls
- Monitor bundle size with webpack-bundle-analyzer

## Future Enhancements

- [ ] Dark mode toggle
- [ ] Export functionality (CSV, PDF)
- [ ] Saved searches and favorites
- [ ] Real-time price alerts
- [ ] Advanced charts and analytics
- [ ] Mobile app (React Native)
- [ ] Offline support with service workers
- [ ] Multi-language support (i18n)

## License

This project is part of the Cloud VM Comparison API system. See the main project README for license information.
