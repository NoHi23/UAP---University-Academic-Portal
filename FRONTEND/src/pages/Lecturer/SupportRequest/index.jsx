import React, { useState } from 'react';
import { Box, Tabs, Tab, Container } from '@mui/material';
import SupportCreateModal from './CreateRequest';
import SupportListLecturer from './SupportList';

export default function SupportRequestPage() {
  const [tab, setTab] = useState(0);
  const [openCreate, setOpenCreate] = useState(false);

  const handleChange = (_, v) => setTab(v);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={handleChange} aria-label="support-tabs">
          <Tab label="Tạo đơn" />
          <Tab label="Xem đơn" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <Box>
          {/* Open create dialog directly in the create tab */}
          <Box sx={{ textAlign: 'center', pt: 6 }}>
            <Box sx={{ display: 'inline-block' }}>
              <button className="btn btn-primary" onClick={() => setOpenCreate(true)}>Tạo yêu cầu hỗ trợ</button>
            </Box>
          </Box>
          <SupportCreateModal open={openCreate} onClose={() => setOpenCreate(false)} onSuccess={() => { /* nothing: SupportList will fetch when mounted */ }} />
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <SupportListLecturer />
        </Box>
      )}
    </Container>
  );
}
