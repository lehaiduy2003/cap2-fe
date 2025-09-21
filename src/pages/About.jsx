import React from "react";
import {Link} from "react-router-dom";
import "../styles/About.css";
function About() {
  const dummyRooms = [
    {
      id: 1,
      name: "Cozy Apartment",
      price: "$500/month",
      userName: "John Doe",
      avatar: "https://i.pravatar.cc/100?img=1",
      image: "https://source.unsplash.com/featured/?room",
    },
    {
      id: 2,
      name: "Modern Studio",
      price: "$750/month",
      userName: "Anna Smith",
      avatar: "https://i.pravatar.cc/100?img=2",
      image: "https://source.unsplash.com/featured/?apartment",
    },
  ];
  
  return (
    <div className="presentation-wrapper">
    <div className="presentation-card">
      <div className="logo">LOGO</div>
      <div className="circle-bg"></div>
      <div className="content">
        <p className="year">20XX</p>
        <p className="subtitle">BUSINESS SUMMARY</p>
        <h1 className="title">FREE PPT TEMPLATE</h1>
        <p className="desc">Insert the Subtitle of Your Presentation</p>
        <a href="https://www.freeppt7.com" className="btn">www.freeppt7.com</a>
      </div>
      <div className="icon-doc">📄</div>
    </div>
  </div>
  );
}

export default About;