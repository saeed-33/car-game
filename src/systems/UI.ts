export class UI {
    // We pass a callback function so the UI can talk to the GameScene without being tightly coupled
    constructor(private onCameraToggle: () => void) {
        this.initHUD();
    }

    private initHUD() {
        // Create a container for our UI
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '20px';
        container.style.left = '20px';
        container.style.fontFamily = 'Arial, sans-serif';

        // Create the Toggle Camera button
        const toggleBtn = document.createElement('button');
        toggleBtn.innerText = '🎥 Toggle Camera View';
        toggleBtn.style.padding = '12px 20px';
        toggleBtn.style.fontSize = '16px';
        toggleBtn.style.fontWeight = 'bold';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.backgroundColor = '#111111';
        toggleBtn.style.color = '#ffffff';
        toggleBtn.style.border = '2px solid #ffffff';
        toggleBtn.style.borderRadius = '8px';
        
        // Add the click event
        toggleBtn.onclick = () => {
            this.onCameraToggle();
        };

        container.appendChild(toggleBtn);
        document.body.appendChild(container);
    }
}