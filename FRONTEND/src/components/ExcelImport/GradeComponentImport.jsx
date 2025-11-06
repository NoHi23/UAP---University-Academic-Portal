import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import ExcelImport from './ExcelImport';
import gradeComponentAPI from '../../api/gradeComponentAPI';

export default function GradeComponentImport({ subjectId, onImported, readOnly }) {
  const [open, setOpen] = useState(false);

  // Transform row for grade component import
  const gradeComponentTransform = (r) => {
    if (!r || typeof r !== 'object') return null;
    const keys = Object.keys(r);
    const mapField = (names) => {
      for (const n of names) {
        if (Object.prototype.hasOwnProperty.call(r, n)) return r[n];
        const matchKey = keys.find(k => String(k).trim().toLowerCase() === String(n).trim().toLowerCase());
        if (matchKey) return r[matchKey];
      }
      return undefined;
    };
    return {
      name: mapField(['name','Name','Tên','Ten']) || '',
      weightPercentage: mapField(['weightPercentage','WeightPercentage','weight','Weight']) || '',
      dropLowest: mapField(['dropLowest','DropLowest']) || '',
      reLearnTime: mapField(['reLearnTime','ReLearnTime']) || '',
      description: mapField(['description','Description']) || '',
      gradingGuide: mapField(['gradingGuide','GradingGuide']) || '',
    };
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6">Grade Components</Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
        {!readOnly && (
          <>
            <Button variant="outlined" onClick={() => setOpen(true)}>Import Grade Components</Button>
            <Button variant="contained" color="success" onClick={async () => {
              try {
                const res = await gradeComponentAPI.exportExcel(subjectId);
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'grade_components.xlsx');
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                window.URL.revokeObjectURL(url);
              } catch (err) {
                alert('Xuất Excel thất bại!');
              }
            }}>Xuất Excel</Button>
          </>
        )}
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Import Grade Components</DialogTitle>
        <DialogContent>
          <ExcelImport
            subjectId={subjectId}
            onImported={() => { setOpen(false); if (typeof onImported === 'function') onImported(); }}
            model="grade-components"
            transformRow={gradeComponentTransform}
            requiredFields={["name","weightPercentage"]}
            customBulkImport={async (payload) => gradeComponentAPI.bulk(payload, subjectId)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
