import React, { useEffect } from "react";
import "./NotFound.css";
import { Link } from "react-router-dom";
import space from "../assets/img/space.webp"
const NotFound = () => {
  useEffect(() => {
    const container = document.querySelector(".not-found");

    const createStar = () => {
      const right = Math.random() * 500;
      const top = Math.random() * container.offsetHeight;
      const star = document.createElement("div");
      star.classList.add("star");
      container.appendChild(star);

      let currentRight = right;
      const runStar = () => {
        if (currentRight >= container.offsetWidth) {
          star.remove();
        } else {
          currentRight += 3;
          star.style.right = `${currentRight}px`;
        }
      };

      setInterval(runStar, 10);
      star.style.top = `${top}px`;
    };

    const interval = setInterval(createStar, 100);

    return () => {
      clearInterval(interval);
      container.innerHTML = ""; // Cleanup stars
    };
  }, []);

  return (
    <div className="not-found">
      <div className="text">
      <div className="not-found-error">Page Not Found </div>

        <h1>404</h1>
        <hr />
        <div className="not-found-error">Go To <Link to="/home/chat">Home</Link></div>
      </div>

      <div className="astronaut">
        <img
          src={space}
          alt="Astronaut"
        />
      </div>
    </div>
  );
};

export default NotFound;
