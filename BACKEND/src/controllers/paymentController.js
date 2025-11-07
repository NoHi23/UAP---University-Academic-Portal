const Student = require('../models/student');
const TuitionFee = require('../models/tuitionFeeModel');
const Transaction = require('../models/transactionModel');
const crypto = require('crypto');
const dayjs = require('dayjs');
const querystring = require('qs');
const mongoose = require('mongoose');

// --- HÀM 1: LẤY CÁC KHOẢN PHÍ CẦN ĐÓNG ---
const getMyTuitionFees = async (req, res) => {
  try {
    const student = await Student.findOne({ accountId: req.user.id });
    if (!student) return res.status(404).json({ message: 'Không tìm thấy sinh viên.' });
    const today = new Date();
    const fees = await TuitionFee.find({
      studentId: student._id,
      status: 'unpaid',
      payableFrom: { $lte: today },
      deadline: { $gte: today }
    })
      .populate('semesterId', 'semesterName')
      .sort({ deadline: 1 });
    res.status(200).json({ success: true, data: fees });
  } catch (error) {
    console.error("Lỗi getMyTuitionFees:", error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// --- HÀM 2: LẤY LỊCH SỬ GIAO DỊCH ---
const getMyTransactionHistory = async (req, res) => {
  try {
    const student = await Student.findOne({ accountId: req.user.id });
    if (!student) return res.status(404).json({ message: 'Không tìm thấy sinh viên.' });
    const transactions = await Transaction.find({ studentId: student._id })
      .populate({
        path: 'feeId',
        select: 'semesterId',
        populate: { path: 'semesterId', select: 'semesterName' }
      })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    console.error("Lỗi getMyTransactionHistory:", error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const createPaymentUrl = async (req, res) => {
  try {
    const { feeId } = req.body;
    const student = await Student.findOne({ accountId: req.user.id });
    if (!student) return res.status(404).json({ message: 'Không tìm thấy sinh viên.' });

    const fee = await TuitionFee.findOne({ _id: feeId, studentId: student._id });
    if (!fee) return res.status(404).json({ message: 'Không tìm thấy khoản phí.' });
    if (fee.status === 'paid') return res.status(400).json({ message: 'Khoản phí này đã được thanh toán.' });

    const orderId = dayjs().format('DDHHmmss') + '_' + new mongoose.Types.ObjectId().toString().slice(-6);

    await Transaction.create({
      studentId: student._id,
      feeId: fee._id,
      orderId: orderId,
      amount: fee.amount,
      status: 'Pending'
    });

    const tmnCode = process.env.VNP_TMNCODE;
    const secretKey = process.env.VNP_HASHSECRET;
    let vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;
    const createDate = dayjs().format('YYYYMMDDHHmmss');
    const amount = fee.amount;

    const ipAddr = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1').split(',')[0].replace('::1', '127.0.0.1').trim();

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan hoc phi ' + orderId;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = Number(fee.amount) * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    // --- LOGIC KÝ TÊN (ĐÃ SỬA LỖI CÚ PHÁP) ---
    const sortedKeys = Object.keys(vnp_Params).sort();
    let signData = "";
    for (const key of sortedKeys) {
      if (vnp_Params[key] === '' || vnp_Params[key] === undefined || vnp_Params[key] === null) {
        continue;
      }
      // SỬA LỖI: Dùng encodeURIComponent() thay vì querystring.escape()
      signData += (signData.length === 0 ? '' : '&') + encodeURIComponent(key) + '=' + encodeURIComponent(vnp_Params[key]);
    }

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    // 👉 Thêm 2 dòng này để xem log khi tạo URL
    console.log("🔹 Sign data trước khi ký:", signData);
    console.log("🔹 Chữ ký gửi đi:", signed);
    // Tạo URL cuối cùng (thêm vnp_SecureHashType để VNPAY dễ đọc)
    vnpUrl += '?' + signData + '&vnp_SecureHash=' + signed + '&vnp_SecureHashType=SHA512';

    res.status(200).json({ success: true, paymentUrl: vnpUrl });
  } catch (error) {
    console.error("Lỗi createPaymentUrl:", error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
const handleVnpayCallback = async (req, res) => {
  let vnp_Params = req.query;
  const secureHash = vnp_Params['vnp_SecureHash'];

  console.log("========== 🧾 CALLBACK VNPAY ==========");
  console.log("📥 Toàn bộ query nhận về:", vnp_Params);
  console.log("🔹 Chữ ký VNPAY gửi về (vnp_SecureHash):", secureHash);

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  const sortedKeys = Object.keys(vnp_Params).sort();
  let signData = "";
  for (const key of sortedKeys) {
    if (!vnp_Params[key]) continue;
    signData += (signData.length === 0 ? '' : '&') + encodeURIComponent(key) + '=' + encodeURIComponent(vnp_Params[key]);
  }

  const secretKey = process.env.VNP_HASHSECRET;
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

  console.log("🔸 Sign data trước khi ký:", signData);
  console.log("🔸 Chữ ký tự tính (signed):", signed);
  console.log("🔸 Chữ ký VNPAY gửi về:", secureHash);

  const orderId = vnp_Params['vnp_TxnRef'];
  const responseCode = vnp_Params['vnp_ResponseCode'];
  const frontendReturnUrl = `${process.env.FRONTEND_URL}/student/payment-result`;

  // So sánh chữ ký (so sánh không phân biệt hoa thường)
  if (secureHash && secureHash.toLowerCase() === signed.toLowerCase()) {
    console.log("✅ Chữ ký hợp lệ!");

    try {
      const transaction = await Transaction.findOne({ orderId: orderId });
      if (!transaction) {
        return res.redirect(`${frontendReturnUrl}?success=false&message=OrderNotFound`);
      }
      if (transaction.status !== 'Pending') {
        return res.redirect(`${frontendReturnUrl}?success=false&message=OrderAlreadyProcessed`);
      }
      if (responseCode === '00') {
        transaction.status = 'Success';
        transaction.transactionCode = vnp_Params['vnp_TransactionNo'];
        transaction.paymentResponse = vnp_Params;
        await transaction.save();
        await TuitionFee.updateOne(
          { _id: transaction.feeId },
          { $set: { status: 'paid', amountPaid: transaction.amount } }
        );
        return res.redirect(`${frontendReturnUrl}?success=true&message=PaymentSuccess`);
      } else {
        transaction.status = 'Failed';
        transaction.paymentResponse = vnp_Params;
        await transaction.save();
        return res.redirect(`${frontendReturnUrl}?success=false&message=PaymentFailed`);
      }
    } catch (error) {
      console.error("Lỗi xử lý VNPAY callback:", error);
      return res.redirect(`${frontendReturnUrl}?success=false&message=ServerError`);
    }
  } else {
    return res.redirect(`${frontendReturnUrl}?success=false&message=InvalidSignature`);
  }
};

// --- HÀM 5: IPN (TỪ VNPAY) (ĐÃ SỬA LỖI CÚ PHÁP) ---
const handleVnpayIPN = async (req, res) => {
  let vnp_Params = req.query;
  const secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  // --- LOGIC KÝ TÊN (ĐÃ SỬA LỖI CÚ PHÁP) ---
  const sortedKeys = Object.keys(vnp_Params).sort();
  let signData = "";
  for (const key of sortedKeys) {
    if (vnp_Params[key] === '' || vnp_Params[key] === undefined || vnp_Params[key] === null) {
      continue;
    }
    // SỬA LỖI: Dùng encodeURIComponent()
    signData += (signData.length === 0 ? '' : '&') + encodeURIComponent(key) + '=' + encodeURIComponent(vnp_Params[key]);
  }

  const secretKey = process.env.VNP_HASHSECRET;
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
  console.log("🔹 Sign data IPN:", signData);
  console.log("🔹 Chữ ký tự tạo:", signed);
  console.log("🔹 Chữ ký VNPAY gửi:", secureHash);

  const orderId = vnp_Params['vnp_TxnRef'];
  const responseCode = vnp_Params['vnp_ResponseCode'];

  if (secureHash && secureHash.toLowerCase() === signed.toLowerCase()) {
    try {
      const transaction = await Transaction.findOne({ orderId: orderId });
      if (!transaction) {
        return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
      }
      if (transaction.status !== 'Pending') {
        return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
      }

      if (responseCode === '00') {
        transaction.status = 'Success';
        transaction.transactionCode = vnp_Params['vnp_TransactionNo'];
        transaction.paymentResponse = vnp_Params;
        await transaction.save();

        await TuitionFee.updateOne(
          { _id: transaction.feeId },
          { $set: { status: 'paid', amountPaid: transaction.amount } }
        );

        return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
      } else {
        transaction.status = 'Failed';
        transaction.paymentResponse = vnp_Params;
        await transaction.save();

        return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
      }
    } catch (error) {
      console.error("Lỗi xử lý VNPAY IPN:", error);
      return res.status(200).json({ RspCode: '97', Message: 'Server Error' });
    }
  } else {
    return res.status(200).json({ RspCode: '97', Message: 'Invalid Signature' });
  }
};

module.exports = {
  getMyTuitionFees,
  getMyTransactionHistory,
  createPaymentUrl,
  handleVnpayCallback,
  handleVnpayIPN
};