export class UI {
    private timeLabel!: HTMLElement;
    private scoreLabel!: HTMLElement;
    private hitsLabel!: HTMLElement;

    constructor(private onCameraToggle: () => void) {
        this.initHUD();
    }

    private initHUD() {
        // 1. Camera Toggle Button (Bottom Left now)
        const toggleBtn = document.createElement('button');
        toggleBtn.innerText = '🎥 Toggle Camera';
        toggleBtn.style.position = 'absolute';
        toggleBtn.style.bottom = '20px';
        toggleBtn.style.left = '20px';
        toggleBtn.style.padding = '10px 15px';
        toggleBtn.style.fontSize = '14px';
        toggleBtn.style.fontWeight = 'bold';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.backgroundColor = '#111';
        toggleBtn.style.color = '#fff';
        toggleBtn.style.border = '2px solid #fff';
        toggleBtn.style.borderRadius = '8px';
        toggleBtn.onclick = () => this.onCameraToggle();
        document.body.appendChild(toggleBtn);

        // 2. Stats Bar (Top of screen)
        const statsBar = document.createElement('div');
        statsBar.style.position = 'absolute';
        statsBar.style.top = '0';
        statsBar.style.left = '0';
        statsBar.style.width = '100%';
        statsBar.style.padding = '15px';
        statsBar.style.display = 'flex';
        statsBar.style.justifyContent = 'center';
        statsBar.style.gap = '40px';
        statsBar.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        statsBar.style.color = '#fff';
        statsBar.style.fontFamily = 'Arial, sans-serif';
        statsBar.style.fontSize = '24px';
        statsBar.style.fontWeight = 'bold';
        statsBar.style.boxSizing = 'border-box';

        this.timeLabel = document.createElement('div');
        this.scoreLabel = document.createElement('div');
        this.hitsLabel = document.createElement('div');

        statsBar.appendChild(this.timeLabel);
        statsBar.appendChild(this.scoreLabel);
        statsBar.appendChild(this.hitsLabel);
        document.body.appendChild(statsBar);
    }

    // Called every frame by Game.ts
    public updateStats(timeLeft: number, distance: number, hits: number) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = Math.floor(timeLeft % 60).toString().padStart(2, '0');
        
        this.timeLabel.innerText = `⏱️ Time: ${minutes}:${seconds}`;
        this.scoreLabel.innerText = `🛣️ Score: ${Math.floor(distance)}`;
        this.hitsLabel.innerText = `💥 Hits: ${hits}`;
        
        if (timeLeft <= 10) this.timeLabel.style.color = '#ff4444'; // Turn red at 10 seconds!
    }

    // Called when timer hits 0
    public showGameOver(finalScore: number, finalHits: number) {
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.color = '#fff';
        overlay.style.fontFamily = 'Arial, sans-serif';
        overlay.style.zIndex = '1000';

        const title = document.createElement('h1');
        title.innerText = 'TIME IS UP!';
        title.style.fontSize = '64px';
        title.style.color = '#ffcc00';
        title.style.margin = '0 0 20px 0';

        const stats = document.createElement('p');
        stats.innerText = `Final Score: ${Math.floor(finalScore)}  |  Total Cones Hit: ${finalHits}`;
        stats.style.fontSize = '28px';
        stats.style.margin = '0 0 40px 0';

        const restartBtn = document.createElement('button');
        restartBtn.innerText = '🔄 Restart Game';
        restartBtn.style.padding = '15px 30px';
        restartBtn.style.fontSize = '24px';
        restartBtn.style.fontWeight = 'bold';
        restartBtn.style.cursor = 'pointer';
        restartBtn.style.backgroundColor = '#28a745';
        restartBtn.style.color = '#fff';
        restartBtn.style.border = 'none';
        restartBtn.style.borderRadius = '8px';
        
        // Refresh the page to perfectly restart the game
        restartBtn.onclick = () => window.location.reload(); 

        overlay.appendChild(title);
        overlay.appendChild(stats);
        overlay.appendChild(restartBtn);
        document.body.appendChild(overlay);
    }
}