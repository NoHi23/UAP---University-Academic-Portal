import React, { useEffect, useState } from 'react';
import { Box, Container, Paper, Typography, TextField, Button, Avatar, Grid, MenuItem, CircularProgress } from '@mui/material';
import api from '../../../services/api';
import { notifySuccess, notifyError } from '../../../services/notificationService';
import { useNavigate } from 'react-router-dom';
import heic2any from 'heic2any';

export default function LecturerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get('lecturer/profile');
        if (res?.data?.success) {
          if (mounted) setProfile(res.data.data);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleChange = (field) => (e) => {
    const val = e?.target?.value;
    // handle numeric citizenID
    if (field === 'citizenID') {
      const n = val === '' || val === null ? '' : Number(val);
      setProfile(p => ({ ...p, [field]: n }));
    } else if (field === 'gender') {
      // store boolean for gender (true = male)
      const v = (val === 'true' || val === true);
      setProfile(p => ({ ...p, [field]: v }));
    } else {
      setProfile(p => ({ ...p, [field]: val }));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Detect HEIC/HEIF by MIME or extension
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || /\.heic$/i.test(file.name) || /\.heif$/i.test(file.name);

    let blobToUse = file;
    if (isHeic) {
      try {
        // Convert HEIC to JPEG blob in-browser
        const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
        // heic2any may return a Blob or an array of Blobs
        blobToUse = converted instanceof Blob ? converted : (Array.isArray(converted) ? converted[0] : converted);
      } catch (err) {
        console.error('HEIC conversion failed', err);
        notifyError('Không thể chuyển đổi ảnh HEIC. Vui lòng thử lại hoặc chuyển sang JPEG/PNG trước khi upload.');
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setProfile(p => ({ ...p, lecturerAvatar: base64 }));
    };
    reader.onerror = (err) => {
      console.error('FileReader error', err);
      notifyError('Lỗi đọc file ảnh');
    };
    reader.readAsDataURL(blobToUse);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        lecturerAvatar: profile.lecturerAvatar || null,
        majorId: profile.majorId?._id || profile.majorId || null,
        citizenID: profile.citizenID,
        gender: profile.gender,
      };
      const res = await api.put('lecturer/profile', payload);
      if (res?.data?.success) {
        setProfile(res.data.data);
        notifySuccess('Lưu hồ sơ thành công');
      } else {
        notifyError('Không thể lưu hồ sơ');
      }
    } catch (err) {
      console.error('Save profile failed', err);
      notifyError('Lưu hồ sơ thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Container sx={{ pt: 4 }}>Đang tải...</Container>;

  return (
    <Container sx={{ pt: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <input id="lecturer-avatar" type="file" accept="image/*,image/heic,.heic,.heif" style={{ display: 'none' }} onChange={handleFileChange} />
              <Avatar
                src={profile?.lecturerAvatar}
                sx={{ width: 120, height: 120, mx: 'auto', cursor: 'pointer', borderRadius: 0 }}
                imgProps={{ style: { objectFit: 'cover', width: '100%', height: '100%' } }}
                onClick={() => document.getElementById('lecturer-avatar').click()}
              />
              <Typography sx={{ mt: 1 }}>{profile?.lecturerCode}</Typography>
              <Typography variant="caption" display="block">Click ảnh để đổi (được chấp nhận dưới dạng base64)</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={9}>
            <Typography variant="h6" sx={{ mb: 2 }}>Hồ sơ giảng viên</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12} md={6}>
                <TextField label="Họ" fullWidth size="small" value={profile?.firstName || ''} onChange={handleChange('firstName')} />
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <TextField label="Tên" fullWidth size="small" value={profile?.lastName || ''} onChange={handleChange('lastName')} />
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <TextField label="Số điện thoại" fullWidth size="small" value={profile?.phone || ''} onChange={handleChange('phone')} />
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <TextField label="Số CMND/CCCD" fullWidth size="small" value={profile?.citizenID || ''} onChange={handleChange('citizenID')} />
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <TextField
                  select
                  label="Giới tính"
                  fullWidth
                  size="small"
                  value={typeof profile?.gender === 'boolean' ? String(profile.gender) : 'true'}
                  onChange={handleChange('gender')}
                >
                  <MenuItem value={'true'}>Nam</MenuItem>
                  <MenuItem value={'false'}>Nữ</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <TextField label="Mã giảng viên" fullWidth size="small" value={profile?.lecturerCode || ''} disabled />
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <TextField label="Email" fullWidth size="small" value={profile?.account?.email || ''} disabled />
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <TextField label="Chuyên ngành" fullWidth size="small" value={profile?.majorId?.majorName || ''} disabled />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </Button>
              <Button variant="outlined" onClick={() => navigate(-1)}>Quay lại</Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
