
document.addEventListener('DOMContentLoaded', () => {
  const particleContainer = document.getElementById('particle-container');
  const cursor = document.getElementById('cursor');
  const particles = new Set();

  const handleMouseMove = e => {
    cursor.style.opacity = 1;
    cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;

    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${e.clientX}px`;
    particle.style.top = `${e.clientY}px`;
    particle.style.width = particle.style.height = `${Math.random() * 6 + 4}px`;

    particleContainer.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 700);
  };

  document.addEventListener('mousemove', handleMouseMove);
});
