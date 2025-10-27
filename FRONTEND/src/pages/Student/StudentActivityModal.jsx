import React from 'react';
import { Dialog, DialogTitle, IconButton, DialogContent, Box, Card, CardContent, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import { useNavigate } from 'react-router-dom';

const StudentActivityModal = ({ open, onClose, schedule }) => {
  const navigate = useNavigate();
  const subjectName = schedule?.subjectId?.subjectName || '';
  const subjectCode = schedule?.subjectId?.subjectCode || '';
  // lecturer info (may be populated or just an id)
  const lecturerCode = schedule?.lecturerId?.lecturerCode || '';
  const className = schedule?.classId?.className || schedule?.classId?.name || '';
  const room = schedule?.roomId?.roomName || '';
  const time = schedule?.timeDisplay || `${schedule?.startTime || ''} - ${schedule?.endTime || ''}`;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>Thông tin buổi học</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Left: View details (close modal then navigate) */}
            <Card sx={{ flex: 1, cursor: 'pointer' }} onClick={() => {
                try {
                  const id = schedule?._id || schedule?.id;
                  onClose && onClose();
                  if (id) {
                    navigate(`/student/schedule/${id}`);
                  } else console.warn('No schedule id to show details', schedule);
                } catch (err) { console.error(err); }
              }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <Box sx={{ width: 96, height: 96, mb: 1, borderRadius: 2, backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GroupIcon sx={{ fontSize: 56, color: 'primary.main' }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{subjectName || subjectCode || '—'}</Typography>
                {subjectCode && <Typography color="textSecondary">Mã môn: {subjectCode}</Typography>}
                {/* Hiển thị mã giảng viên (nếu có) dưới thông tin môn học */}
                {lecturerCode && <Typography color="textSecondary">Mã giảng viên: {lecturerCode}</Typography>}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>{(subjectName && subjectCode) ? `${className} · ${room} · ${time}` : `${className}${className && room ? ' · ' : ''}${room}${(room && time) ? ' · ' : ''}${time}`}</Typography>
              </CardContent>
            </Card>

            {/* Right: Attendance (close modal then navigate to student attendance) */}
            <Card sx={{ flex: 1, cursor: 'pointer' }} onClick={() => {
                try {
                  const id = schedule?._id || schedule?.id;
                  onClose && onClose();
                  if (id) navigate(`/student/attendance/${id}`);
                } catch (err) { console.error(err); }
              }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <Box sx={{ width: 96, height: 96, mb: 1, borderRadius: 2, backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HowToRegIcon sx={{ fontSize: 56, color: 'primary.main' }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Điểm Danh</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>Xem trạng thái điểm danh hoặc thực hiện điểm danh</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default StudentActivityModal;
