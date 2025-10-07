import React from "react";
import "./Modal.css";

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                {/* Header */}
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="modal-close" onClick={onClose}>
                        ✖
                    </button>
                </div>

                {/* Content */}
                <div className="modal-content">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
