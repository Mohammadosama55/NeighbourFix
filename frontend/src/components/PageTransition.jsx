import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
  const location = useLocation();
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('pt-enter');
    void el.offsetWidth;
    el.classList.add('pt-enter');
  }, [location.pathname]);

  return (
    <div ref={ref} className="pt-enter">
      {children}
    </div>
  );
}
