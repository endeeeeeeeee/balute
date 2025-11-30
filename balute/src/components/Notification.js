import React from 'react';

const Notification = ({ notification }) => {
  if (!notification || !notification.message) {
    return null;
  }

  const baseStyle = "p-4 my-4 rounded-lg text-center font-semibold";
  const styles = {
    error: "bg-red-500 text-white",
    success: "bg-green-500 text-white",
    default: "bg-gray-500 text-white"
  };

  const style = styles[notification.type] || styles.default;

  return (
    <div className={`${baseStyle} ${style}`}>
      {notification.message}
    </div>
  );
};

export default Notification;
