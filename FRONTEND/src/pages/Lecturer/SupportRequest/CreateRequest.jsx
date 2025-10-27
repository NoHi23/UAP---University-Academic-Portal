import React, { useMemo, useRef, useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Stack, Typography, IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import JoditEditor from "jodit-react";
import supportAPI from "../../../api/supportAPI";
import { notifySuccess, notifyError, showConfirmDialog } from "../../../services/notificationService";

function stripHtml(html = "") {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent?.trim() || tmp.innerText?.trim() || "";
}

export default function SupportCreateModal({ open, onClose, onSuccess }) {
    const editorRef = useRef(null);
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // tránh re-init Jodit gây mất focus
    const editorConfig = useMemo(() => ({
        readonly: false,
        minHeight: 220,
        toolbarAdaptive: false,
        placeholder: "Nhập nội dung yêu cầu hỗ trợ...",
        uploader: { insertImageAsBase64URI: true },
    }), []);

    const handleSubmit = async () => {
        const plain = stripHtml(content);
        if (!plain) {
            notifyError("Vui lòng nhập nội dung yêu cầu.");
            return;
        }

        const ok = await showConfirmDialog({
            title: "Tạo yêu cầu hỗ trợ?",
            text: "Xác nhận gửi yêu cầu đến bộ phận hỗ trợ.",
            icon: "question",
            confirmButtonText: "Gửi yêu cầu",
            cancelButtonText: "Hủy",
        });
        if (!ok.isConfirmed) return;

        try {
            setSubmitting(true);
            // prefer lecturer-scoped endpoint if available
            try {
                await supportAPI.createLecturerRequest({ request: content });
            } catch (e) {
                await supportAPI.createRequest({ request: content });
            }
            notifySuccess("Tạo yêu cầu hỗ trợ hoàn tất. Vui lòng chờ phản hồi.");
            onClose?.();
            onSuccess?.(); // cho list reload
            setContent("");
        } catch (e) {
            notifyError(e?.response?.data?.message || "Gửi yêu cầu thất bại.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ fontWeight: 600, pr: 6 }}>
                Liên hệ - góp ý
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{ position: "absolute", right: 12, top: 12 }}
                    aria-label="close"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={1.5}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Nội dung
                    </Typography>
                    <JoditEditor
                        ref={editorRef}
                        value={content}
                        config={editorConfig}
                        onBlur={(v) => setContent(v)}
                        onChange={() => { }}
                    />
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={submitting}>Hủy</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                    Gửi
                </Button>
            </DialogActions>
        </Dialog>
    );
}
