import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { LogOut, PlusCircle, LayoutDashboard, LogIn, UserPlus, Upload, ShieldCheck, ShieldAlert, Calendar, PackageOpen, QrCode, FileText, Settings, FileKey2, Copy, Send } from 'lucide-react';

// ==========================================
// 1. API CONFIGURATION
// ==========================================
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = axios.create({
  baseURL: `${BACKEND_URL}/api`, // Dynamic Backend URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ==========================================
// 2. REUSABLE COMPONENTS (NAVBAR)
// ==========================================
const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container flex-between">
        <Link to="/dashboard" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🛂 Digital Passport
        </Link>
        <div className="nav-links">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Hi, {user.username}
          </span>
          <Link to="/dashboard" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link to="/add-product" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
            <PlusCircle size={18} /> Add Product
          </Link>
          <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.5rem 1rem' }}>
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

// ==========================================
// 3. PAGES
// ==========================================

// --- LOGIN PORTION ---
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-container auth-form animate-fade-in">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to manage your digital passports</p>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in...' : (<><LogIn size={20} /> Sign In</>)}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

// --- REGISTER PORTION ---
const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', { username, email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-container auth-form animate-fade-in">
        <div className="auth-header">
          <h2>Create Passport</h2>
          <p>Join to secure your product warranties and bills</p>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Registering...' : (<><UserPlus size={20} /> Register</>)}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  );
};

// --- DASHBOARD PORTION ---
const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const getWarrantyStatus = (product) => {
    const isExpired = new Date() > new Date(product.warrantyExpiryDate);
    if (isExpired) {
      return (
        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <ShieldAlert size={12} /> Expired
        </span>
      );
    }
    return (
      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <ShieldCheck size={12} /> Active
      </span>
    );
  };

  return (
    <div>
      <Navbar />
      <div className="container animate-fade-in" style={{ paddingBottom: '3rem' }}>
        <div className="flex-between">
          <h2>My Digital Passports</h2>
          <span style={{ color: 'var(--text-secondary)' }}>Total: {products.length} Products</span>
        </div>

        {loading ? (
          <div className="flex-center" style={{ minHeight: '300px' }}>Loading passports...</div>
        ) : products.length === 0 ? (
          <div className="glass-container flex-center" style={{ marginTop: '2rem', minHeight: '300px', flexDirection: 'column' }}>
            <PackageOpen size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
            <h3>No products found</h3>
            <p style={{ marginBottom: '1.5rem' }}>You haven't digitalized any product passports yet.</p>
            <Link to="/add-product" className="btn btn-primary">Add Your First Product</Link>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <div key={product._id} className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{product.name}</h3>
                  {getWarrantyStatus(product)}
                </div>
                <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Brand:</strong> {product.brand}
                </p>
                <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                  <Calendar size={16} /> Bought: {new Date(product.purchaseDate).toLocaleDateString()}
                </p>
                <div className="flex-between">
                  {product.qrCodeDataUrl ? (
                    <img src={product.qrCodeDataUrl} alt="QR Code" style={{ width: '50px', height: '50px', background: 'white', padding: '2px', borderRadius: '4px' }} />
                  ) : <div />}
                  <Link to={`/product/${product._id}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    View Passport
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- ADD PRODUCT PORTION ---
const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', brand: '', purchaseDate: '', warrantyPeriodMonths: '', serviceCenterDetails: '' });
  const [billImage, setBillImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const submitData = new FormData();
    Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
    if (billImage) submitData.append('billImage', billImage);

    try {
      await api.post('/products', submitData, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container animate-fade-in" style={{ paddingBottom: '3rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="flex-between align-center" style={{ marginBottom: '2rem' }}>
            <h2>Register New Digital Passport</h2>
          </div>
          <div className="glass-container">
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit} encType="multipart/form-data">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Product Name</label>
                  <input type="text" className="form-control" name="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Brand</label>
                  <input type="text" className="form-control" name="brand" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Date of Purchase</label>
                  <input type="date" className="form-control" name="purchaseDate" value={formData.purchaseDate} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Warranty Period (months)</label>
                  <input type="number" className="form-control" name="warrantyPeriodMonths" value={formData.warrantyPeriodMonths} onChange={e => setFormData({ ...formData, warrantyPeriodMonths: e.target.value })} required min="0" />
                </div>
              </div>
              <div className="form-group">
                <label>Service Center Information</label>
                <textarea className="form-control" name="serviceCenterDetails" value={formData.serviceCenterDetails} onChange={e => setFormData({ ...formData, serviceCenterDetails: e.target.value })} rows="3"></textarea>
              </div>
              <div className="form-group" style={{ marginTop: '2rem', padding: '1.5rem', border: '1px dashed var(--glass-border)', borderRadius: '8px', textAlign: 'center', background: 'rgba(0,0,0,0.1)' }}>
                <label htmlFor="billUpload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <Upload size={32} color="var(--primary-color)" />
                  <span style={{ fontSize: '1rem', fontWeight: '500' }}>{billImage ? billImage.name : "Upload Original Bill / Invoice (Optional)"}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>JPG, PNG or PDF up to 5MB</span>
                </label>
                <input id="billUpload" type="file" name="billImage" accept="image/jpeg, image/png, application/pdf" onChange={e => setBillImage(e.target.files[0])} style={{ display: 'none' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Adding Passport...' : (<><PlusCircle size={20} /> Convert to Digital</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- PRODUCT DETAILS PORTION ---
const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [repairData, setRepairData] = useState({ date: '', description: '', cost: '', serviceCenter: '' });
  const [showRepairForm, setShowRepairForm] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferMsg, setTransferMsg] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchProductDetails = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data);
    } catch (err) {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProductDetails(); }, [id]);

  const handleAddRepair = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/products/${id}/repair`, repairData);
      setRepairData({ date: '', description: '', cost: '', serviceCenter: '' });
      setShowRepairForm(false);
      fetchProductDetails();
    } catch (err) { console.error(err); }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/products/${id}/transfer`, { newOwnerEmail: transferEmail });
      setTransferMsg('Product successfully transferred!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setTransferMsg(err.response?.data?.message || 'Transfer failed');
    }
  };

  if (loading) return <div><Navbar /><div className="flex-center" style={{ minHeight: '80vh' }}>Loading...</div></div>;
  if (!product) return null;

  const isOwner = product.owner.toString() === currentUser.id;
  const isExpired = new Date() > new Date(product.warrantyExpiryDate);

  return (
    <div>
      <Navbar />
      <div className="container animate-fade-in" style={{ paddingBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>{product.name}</h2>
            <p style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge" style={{ background: 'var(--primary-color)' }}>{product.brand}</span>
              {isExpired ? (
                <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><ShieldAlert size={12} /> Expired</span>
              ) : (
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><ShieldCheck size={12} /> Active</span>
              )}
            </p>
          </div>
        </div>

        <div className="product-detail-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-container">
              <h3><FileText size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Passport Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                <div><p><strong>Purchase Date:</strong></p><p>{new Date(product.purchaseDate).toLocaleDateString()}</p></div>
                <div><p><strong>Warranty Period:</strong></p><p>{product.warrantyPeriodMonths} Months</p></div>
                {product.serviceCenterDetails && <div style={{ gridColumn: 'span 2' }}><p><strong>Service Center Info:</strong></p><p>{product.serviceCenterDetails}</p></div>}
              </div>
              {product.billImageUrl && (
                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                  <h4>Original Invoice</h4>
                  <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${product.billImageUrl}`} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ marginTop: '1rem' }}><FileText size={18} /> View Bill</a>
                </div>
              )}
            </div>

            <div className="glass-container">
              <div className="flex-between">
                <h3><Settings size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Repair History</h3>
                {isOwner && <button className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }} onClick={() => setShowRepairForm(!showRepairForm)}>Add Repair</button>}
              </div>
              {showRepairForm && (
                <form onSubmit={handleAddRepair} style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
                  <div className="form-group"><label>Date</label><input type="date" className="form-control" value={repairData.date} onChange={e => setRepairData({ ...repairData, date: e.target.value })} required /></div>
                  <div className="form-group"><label>Description</label><input type="text" className="form-control" value={repairData.description} onChange={e => setRepairData({ ...repairData, description: e.target.value })} required /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group"><label>Cost ($)</label><input type="number" className="form-control" value={repairData.cost} onChange={e => setRepairData({ ...repairData, cost: e.target.value })} /></div>
                    <div className="form-group"><label>Service Center</label><input type="text" className="form-control" value={repairData.serviceCenter} onChange={e => setRepairData({ ...repairData, serviceCenter: e.target.value })} /></div>
                  </div>
                  <button type="submit" className="btn btn-primary btn-block">Save Repair Log</button>
                </form>
              )}
              {product.repairHistory.length > 0 ? (
                <div style={{ marginTop: '1.5rem' }}>
                  {product.repairHistory.map((repair, idx) => (
                    <div key={idx} style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                      <div><strong>{repair.description}</strong><p style={{ fontSize: '0.85rem' }}>{new Date(repair.date).toLocaleDateString()} • {repair.serviceCenter}</p></div>
                      <div style={{ fontWeight: 'bold' }}>${repair.cost}</div>
                    </div>
                  ))}
                </div>
              ) : <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>No repairs logged yet.</p>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-container flex-center" style={{ flexDirection: 'column' }}>
              <h3 style={{ alignSelf: 'flex-start', marginBottom: '1.5rem' }}><QrCode size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Scanner Auth</h3>
              <div className="qr-container"><img src={product.qrCodeDataUrl} alt="Product QR Code" /></div>
            </div>
            {isOwner && (
              <div className="glass-container">
                <h3><Send size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Transfer Ownership</h3>
                {transferMsg && <div className="error-message">{transferMsg}</div>}
                <form onSubmit={handleTransfer} style={{ marginTop: '1.5rem' }}>
                  <div className="form-group"><input type="email" className="form-control" value={transferEmail} onChange={e => setTransferEmail(e.target.value)} required placeholder="recipient@email.com" /></div>
                  <button type="submit" className="btn btn-danger btn-block"><FileKey2 size={18} /> Transfer Now</button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. MAIN APP ROUTER
// ==========================================
const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/add-product" element={<PrivateRoute><AddProduct /></PrivateRoute>} />
        <Route path="/product/:id" element={<PrivateRoute><ProductDetails /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
