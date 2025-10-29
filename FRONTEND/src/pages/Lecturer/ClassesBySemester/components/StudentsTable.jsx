import React from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Avatar } from '@mui/material';

const StudentsTable = ({ students = [], totalSlots = 0 }) => {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>STT</TableCell>
          <TableCell>Avatar</TableCell>
          <TableCell>Mã SV</TableCell>
          <TableCell>Họ tên</TableCell>
          <TableCell>Email</TableCell>
          <TableCell>Số buổi đã đi / Tổng</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {students.map((s, idx) => (
          <TableRow key={s._id || idx}>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>
              <Avatar src={s.studentAvatar || undefined}>{(!s.studentAvatar && s.firstName) ? s.firstName.charAt(0) : ''}</Avatar>
            </TableCell>
            <TableCell>{s.studentCode}</TableCell>
            <TableCell>{s.firstName} {s.lastName}</TableCell>
            <TableCell>{s.email}</TableCell>
            <TableCell>{s.attended || 0} / {totalSlots}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default StudentsTable;
