import React from 'react';
import { useAppContext } from '../context/AppContext';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const Toast = () => {
  const { toasts } = useAppContext();

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} className="neon-text-green" />;
      case 'error':
        return <AlertCircle size={18} className="neon-text-pink" />;
      case 'warning':
        return <AlertTriangle size={18} className="neon-text-orange" />;
      default:
        return <Info size={18} className="neon-text-blue" />;
    }
  };

  const getToastClass = (type) => {
    switch (type) {
      case 'success':
        return 'toast-success';
      case 'error':
        return 'toast-error';
      case 'warning':
        return 'toast-warning';
      default:
        return '';
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${getToastClass(t.type)}`}>
          <div className="toast-icon">{getIcon(t.type)}</div>
          <div className="toast-message" style={{ flexGrow: 1 }}>{t.message}</div>
        </div>
      ))}
    </div>
  );
};

export default Toast;
