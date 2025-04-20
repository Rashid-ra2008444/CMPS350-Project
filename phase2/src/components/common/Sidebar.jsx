import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Common.css';

const Sidebar = ({ 
  title = "CMPS 350", 
  showSearch = false,
  searchPlaceholder = "Search", 
  buttons = [],
  logoImage = null 
}) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="sidebar">
      <h2 className="title">{title}</h2>
      <nav>
        {showSearch && (
          <input 
            type="text" 
            id="searchInput" 
            placeholder={searchPlaceholder} 
          />
        )}
        
        {buttons.map((button, index) => (
          <button 
            key={index} 
            onClick={() => handleNavigation(button.path)}
          >
            {button.label}
          </button>
        ))}
        
        <button id="logout" onClick={handleLogout}>Logout</button>
      </nav>
      
      {logoImage && (
        <div className="sidebar-footer">
          <img className="stev" src={logoImage} alt="Logo" />
        </div>
      )}
    </div>
  );
};

export default Sidebar;