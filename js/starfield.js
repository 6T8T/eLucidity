  window.onload = () => {
    const canvas = document.getElementById('starfield');
    const ctx = canvas.getContext('2d');

    if (!canvas || !ctx) {
      console.error('❌ Canvas or context not found.');
      return;
    }

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log("✅ Canvas size set to:", canvas.width, canvas.height);
    }

    resizeCanvas();
    
    let resizeTimeout;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resizeCanvas();
        createStars(); // Recreate stars on resize to prevent artifacts
      }, 250);
    };
    window.addEventListener('resize', handleResize);

    const starSpeed = 1.8;
    const numStars = 400;
    let stars = [];

    function createStars() {
      stars = [];
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: (Math.random() - 0.5) * canvas.width,
          y: (Math.random() - 0.5) * canvas.height,
          z: Math.random() * canvas.width
        });
      }
    }

    function updateStars() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let star of stars) {
        star.z -= starSpeed;
        if (star.z <= 0) {
          star.z = canvas.width;
          star.x = (Math.random() - 0.5) * canvas.width;
          star.y = (Math.random() - 0.5) * canvas.height;
        }

        const k = 128.0 / star.z;
        const sx = star.x * k + canvas.width / 2;
        const sy = star.y * k + canvas.height / 2;
        const radius = (1 - star.z / canvas.width) * 2;

        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(160, 255, 255, 0.7)';
        ctx.fill();
      }

      requestAnimationFrame(updateStars);
    }

    createStars();
    updateStars();
  };
