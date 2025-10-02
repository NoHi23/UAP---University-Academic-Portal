import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export const showConfirmDialog = ({
    title = 'Bạn có chắc chắn?',
    text = "Hành động này không thể được hoàn tác!",
    icon = 'warning',
    confirmButtonText = 'Vâng, xóa nó!',
    cancelButtonText = 'Hủy bỏ'
} = {}) => {
    return Swal.fire({
        title: title,
        text: text,
        icon: icon,
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#bdc3c7',
        confirmButtonText: confirmButtonText,
        cancelButtonText: cancelButtonText
    });
};