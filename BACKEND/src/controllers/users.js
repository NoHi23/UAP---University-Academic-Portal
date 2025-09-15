const User = require('../models/users')
const Cart = require('../models/cart');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Error } = require('mongoose');
require('dotenv').config();


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
    }

    // 2. So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
    }

    // 3. Tạo JWT
    const token = jwt.sign(
      { id: user._id, role: user.role }, // <<-- Thêm role vào payload của token
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // 4. Chuẩn bị dữ liệu user để trả về
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    };

    // <<-- Trả về cả token và thông tin user
    return res.status(200).json({
      message: 'Đăng nhập thành công!',
      token,
      user: userData
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Đã có lỗi xảy ra ở server.' });
  }
}
const getProfile = async (req, res) => {
  try {
    // Middleware xác thực token sẽ giải mã và gán payload vào req.user
    const userId = req.UserID; // <<-- Sửa từ req.UserID thành req.user.id

    const user = await User.findById(userId).select("-password"); // Bỏ trường password

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    // <<-- Trả về thẳng object user, không cần format lại
    res.status(200).json(user);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Đã có lỗi xảy ra ở server." });
  }
};

const getAllUsers = async (req, res) => {
  try {
    // 1. Phân quyền: Chỉ admin mới có quyền xem danh sách user <<-- Cực kỳ quan trọng
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này.' });
    }

    // 2. Lấy danh sách user và bỏ qua mật khẩu
    const listAllUser = await User.find().select("-password");

    return res.status(200).json(listAllUser);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Đã có lỗi xảy ra ở server." });
  }
};
const register = async (req, res) => {
  try {
    // Thêm trường avatar vào
    const { name, password, email, phone, address, avatar } = req.body;

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
      avatar: avatar || undefined // Nếu không có avatar gửi lên, nó sẽ tự lấy giá trị default trong model
    });

    await Cart.create({ user: newUser._id });

    const userData = { ...newUser._doc };
    delete userData.password;

    return res.status(201).json({
      message: 'Đăng ký thành công!',
      data: userData
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Đã có lỗi xảy ra ở server.' });
  }
}

const updateProfile = async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = name || user.name;
      user.address = address || user.address;
      user.phone = phone || user.phone;

      const updatedUser = await user.save();

      // Tạo lại token với thông tin mới
      const token = jwt.sign(
        { id: updatedUser._id, role: updatedUser.role, name: updatedUser.name, avatar: updatedUser.avatar },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );

      res.json({
        message: 'Cập nhật thông tin thành công!',
        token,
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          address: updatedUser.address,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar,
          role: updatedUser.role,
        }
      });
    } else {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    // Kiểm tra role có hợp lệ không
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ.' });
    }
    const user = await User.findById(req.params.id);
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
module.exports = { login, getProfile, getAllUsers, register, updateProfile, updateUserRole }
