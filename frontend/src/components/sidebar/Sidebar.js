import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import './Sidebar.css';

function Sidebar() {
  const { loginWithRedirect, logout, isAuthenticated } = useAuth0();

  return (
    <div className='sidebar'>
      <div className="logo">
        <h1>Mixify</h1>
      </div>
      <nav>
        <ul className="nav-links">
          <li><NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>Home</NavLink></li>
          <li><NavLink to="/search" className={({ isActive }) => isActive ? "active" : ""}>Search</NavLink></li>
          <li><NavLink to="/library" className={({ isActive }) => isActive ? "active" : ""}>Your Library</NavLink></li>
          {isAuthenticated && <li><NavLink to="/profile" className={({ isActive }) => isActive ? "active" : ""}>Profile</NavLink></li>}
        </ul>
      </nav>
      {!isAuthenticated ? (
        <button className="sidebar-login-button" onClick={() => loginWithRedirect()}>Log In</button>
      ) : (
        <button className="sidebar-login-button" onClick={() => logout({ returnTo: window.location.origin })}>Log Out</button>
      )}
    </div>
  );
}

export default Sidebar;
