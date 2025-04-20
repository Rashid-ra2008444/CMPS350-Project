import React from 'react';
import '../../styles/Common.css';

const Banner = ({ title, subtitle = null, className = "banner" }) => {
  return (
    <section className={className}>
      <h1 className="title">{title}</h1>
      {subtitle && <h2>{subtitle}</h2>}
    </section>
  );
};

export default Banner;