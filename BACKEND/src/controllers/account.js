const User = require('../models/account'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library'); 
require('dotenv').config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
  const payload = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3h' });
};


const register = async (req, res) => {
  try {
    const { name, password, email, phone, address, avatar } = req.body;

    if (!email || !email.endsWith('.edu.vn')) {
      return res.status(400).json({ message: 'Đăng ký thất bại: Chỉ chấp nhận email giáo dục (.edu.vn).' });
    }

    const existedUser = await User.findOne({ email });
    if (existedUser) {
      return res.status(409).json({ message: 'Email này đã được sử dụng.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      avatar 
    });

    const userData = { ...newUser._doc };
    delete userData.password;

    return res.status(201).json({
      message: 'Đăng ký thành công!',
      user: userData
    });

  } catch (error) {
    console.error("Lỗi khi đăng ký:", error);
    return res.status(500).json({ message: 'Đã có lỗi xảy ra ở server.' });
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.endsWith('.edu.vn')) {
      return res.status(401).json({ message: 'Chỉ chấp nhận email giáo dục (.edu.vn).' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
    }

    const token = generateToken(user);

    const userData = { ...user._doc };
    delete userData.password;

    return res.status(200).json({
      message: 'Đăng nhập thành công!',
      token,
      user: userData
    });

  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error);
    return res.status(500).json({ message: 'Đã có lỗi xảy ra ở server.' });
  }
}
const loginWithGoogle = async (req, res) => {
  try {
    const { credential } = req.body; 

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email } = ticket.getPayload();

    if (!email || !email.endsWith('.edu.vn')) {
      return res.status(403).json({ message: 'Đăng nhập thất bại: Chỉ chấp nhận tài khoản Google có email .edu.vn.' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(403).json({
        message: 'Đăng nhập thất bại. Tài khoản Google này chưa được đăng ký trong hệ thống sinh viên.'
      });
    }
    const token = generateToken(user);

    const userData = { ...user._doc };
    delete userData.password;

    return res.status(200).json({
      message: 'Đăng nhập bằng Google thành công!',
      token,
      user: userData
    });

  } catch (error) {
    console.error("Lỗi khi đăng nhập Google:", error);
    return res.status(401).json({ message: 'Credential không hợp lệ hoặc đã hết hạn.' });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    res.status(200).json(user);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Đã có lỗi xảy ra ở server." });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, address, phone, avatar } = req.body;
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = name || user.name;
      user.address = address || user.address;
      user.phone = phone || user.phone;
      user.avatar = avatar || user.avatar;

      const updatedUser = await user.save();
      const token = generateToken(updatedUser); 

      const userData = { ...updatedUser._doc };
      delete userData.password;

      res.json({
        message: 'Cập nhật thông tin thành công!',
        token,
        user: userData
      });
    } else {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};


const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này.' });
    }

    const listAllUser = await User.find().select("-password");
    return res.status(200).json(listAllUser);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Đã có lỗi xảy ra ở server." });
  }
};

const updateUserRole = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này.' });
    }

    const { role } = req.body;
    const { id } = req.params;

    const validRoles = User.schema.path('role').enumValues;
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ.' });
    }

    const user = await User.findById(id);
    if (user) {
      user.role = role;
      await user.save();
      res.json({ message: 'Cập nhật vai trò thành công.' });
    } else {
      res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};


module.exports = {
  register,
  login,
  loginWithGoogle,
  getProfile,
  updateProfile,
  getAllUsers,
  updateUserRole
};