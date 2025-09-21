import React from 'react'
import '../styles/Footer.css';
const Footer = () => {
  return (
    <footer className="footer">
      <div className='footer-container'>
        <div className="social-icons">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook-f"></i></a>
          <a href="https://instagram.com"target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram"></i></a>
          <a href="https://twitter.com"target="_blank" rel="noopener noreferrer"><i className="fab fa-twitter"></i></a>
          <a href="https://linkedin.com"target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin-in"></i></a>
          <a href="https://youtube.com"target="_blank" rel="noopener noreferrer"><i className="fab fa-youtube"></i></a>
        </div>
        <div className="nav-links">
          <a href="/">Trang chủ</a>
          <a href="/news">Tin tức</a>
          <a href="/about">Giới thiệu</a>
          <a href="/contact">Liên hệ</a>
          <a href="/team">Đội ngũ</a>
        </div>
        <div className="footer-copy">
          <p>Copyright ©2025; Designed by C1SE.01</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
