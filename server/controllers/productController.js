const Product = require('../models/Product');
const StockLedger = require('../models/StockLedger');

// @route GET /api/products
const getProducts = async (req, res) => {
  try {
    const { category, department, itemType, search, lowStock } = req.query;
    const filter = { isActive: true };

    if (category)   filter.category   = category;
    if (department) filter.department = department;
    if (itemType)   filter.itemType   = itemType;
    if (search)     filter.itemName   = { $regex: search, $options: 'i' };

    let products = await Product.find(filter)
      .populate('category', 'name')
      .sort('itemName');

    // Attach stock levels
    products = await Promise.all(
      products.map(async (p) => {
        const stock = await StockLedger.getTotalAvailable(p._id);
        const obj = p.toObject();
        obj.stock = stock;
        obj.isLowStock = stock.totalAvailable <= p.lowStockThreshold;
        return obj;
      })
    );

    // Filter low stock only
    if (lowStock === 'true') products = products.filter((p) => p.isLowStock);

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/products/:id
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const stock = await StockLedger.getTotalAvailable(product._id);
    const ledgerEntries = await StockLedger.find({ itemId: product._id });

    res.json({ ...product.toObject(), stock, ledgerEntries });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/products
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Serial number already exists' });
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate('category', 'name');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id, { isActive: false }, { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/products/alerts/low-stock
const getLowStockAlerts = async (req, res) => {
  try {
    const items = await StockLedger.getLowStockItems();
    res.json({ count: items.length, items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct, getLowStockAlerts,
};
