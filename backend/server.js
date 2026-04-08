const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const QRCode = require('qrcode');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('/tmp'));

if (!fs.existsSync('/tmp')) {
    fs.mkdirSync('/tmp');
}

// ==========================================
// 1. MODELS
// ==========================================
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw err;
    }
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
const User = mongoose.model('User', userSchema);

const repairHistorySchema = new mongoose.Schema({
    date: { type: Date, required: true },
    description: { type: String, required: true },
    cost: { type: Number, default: 0 },
    serviceCenter: { type: String }
});

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    purchaseDate: { type: Date, required: true },
    warrantyPeriodMonths: { type: Number, required: true },
    billImageUrl: { type: String, required: false },
    serviceCenterDetails: { type: String, required: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    qrCodeDataUrl: { type: String, required: false },
    repairHistory: [repairHistorySchema]
}, { timestamps: true });

productSchema.virtual('warrantyExpiryDate').get(function () {
    if (!this.purchaseDate || !this.warrantyPeriodMonths) return null;
    const expiry = new Date(this.purchaseDate);
    expiry.setMonth(expiry.getMonth() + this.warrantyPeriodMonths);
    return expiry;
});
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });
const Product = mongoose.model('Product', productSchema);

// ==========================================
// 2. MIDDLEWARE
// ==========================================
const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const storage = multer.diskStorage({
    destination: '/tmp',
    filename: function (req, file, cb) {
        cb(null, 'bill-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|pdf/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images and PDFs Only!');
        }
    }
}).single('billImage');

// ==========================================
// 3. ROUTES
// ==========================================

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) return res.status(400).json({ message: 'User with this email or username already exists' });

        user = new User({ username, email, password });
        await user.save();

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({ token, user: { id: user.id, username, email } });
        });
    } catch (err) {
        require("fs").writeFileSync("error.log", err.stack || err.message); console.error(err.message);
        res.status(500).send('Server error');
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.status(200).json({ token, user: { id: user.id, username: user.username, email: user.email } });
        });
    } catch (err) {
        require("fs").writeFileSync("error.log", err.stack || err.message); console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Product Routes
app.post('/api/products', authMiddleware, (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ message: err });
        try {
            const { name, brand, purchaseDate, warrantyPeriodMonths, serviceCenterDetails } = req.body;
            const newProduct = new Product({
                name, brand, purchaseDate, warrantyPeriodMonths, serviceCenterDetails,
                owner: req.user.id,
                billImageUrl: req.file ? `/uploads/${req.file.filename}` : null
            });

            const productUrl = `http://localhost:5173/product/${newProduct._id}`;
            newProduct.qrCodeDataUrl = await QRCode.toDataURL(productUrl);
            await newProduct.save();
            res.status(201).json(newProduct);
        } catch (error) {
            console.error(error);
            res.status(500).send('Server Error');
        }
    });
});

app.get('/api/products', authMiddleware, async (req, res) => {
    try {
        const products = await Product.find({ owner: req.user.id }).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

app.get('/api/products/:id', authMiddleware, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Product not found' });
        res.status(500).send('Server Error');
    }
});

app.post('/api/products/:id/repair', authMiddleware, async (req, res) => {
    try {
        const { date, description, cost, serviceCenter } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        if (product.owner.toString() !== req.user.id) return res.status(401).json({ message: 'User not authorized' });

        product.repairHistory.unshift({ date, description, cost, serviceCenter });
        await product.save();
        res.json(product);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

app.put('/api/products/:id/transfer', authMiddleware, async (req, res) => {
    try {
        const { newOwnerEmail } = req.body;
        const newOwner = await User.findOne({ email: newOwnerEmail });
        if (!newOwner) return res.status(404).json({ message: 'User with this email not found' });

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        if (product.owner.toString() !== req.user.id) return res.status(401).json({ message: 'User not authorized' });

        product.owner = newOwner._id;
        await product.save();
        res.json({ message: 'Product transfer successful', product });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

app.get('/', (req, res) => {
    res.send('Digital Product Passport API is running (Simplified Single File)');
});

// ==========================================
// 4. DATABASE CONNECTION & SERVER START
// ==========================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully to ONLINE database (Atlas)');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => console.error('❌ MongoDB connection error:', err));

module.exports = app;

