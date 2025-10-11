<script>
  import { onMount, onDestroy } from 'svelte';

  export let theme = 'auto'; // 'auto', 'light', or 'dark'
  
  let canvas;
  let ctx;
  let animationId;
  let isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Use theme prop if not auto
  $: {
    if (theme !== 'auto') {
      isDarkMode = theme === 'dark';
    }
  }
  
  class Particle {
    constructor(canvas) {
      this.canvas = canvas;
      this.iconType = Math.floor(Math.random() * 5); // 0: $, 1: coin, 2: graph, 3: budget, 4: flow
      this.size = Math.random() * 20 + 10;
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.speedX = Math.random() * 1 - 0.5;
      this.speedY = Math.random() * 1 - 0.5;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.02;
    }
    
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.rotation += this.rotationSpeed;
      
      // Bounce off edges
      if (this.x < 0 || this.x > this.canvas.width) this.speedX = -this.speedX;
      if (this.y < 0 || this.y > this.canvas.height) this.speedY = -this.speedY;
    }
    
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      
      const color = isDarkMode ? 'rgba(129, 140, 248, 0.7)' : 'rgba(79, 70, 229, 0.7)';
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      
      // Draw different financial icons based on iconType
      switch(this.iconType) {
        case 0: // Dollar sign
          ctx.font = `${this.size}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', 0, 0);
          break;
        case 1: // Coin
          ctx.beginPath();
          ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, this.size/3, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case 2: // Graph
          ctx.beginPath();
          ctx.moveTo(-this.size/2, this.size/3);
          ctx.lineTo(-this.size/6, -this.size/6);
          ctx.lineTo(0, this.size/4);
          ctx.lineTo(this.size/3, -this.size/3);
          ctx.stroke();
          break;
        case 3: // Budget icon
          ctx.beginPath();
          ctx.rect(-this.size/2, -this.size/3, this.size, this.size/1.5);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-this.size/3, -this.size/6);
          ctx.lineTo(this.size/3, -this.size/6);
          ctx.stroke();
          break;
        case 4: // Flow icon
          ctx.beginPath();
          ctx.moveTo(-this.size/2, 0);
          ctx.quadraticCurveTo(0, -this.size/2, this.size/2, 0);
          ctx.quadraticCurveTo(0, this.size/2, -this.size/2, 0);
          ctx.stroke();
          break;
      }
      
      ctx.restore();
    }
  }
  
  function createGradient(ctx) {
    const gradient = isDarkMode 
      ? ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      : ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      
    if (isDarkMode) {
      gradient.addColorStop(0, 'rgba(31, 41, 55, 1)'); // dark:from-gray-900
      gradient.addColorStop(0.5, 'rgba(31, 41, 55, 1)'); // dark:via-gray-900
      gradient.addColorStop(1, 'rgba(30, 27, 75, 1)'); // dark:to-indigo-950
    } else {
      gradient.addColorStop(0, 'rgba(238, 242, 255, 1)'); // from-indigo-50
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)'); // via-white
      gradient.addColorStop(1, 'rgba(236, 254, 255, 1)'); // to-cyan-50
    }
    
    return gradient;
  }
  
  let particles = [];
  
  // Initialize the canvas animation
  function initCanvas() {
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    
    // Set canvas size to match window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Create particles
    particles = [];
    const particleCount = Math.min(50, Math.floor((canvas.width * canvas.height) / 20000));
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(canvas));
    }
    
    // Start animation loop
    animate();
  }
  
  function animate() {
    animationId = requestAnimationFrame(animate);
    
    // Clear canvas with semi-transparent gradient to create trail effect
    ctx.fillStyle = createGradient(ctx);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    particles.forEach(particle => {
      particle.update();
      particle.draw(ctx);
    });
    
    // Draw subtle grid pattern
    drawGrid();
  }
  
  function drawGrid() {
    const gridSize = 40;
    const gridColor = isDarkMode ? 'rgba(107, 114, 128, 0.07)' : 'rgba(107, 114, 128, 0.04)';
    
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }
  
  // Handle window resize
  function handleResize() {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }
  
  // Handle color scheme change
  function handleColorSchemeChange(e) {
    if (theme === 'auto') {
      isDarkMode = e.matches;
    }
  }
  
  onMount(() => {
    // Initialize canvas after component is mounted
    initCanvas();
    
    // Add event listeners
    window.addEventListener('resize', handleResize);
    
    const colorSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
    colorSchemeMedia.addEventListener('change', handleColorSchemeChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      colorSchemeMedia.removeEventListener('change', handleColorSchemeChange);
      
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  });
</script>

<canvas 
  bind:this={canvas} 
  class="absolute top-0 left-0 w-full h-full -z-10"
></canvas>