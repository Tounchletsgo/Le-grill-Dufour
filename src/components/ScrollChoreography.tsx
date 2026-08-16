"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import "@/styles/scroll-choreography.css";

interface ScrollChoreographyProps {
  images: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  };
}

export default function ScrollChoreography({ images }: ScrollChoreographyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 400,
    damping: 50,
    mass: 1.2,
    restDelta: 0.001,
  });

  const xLeft = isMobile ? "-30vw" : "-20vw";
  const xRight = isMobile ? "30vw" : "20vw";
  const yTop = isMobile ? "-10vh" : "-14vh";
  const yBottom = isMobile ? "10vh" : "14vh";
  const imgSize = isMobile ? "42vw" : "36vw";
  const imgHeight = isMobile ? "18vh" : "24vh";

  const tlX = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [xLeft, xLeft, xLeft, "0vw", "0vw"]);
  const tlY = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [yTop, yBottom, yBottom, "0vh", "0vh"]);

  const brX = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [xRight, xRight, xRight, "0vw", "0vw"]);
  const brY = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [yBottom, yTop, yTop, "0vh", "0vh"]);

  const blX = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [xLeft, xLeft, xLeft, "0vw", "0vw"]);
  const blY = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [yBottom, yBottom, yBottom, "0vh", "0vh"]);

  const trX = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [xRight, xRight, xRight, "0vw", "0vw"]);
  const trY = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [yTop, yTop, yTop, "0vh", "0vh"]);

  const heroWidth = useTransform(smoothProgress, [0.65, 0.7, 0.9, 1], [imgSize, imgSize, "100vw", "100vw"]);
  const heroHeight = useTransform(smoothProgress, [0.65, 0.7, 0.9, 1], [imgHeight, imgHeight, "100vh", "100vh"]);

  const underImagesOpacity = useTransform(smoothProgress, [0.75, 0.85], [1, 0]);

  return (
    <div ref={containerRef} className="sc-container">
      <div className="sc-sticky">
        <div className="sc-center">
          <motion.div
            style={{ x: tlX, y: tlY, opacity: underImagesOpacity, width: imgSize, height: imgHeight }}
            className="sc-image sc-z10"
          >
            <img src={images.topLeft} alt="Le restaurant" loading="lazy" />
          </motion.div>

          <motion.div
            style={{ x: brX, y: brY, opacity: underImagesOpacity, width: imgSize, height: imgHeight }}
            className="sc-image sc-z20"
          >
            <img src={images.bottomRight} alt="Nos grillades" loading="lazy" />
          </motion.div>

          <motion.div
            style={{ x: blX, y: blY, opacity: underImagesOpacity, width: imgSize, height: imgHeight }}
            className="sc-image sc-z30"
          >
            <img src={images.bottomLeft} alt="Notre cuisine" loading="lazy" />
          </motion.div>

          <motion.div
            style={{ x: trX, y: trY, width: heroWidth, height: heroHeight }}
            className="sc-image sc-z40"
          >
            <img src={images.topRight} alt="Grill Dufour" loading="lazy" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
