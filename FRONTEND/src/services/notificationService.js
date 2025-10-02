
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export const notifySuccess = (title = 'Thao tác thành công!') => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });
    Toast.fire({
        icon: 'success',
        title: title
    });
};

export const notifyError = (text = 'Đã có lỗi xảy ra.', title = 'Oops...') => {
    Swal.fire({
        icon: 'error',
        title: title,
        text: text,
    });
};

export const notifyInfo = (text, title = 'Thông báo') => {
    Swal.fire({
        icon: 'info',
        title: title,
        text: text,
    });
};


export const showConfirmDialog = ({
    title = 'Bạn có chắc chắn?',
    text = "Hành động này không thể được hoàn tác!",
    icon = 'warning',
    confirmButtonText = 'Vâng, đồng ý!',
    cancelButtonText = 'Hủy bỏ'
} = {}) => {
    return Swal.fire({
        title: title,
        text: text,
        icon: icon,
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: confirmButtonText,
        cancelButtonText: cancelButtonText
    });
};