import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface WhatsAppQRProps {
  phoneNumber?: string;
  size?: number;
}

const WhatsAppQR = ({ phoneNumber, size = 128 }: WhatsAppQRProps) => {
  if (!phoneNumber) return null;

  // Clean phone number for WhatsApp link
  const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
  const whatsappUrl = `https://wa.me/${cleanNumber}`;

  return (
    <div className="bg-white p-2 rounded-lg shadow-inner">
      <QRCodeSVG 
        value={whatsappUrl}
        size={size}
        level="H"
        includeMargin={true}
      />
    </div>
  );
};

export default WhatsAppQR;
