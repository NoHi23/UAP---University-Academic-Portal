import React, { useState, useEffect } from 'react';
import {
    Container, Paper, Typography, Box, Button, Switch,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip, CircularProgress, TextField, Select, MenuItem, FormControl, InputLabel,
    Divider, Chip 
} from '@mui/material';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import api from '../../services/api';
import { notifySuccess, notifyError } from '../../services/notificationService';

const AiToolManagementPage = () => {
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(null);
    const [editData, setEditData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    
    const [newToolName, setNewToolName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newRole, setNewRole] = useState('student');
    const [newParameters, setNewParameters] = useState([]); 
    const [newIsEnabled, setNewIsEnabled] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    const fetchTools = async () => {
        setLoading(true);
        try {
            const response = await api.get('/staff/ai-tools');
            setTools(response.data.data);
        } catch (err) {
            notifyError('Không thể tải danh sách công cụ.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTools();
    }, []);

    const handleToggleEnable = async (tool) => {
        try {
            await api.put(`/staff/ai-tools/${tool._id}`, { 
                ...tool, 
                isEnabled: !tool.isEnabled 
            });
            notifySuccess(`Đã ${!tool.isEnabled ? 'bật' : 'tắt'} công cụ.`);
            fetchTools(); 
        } catch (err) {
            notifyError('Cập nhật thất bại.');
        }
    };

    // --- CÁC HÀM HELPER BỊ THIẾU ---
    const handleAddParameter = () => {
        setNewParameters([
            ...newParameters,
            { name: '', type: 'STRING', description: '', isRequired: true }
        ]);
    };

    const handleRemoveParameter = (index) => {
        const updatedParams = newParameters.filter((_, i) => i !== index);
        setNewParameters(updatedParams);
    };

    const handleParameterChange = (index, field, value) => {
        const updatedParams = [...newParameters];
        // ensure boolean fields remain boolean
        if (field === 'isRequired') {
            updatedParams[index][field] = (value === true || value === 'true');
        } else {
            updatedParams[index][field] = value;
        }
        setNewParameters(updatedParams);
    };
    // ---------------------------------

    const handleCreateTool = async (e) => {
        e.preventDefault();
        setIsCreating(true);

        let parametersObject = null;
        if (newParameters.length > 0) {
            parametersObject = {
                type: "OBJECT",
                properties: {},
                required: []
            };

            newParameters.forEach(param => {
                if (param.name.trim()) {
                    parametersObject.properties[param.name] = {
                        type: param.type,
                        description: param.description
                    };
                    if (param.isRequired) {
                        parametersObject.required.push(param.name);
                    }
                }
            });
        }
        
        try {
            await api.post('/staff/ai-tools', {
                toolName: newToolName,
                description: newDescription,
                role: newRole,
                parameters: parametersObject,
                isEnabled: newIsEnabled
            });
            notifySuccess('Tạo công cụ mới thành công!');
            setNewToolName(''); 
            setNewDescription(''); 
            setNewParameters([]); 
            setNewRole('student');
            fetchTools();
        } catch (err) {
            notifyError(err.response?.data?.message || 'Tạo thất bại.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (toolId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa công cụ này không?')) {
            try {
                await api.delete(`/staff/ai-tools/${toolId}`);
                notifySuccess('Xóa công cụ thành công.');
                fetchTools();
            } catch (err) {
                notifyError(err.response?.data?.message || 'Xóa thất bại.');
            }
        }
    };

    const handleEditStart = (tool) => {
        setIsEditing(tool._id);
        
        let paramsArray = [];
        if (tool.parameters && tool.parameters.properties) {
            paramsArray = Object.entries(tool.parameters.properties).map(([name, props]) => ({
                name: name,
                type: props.type,
                description: props.description,
                isRequired: tool.parameters.required?.includes(name) || false
            }));
        }

        setEditData({
            ...tool,
            parameters: paramsArray
        });
    };

    const handleEditCancel = () => {
        setIsEditing(null);
        setEditData({});
    };

    const handleEditChange = (e) => {
        const { name, value, checked, type } = e.target;
        setEditData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };
    
    const handleEditParamChange = (index, field, value) => {
        const updatedParams = [...editData.parameters];
        if (field === 'isRequired') {
            updatedParams[index][field] = (value === true || value === 'true');
        } else {
            updatedParams[index][field] = value;
        }
        setEditData(prev => ({
            ...prev,
            parameters: updatedParams
        }));
    };

    const handleAddEditParameter = () => {
        setEditData(prev => ({
            ...prev,
            parameters: [
                ...prev.parameters,
                { name: '', type: 'STRING', description: '', isRequired: true }
            ]
        }));
    };

    const handleRemoveEditParameter = (index) => {
        setEditData(prev => ({
            ...prev,
            parameters: prev.parameters.filter((_, i) => i !== index)
        }));
    };


    const handleEditSave = async (toolId) => {
        setIsSaving(true);
        let parametersObject = null;
        if (editData.parameters && editData.parameters.length > 0) {
            parametersObject = {
                type: "OBJECT",
                properties: {},
                required: []
            };

            editData.parameters.forEach(param => {
                if (param.name.trim()) {
                    parametersObject.properties[param.name] = {
                        type: param.type,
                        description: param.description
                    };
                    if (param.isRequired) {
                        parametersObject.required.push(param.name);
                    }
                }
            });
        }

        try {
            await api.put(`/staff/ai-tools/${toolId}`, {
                description: editData.description,
                role: editData.role,
                isEnabled: editData.isEnabled,
                parameters: parametersObject
            });
            notifySuccess('Cập nhật công cụ thành công!');
            setIsEditing(null);
            fetchTools();
        } catch (err) {
            notifyError(err.response?.data?.message || 'Cập nhật thất bại.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>;

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" fontWeight={600} mb={2}>Tạo Công cụ AI mới</Typography>
                <form onSubmit={handleCreateTool}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Tên công cụ (ví dụ: get_student_schedule)"
                            value={newToolName}
                            onChange={(e) => setNewToolName(e.target.value)}
                            size="small"
                            required
                        />
                        <TextField
                            label="Mô tả (Gemini sẽ đọc mô tả này)"
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            size="small"
                            multiline
                            rows={2}
                            required
                        />
                        
                        <Divider sx={{ my: 1 }}><Chip label="Parameters" /></Divider>

                        {newParameters.map((param, index) => (
                            <Paper key={index} variant="outlined" sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                                <TextField
                                    label="Tên tham số"
                                    value={param.name}
                                    onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                                    size="small"
                                    sx={{ flex: 1 }}
                                    required
                                />
                                <FormControl size="small" sx={{ flex: 1 }}>
                                    <InputLabel>Kiểu dữ liệu</InputLabel>
                                    <Select
                                        value={param.type}
                                        label="Kiểu dữ liệu"
                                        onChange={(e) => handleParameterChange(index, 'type', e.target.value)}
                                    >
                                        <MenuItem value="STRING">STRING</MenuItem>
                                        <MenuItem value="NUMBER">NUMBER</MenuItem>
                                        <MenuItem value="BOOLEAN">BOOLEAN</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Mô tả tham số"
                                    value={param.description}
                                    onChange={(e) => handleParameterChange(index, 'description', e.target.value)}
                                    size="small"
                                    sx={{ flex: 2 }}
                                    required
                                />
                                 <FormControl size="small" sx={{ minWidth: 100 }}>
                                    <InputLabel>Bắt buộc?</InputLabel>
                                    <Select
                                        value={param.isRequired}
                                        label="Bắt buộc?"
                                        onChange={(e) => handleParameterChange(index, 'isRequired', e.target.value)}
                                    >
                                        <MenuItem value={true}>Có</MenuItem>
                                        <MenuItem value={false}>Không</MenuItem>
                                    </Select>
                                </FormControl>
                                <Tooltip title="Xóa tham số này">
                                    <IconButton onClick={() => handleRemoveParameter(index)} color="error">
                                        <FaTimes />
                                    </IconButton>
                                </Tooltip>
                            </Paper>
                        ))}
                        
                        <Button
                            variant="outlined"
                            startIcon={<FaPlus />}
                            onClick={handleAddParameter}
                            sx={{ alignSelf: 'flex-start', mt: 1 }}
                        >
                            Thêm tham số
                        </Button>
                        
                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                 <FormControl size="small" sx={{ minWidth: 200, maxWidth: '30%' }}>
                                <InputLabel>Vai trò</InputLabel>
                                <Select value={newRole} label="Vai trò" onChange={(e) => setNewRole(e.target.value)}>
                                    <MenuItem value="student">Student</MenuItem>
                                    <MenuItem value="lecturer">Lecturer</MenuItem>
                                    <MenuItem value="staff">Staff</MenuItem>
                                </Select>
                            </FormControl>
                                <FormControl component="fieldset" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2">Kích hoạt</Typography>
                                        <Switch checked={newIsEnabled} onChange={(e) => setNewIsEnabled(e.target.checked)} color="success" />
                                    </Box>
                                </FormControl>
                            <Button 
                                type="submit" 
                                variant="contained" 
                                    startIcon={isCreating ? <CircularProgress size={20} color="inherit" /> : <FaPlus />} 
                                sx={{ alignSelf: 'flex-start' }}
                                disabled={isCreating}
                            >
                                {isCreating ? 'Đang tạo...' : 'Lưu Công cụ'}
                            </Button>
                        </Box>
                    </Box>
                </form>
            </Paper>

            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight={600} mb={2}>Quản lý Công cụ AI</Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Tên Công cụ</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Mô tả</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Parameters</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Vai trò</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', width: '100px' }}>Hành động</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                                {tools.map((tool) => (
                                    <TableRow key={tool._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    {isEditing === tool._id ? (
                                        <>
                                            <TableCell>
                                                <Switch
                                                    checked={editData.isEnabled}
                                                    onChange={(e) => handleEditChange(e)}
                                                    name="isEnabled"
                                                    color="success"
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace' }}>{tool.toolName}</TableCell>
                                            <TableCell>
                                                <TextField 
                                                    value={editData.description} 
                                                    name="description" 
                                                    onChange={handleEditChange} 
                                                    size="small" 
                                                    fullWidth 
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {editData.parameters.map((param, index) => (
                                                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                                                        <TextField label="Tên" value={param.name} onChange={(e) => handleEditParamChange(index, 'name', e.target.value)} size="small" sx={{ width: '100px' }} />
                                                        <Select value={param.type} onChange={(e) => handleEditParamChange(index, 'type', e.target.value)} size="small" sx={{ width: '100px' }}>
                                                            <MenuItem value="STRING">STRING</MenuItem>
                                                            <MenuItem value="NUMBER">NUMBER</MenuItem>
                                                            <MenuItem value="BOOLEAN">BOOLEAN</MenuItem>
                                                        </Select>
                                                        <TextField label="Mô tả" value={param.description} onChange={(e) => handleEditParamChange(index, 'description', e.target.value)} size="small" sx={{ width: '200px' }} />
                                                        <FormControl size="small" sx={{ minWidth: 100 }}>
                                                            <InputLabel>Bắt buộc?</InputLabel>
                                                            <Select value={param.isRequired} onChange={(e) => handleEditParamChange(index, 'isRequired', e.target.value)} size="small" sx={{ width: '100px' }}>
                                                                <MenuItem value={true}>Có</MenuItem>
                                                                <MenuItem value={false}>Không</MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                        <IconButton onClick={() => handleRemoveEditParameter(index)} size="small"><FaTimes color="red" /></IconButton>
                                                    </Box>
                                                ))}
                                                <Button size="small" onClick={handleAddEditParameter} startIcon={<FaPlus />}>Thêm</Button>
                                            </TableCell>
                                            <TableCell>
                                                <Select value={editData.role} name="role" onChange={handleEditChange} size="small" fullWidth>
                                                    <MenuItem value="student">Student</MenuItem>
                                                    <MenuItem value="lecturer">Lecturer</MenuItem>
                                                    <MenuItem value="staff">Staff</MenuItem>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title="Lưu">
                                                    <IconButton size="small" onClick={() => handleEditSave(tool._id)} disabled={isSaving}>
                                                        {isSaving ? <CircularProgress size={20} /> : <FaSave color="green" />}
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Hủy">
                                                    <IconButton size="small" onClick={handleEditCancel}><FaTimes /></IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </>
                                    ) : (
                                        <>
                                            <TableCell>
                                                <Tooltip title={tool.isEnabled ? 'Đang bật' : 'Đang tắt'}>
                                                    <Switch
                                                        checked={tool.isEnabled}
                                                        onChange={() => handleToggleEnable(tool)}
                                                        color="success"
                                                    />
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace' }}>{tool.toolName}</TableCell>
                                            <TableCell sx={{ minWidth: 300 }}>{tool.description}</TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem', maxWidth: 300 }}>
                                                {tool.parameters && tool.parameters.properties ? (
                                                    Object.entries(tool.parameters.properties).map(([name, p]) => (
                                                        <Box key={name} sx={{ mb: 0.5 }}>
                                                            <Typography component="span" sx={{ fontWeight: 600 }}>{name}</Typography>
                                                            <Typography component="span" sx={{ mx: 1, color: 'text.secondary' }}>• {p.type}</Typography>
                                                            {tool.parameters.required && tool.parameters.required.includes(name) && (
                                                                <Chip size="small" label="required" color="primary" sx={{ ml: 1, mr: 1 }} />
                                                            )}
                                                            <Typography component="div" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{p.description}</Typography>
                                                        </Box>
                                                    ))
                                                ) : 'N/A'}
                                            </TableCell>
                                            <TableCell>{tool.role}</TableCell>
                                            <TableCell>
                                                <Tooltip title="Sửa">
                                                    <IconButton size="small" onClick={() => handleEditStart(tool)}><FaEdit /></IconButton>
                                                </Tooltip>
                                                <Tooltip title="Xóa">
                                                    <IconButton size="small" onClick={() => handleDelete(tool._id)}><FaTrash color="red" /></IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Container>
    );
};

export default AiToolManagementPage;