import React from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, Button, Typography, Chip, Box, Card, CardContent, CardActions } from '@mui/material';

// Controlled modal that lists schedules (slots) for a subject/class group
// Props:
// - open: boolean
// - onClose: () => void
// - schedules: array of schedule objects (scheduleId/date/slot/room/taught/...)
// - title: string
// - onSelect: (scheduleId) => void  // called when user wants to open attendance/detail list
export default function ScheduleListModal({ open, onClose, schedules = [], title = 'Danh sách buổi', onSelect = () => {} }) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        {(!schedules || schedules.length === 0) && (
          <Typography>Không có buổi nào để hiển thị.</Typography>
        )}

        {Array.isArray(schedules) && schedules.length > 0 && (
          <>
            {isSmall ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {schedules.map((s, idx) => {
                  const sid = s.scheduleId || s._id || '';
                  const dateStr = s.date ? new Date(s.date).toLocaleDateString() : '';
                  const taught = !!(s.taught === true || s.attendance === true);
                  const slotIndex = s.slotIndex ?? (s.slotOrder ?? (idx + 1));
                  return (
                    <Card key={sid || idx} variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1">Buổi {slotIndex} — {dateStr}</Typography>
                        <Typography variant="body2" color="text.secondary">Tiết {s.slot || '—'} • {s.room || ''}</Typography>
                      </CardContent>
                      <CardActions>
                        <Chip label={taught ? 'Đã điểm danh' : 'Chưa điểm danh'} color={taught ? 'success' : 'default'} size="small" />
                        <Button size="small" sx={{ ml: 1 }} onClick={() => { onSelect(sid); onClose(); }}>Xem</Button>
                      </CardActions>
                    </Card>
                  );
                })}
              </Box>
            ) : (
              <List>
                {schedules.map((s, idx) => {
                  const sid = s.scheduleId || s._id || '';
                  const dateStr = s.date ? new Date(s.date).toLocaleDateString() : '';
                  const taught = !!(s.taught === true || s.attendance === true);
                  const slotIndex = s.slotIndex ?? (s.slotOrder ?? (idx + 1));
                  return (
                    <ListItem key={sid || idx} divider secondaryAction={
                      <>
                        <Chip label={taught ? 'Đã điểm danh' : 'Chưa điểm danh'} color={taught ? 'success' : 'default'} size="small" />
                        <Button size="small" sx={{ ml: 1 }} onClick={(e) => { e.stopPropagation(); onSelect(sid); onClose(); }}>Xem</Button>
                      </>
                    }>
                      <ListItemText
                        primary={`Buổi ${slotIndex} — ${dateStr} — Tiết ${s.slot || ''}`}
                        secondary={s.room || ''}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
