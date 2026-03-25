import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is invalid' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'ward_admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  next();
};

export default { auth, adminOnly };