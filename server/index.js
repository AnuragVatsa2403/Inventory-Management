onst express   = require('express');
const cors      = require('cors');
const morgan    = require('morgan');
const dotenv    = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const { startAlertScheduler } = require('./services/scheduler');

const app = express();

// Allow any localhost port (dev) or CLIENT_URL (prod)
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    } else if (origin === process.env.CLIENT_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api/auth',       require('./routes/authRoutes'));
app.use('/api/products',   require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/suppliers',  require('./routes/supplierRoutes'));
app.use('/api/orders',     require('./routes/orderRoutes'));
app.use('/api/sales',      require('./routes/saleRoutes'));
app.use('/api/alerts',     require('./routes/alertRoutes'));
app.use('/api/pdf',        require('./routes/pdfRoutes'));
app.use('/api/reorder',    require('./routes/reorderRoutes'));
app.use('/api/users',      require('./routes/userRoutes'));
app.use('/api/gst',        require('./routes/gstRoutes'));

app.get('/', (req, res) => res.json({
  message: 'StockHive API running',
  company: 'Polytime Industries',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
}));

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error(`[StockHive Error] ${err.message}`);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('');
  console.log('  ███████╗████████╗ ██████╗  ██████╗██╗  ██╗██╗  ██╗██╗██╗   ██╗███████╗');
  console.log('  ██╔════╝╚══██╔══╝██╔═══██╗██╔════╝██║ ██╔╝██║  ██║██║██║   ██║██╔════╝');
  console.log('  ███████╗   ██║   ██║   ██║██║     █████╔╝ ███████║██║██║   ██║█████╗  ');
  console.log('  ╚════██║   ██║   ██║   ██║██║     ██╔═██╗ ██╔══██║██║╚██╗ ██╔╝██╔══╝  ');
  console.log('  ███████║   ██║   ╚██████╔╝╚██████╗██║  ██╗██║  ██║██║ ╚████╔╝ ███████╗');
  console.log('  ╚══════╝   ╚═╝    ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝  ╚══════╝');
  console.log('');
  console.log('  Polytime Industries · Inventory System');
  console.log(`  Server  → http://localhost:${PORT}`);
  console.log(`  MongoDB → ${process.env.MONGO_URI}`);
  console.log(`  CORS    → any localhost port allowed`);
  console.log('');
  startAlertScheduler(Number(process.env.ALERT_SCAN_INTERVAL_MIN) || 30);
});
