import React from 'react';
import '../../styles/Common.css';

const Footer = ({ className = "banner" }) => {
  return (
    <footer className={className}>
      &copy; Qatar University Group Project Collections of this magnificant
      Work 2025. All rights reserved
    </footer>
  );
};

export default Footer;