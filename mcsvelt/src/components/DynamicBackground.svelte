<script lang="ts">
  import { onMount } from 'svelte';
  
  let colorGrid: HTMLDivElement;
  let colors = ['#ff7e79', '#ffda79', '#ffa979', '#79ff97', '#79caff', '#c679ff', '#ff79c6'];
  let gridSize = 5;
  let animationFrameId = 0;
  
  function createGrid() {
    colorGrid.innerHTML = '';
    const cellSize = Math.max(window.innerWidth, window.innerHeight) / gridSize;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const cell = document.createElement('div');
        cell.className = 'color-cell';
        cell.style.width = `${cellSize}px`;
        cell.style.height = `${cellSize}px`;
        cell.style.left = `${j * cellSize}px`;
        cell.style.top = `${i * cellSize}px`;
        cell.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        cell.style.opacity = '0';
        colorGrid.appendChild(cell);
      }
    }
  }
  
  function animateBackground() {
    const cells = colorGrid.querySelectorAll('.color-cell');
    cells.forEach((cell) => {
      const element = cell as HTMLElement;
      const randomDelay = Math.random() * 5000;
      const randomDuration = 3000 + Math.random() * 7000;
      
      setTimeout(() => {
        element.style.opacity = '0.15';
        element.style.transition = `opacity ${randomDuration}ms ease-in-out, background-color ${randomDuration}ms ease-in-out`;
        
        setTimeout(() => {
          element.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
          element.style.opacity = '0';
          
          setTimeout(() => {
            animateCell(element);
          }, randomDuration);
        }, randomDuration);
      }, randomDelay);
    });
  }
  
  function animateCell(cell: HTMLElement) {
    const randomDuration = 3000 + Math.random() * 7000;
    cell.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    cell.style.opacity = '0.15';
    cell.style.transition = `opacity ${randomDuration}ms ease-in-out, background-color ${randomDuration}ms ease-in-out`;
    
    setTimeout(() => {
      cell.style.opacity = '0';
      setTimeout(() => {
        animateCell(cell);
      }, randomDuration);
    }, randomDuration);
  }
  
  function updateBackground(dominantColors?: string[]) {
    if (dominantColors && dominantColors.length) {
      colors = dominantColors;
      const cells = colorGrid.querySelectorAll('.color-cell');
      cells.forEach((cell) => {
        const element = cell as HTMLElement;
        element.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      });
    }
  }
  
  onMount(() => {
    createGrid();
    animateBackground();
    
    const handleResize = () => {
      createGrid();
      animateBackground();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  });
</script>

<div class="dynamic-background-container fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
  <div class="color-grid" bind:this={colorGrid}></div>
</div>

<style>
  .dynamic-background-container {
    background-color: #0a0a0a;
  }
  
  .color-grid {
    position: relative;
    width: 100%;
    height: 100%;
  }
  
  :global(.color-cell) {
    position: absolute;
    border-radius: 50%;
    filter: blur(30px);
    transform: scale(1.5);
  }
</style> 