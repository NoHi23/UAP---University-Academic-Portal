import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const StaffProfile = () => {
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const { user } = useContext(AuthContext);

  // ====== FETCH PROFILE ======
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:9999/api/staff/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Lỗi tải thông tin');
      const data = await res.json();

      setStaffData(data);
      setFormData({
        fullName: data.fullName || `${data.lastName || ''} ${data.firstName || ''}`.trim(),
        gender: data.gender ?? true,
        phone: data.phone || '',
        address: data.address || '',
        dateOfBirth: data.dateOfBirth
          ? new Date(data.dateOfBirth).toISOString().split('T')[0]
          : '',
        staffAvatar: data.staffAvatar || ''
      });
    } catch (err) {
      console.error('fetchProfile error:', err);
      alert('Không tải được thông tin nhân sự.');
    } finally {
      setLoading(false);
    }
  };

  // ====== UPDATE PROFILE ======
  const updateProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const payload = {};
      for (let key in formData) {
        if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined)
          payload[key] = formData[key];
      }

      const res = await fetch('http://localhost:9999/api/staff/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        alert('Cập nhật thành công');
        setStaffData(data.staff || data);
      } else {
        alert(`Lỗi: ${data.message}`);
      }
    } catch (err) {
      console.error('updateProfile error:', err);
      alert('Có lỗi khi cập nhật.');
    } finally {
      setLoading(false);
    }
  };

  // ====== HANDLE INPUT ======
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'gender' ? value === 'true' : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData((prev) => ({ ...prev, staffAvatar: reader.result }));
    reader.readAsDataURL(file);
  };

  // ====== FETCH ON LOAD ======
  useEffect(() => {
    fetchProfile();
  }, []);

  // ====== RENDER ======
  return (
    <div className="staff-profile-page" style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Thông tin nhân sự</h2>

      {loading && <p>Đang tải dữ liệu...</p>}

      {!loading && staffData && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateProfile();
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxWidth: '600px'
          }}
        >
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img
              src={formData.staffAvatar || staffData.staffAvatar || 'https://i.pravatar.cc/150'}
              alt="Avatar"
              style={{ width: '100px', height: '100px', borderRadius: '50%' }}
            />
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>

          {/* Mã nhân sự */}
          <p>
            <strong>Mã nhân sự:</strong> {staffData.staffCode || 'undefined'}
          </p>

          {/* Họ và tên */}
          <label>
            Họ và tên:
            <input
              name="fullName"
              value={formData.fullName || ''}
              onChange={handleInputChange}
              style={{ width: '100%' }}
            />
          </label>

          {/* Giới tính */}
          <label>
            Giới tính:
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              style={{ width: '100%' }}
            >
              <option value={true}>Nam</option>
              <option value={false}>Nữ</option>
            </select>
          </label>

          {/* Điện thoại */}
          <label>
            Số điện thoại:
            <input
              name="phone"
              value={formData.phone || ''}
              onChange={handleInputChange}
              style={{ width: '100%' }}
            />
          </label>

          {/* Ngày sinh */}
          <label>
            Ngày sinh:
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth || ''}
              onChange={handleInputChange}
              style={{ width: '100%' }}
            />
          </label>

          {/* Địa chỉ */}
          <label>
            Địa chỉ:
            <input
              name="address"
              value={formData.address || ''}
              onChange={handleInputChange}
              style={{ width: '100%' }}
            />
          </label>

          {/* Email và vai trò */}
          <div style={{ marginTop: '1rem' }}>
            <h3>Thông tin tài khoản</h3>
            <p>
              <strong>Email:</strong> {staffData.accountId?.email || user?.email || 'undefined'}
            </p>
            <p>
              <strong>Vai trò:</strong> {staffData.accountId?.role || user?.role || 'undefined'}
            </p>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <button type="submit" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            <button type="button" onClick={fetchProfile}>
              Tải lại
            </button>
          </div>
        </form>
      )}

      {!loading && !staffData && <p>Không tìm thấy dữ liệu nhân sự</p>}
    </div>
  );
};

export default StaffProfile;
