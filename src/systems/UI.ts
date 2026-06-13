import * as THREE from 'three';
import { RoadSystem } from './RoadSystem';
import { DEFAULT_CONTROL_BINDINGS } from './InputSystem';
import type { ControlAction, ControlBindings } from './InputSystem';

export interface GameSettings {
    routeId: string;
    carColor: string;
    bindings: ControlBindings;
}

const SETTINGS_STORAGE_KEY = 'traffic-game-settings';

function isControlAction(value: string): value is ControlAction {
    return value === 'throttle' || value === 'brake' || value === 'left' || value === 'right' || value === 'camera';
}

export class UI {
    private timeLabel!: HTMLElement;
    private scoreLabel!: HTMLElement;
    private hitsLabel!: HTMLElement;
    private speedLabel!: HTMLElement;
    private mapCanvas!: HTMLCanvasElement;
    private mapContext!: CanvasRenderingContext2D;

    constructor(
        private onCameraToggle: () => void,
        private onGasChange: (pressed: boolean) => void,
        private onStart: (settings: GameSettings) => void
    ) {
        this.initHUD();
        this.showRouteSelect();
    }

    private initHUD() {
        const toggleBtn = document.createElement('button');
        toggleBtn.innerText = 'Toggle Camera';
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

        const gasBtn = document.createElement('button');
        gasBtn.innerText = 'GAS';
        gasBtn.style.position = 'absolute';
        gasBtn.style.bottom = '20px';
        gasBtn.style.right = '20px';
        gasBtn.style.width = '105px';
        gasBtn.style.height = '105px';
        gasBtn.style.borderRadius = '50%';
        gasBtn.style.fontSize = '22px';
        gasBtn.style.fontWeight = 'bold';
        gasBtn.style.cursor = 'pointer';
        gasBtn.style.backgroundColor = '#1f8f3a';
        gasBtn.style.color = '#fff';
        gasBtn.style.border = '3px solid #fff';
        gasBtn.style.touchAction = 'none';

        const setGas = (pressed: boolean) => {
            gasBtn.style.transform = pressed ? 'scale(0.94)' : 'scale(1)';
            gasBtn.style.backgroundColor = pressed ? '#2ebf50' : '#1f8f3a';
            this.onGasChange(pressed);
        };

        gasBtn.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            gasBtn.setPointerCapture(event.pointerId);
            setGas(true);
        });
        gasBtn.addEventListener('pointerup', () => setGas(false));
        gasBtn.addEventListener('pointercancel', () => setGas(false));
        gasBtn.addEventListener('pointerleave', () => setGas(false));
        document.body.appendChild(gasBtn);

        const statsBar = document.createElement('div');
        statsBar.style.position = 'absolute';
        statsBar.style.top = '0';
        statsBar.style.left = '0';
        statsBar.style.width = '100%';
        statsBar.style.padding = '15px';
        statsBar.style.display = 'flex';
        statsBar.style.justifyContent = 'center';
        statsBar.style.gap = '34px';
        statsBar.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        statsBar.style.color = '#fff';
        statsBar.style.fontFamily = 'Arial, sans-serif';
        statsBar.style.fontSize = '23px';
        statsBar.style.fontWeight = 'bold';
        statsBar.style.boxSizing = 'border-box';

        this.timeLabel = document.createElement('div');
        this.scoreLabel = document.createElement('div');
        this.hitsLabel = document.createElement('div');
        this.speedLabel = document.createElement('div');

        statsBar.appendChild(this.timeLabel);
        statsBar.appendChild(this.scoreLabel);
        statsBar.appendChild(this.hitsLabel);
        statsBar.appendChild(this.speedLabel);
        document.body.appendChild(statsBar);

        this.mapCanvas = document.createElement('canvas');
        this.mapCanvas.width = 190;
        this.mapCanvas.height = 250;
        this.mapCanvas.style.position = 'absolute';
        this.mapCanvas.style.top = '78px';
        this.mapCanvas.style.right = '18px';
        this.mapCanvas.style.width = '190px';
        this.mapCanvas.style.height = '250px';
        this.mapCanvas.style.backgroundColor = 'rgba(10, 14, 18, 0.78)';
        this.mapCanvas.style.border = '2px solid rgba(255, 255, 255, 0.75)';
        this.mapCanvas.style.borderRadius = '8px';
        this.mapContext = this.mapCanvas.getContext('2d') as CanvasRenderingContext2D;
        document.body.appendChild(this.mapCanvas);
    }

    public updateStats(timeLeft: number, distance: number, hits: number, speed: number) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = Math.floor(timeLeft % 60).toString().padStart(2, '0');
        const speedKmh = Math.max(0, Math.round(speed * 3.6));

        this.timeLabel.innerText = `Time: ${minutes}:${seconds}`;
        this.scoreLabel.innerText = `Score: ${Math.floor(distance)}`;
        this.hitsLabel.innerText = `Hits: ${hits}`;
        this.speedLabel.innerText = `SPD: ${speedKmh} km/h`;

        if (timeLeft <= 10) this.timeLabel.style.color = '#ff4444';
    }

    private loadSavedSettings(): GameSettings {
        const fallbackRoute = RoadSystem.ROUTE_VARIANTS[0]?.id ?? 'speed-loop';
        const fallback: GameSettings = {
            routeId: fallbackRoute,
            carColor: '#ffffff',
            bindings: { ...DEFAULT_CONTROL_BINDINGS }
        };

        try {
            const rawSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (!rawSettings) return fallback;

            const parsed = JSON.parse(rawSettings) as Partial<GameSettings>;
            const routeExists = RoadSystem.ROUTE_VARIANTS.some((route) => route.id === parsed.routeId);
            const bindings = { ...DEFAULT_CONTROL_BINDINGS };

            if (parsed.bindings && typeof parsed.bindings === 'object') {
                Object.entries(parsed.bindings).forEach(([action, code]) => {
                    if (isControlAction(action) && typeof code === 'string' && code.length > 0) {
                        bindings[action] = code;
                    }
                });
            }

            return {
                routeId: routeExists && parsed.routeId ? parsed.routeId : fallback.routeId,
                carColor: typeof parsed.carColor === 'string' ? parsed.carColor : fallback.carColor,
                bindings
            };
        } catch {
            return fallback;
        }
    }

    private saveSettings(settings: GameSettings) {
        try {
            window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        } catch {
            // Storage can be unavailable in restricted browser contexts; gameplay should still start.
        }
    }

    private showRouteSelect() {
        const colorOptions = [
            '#ffffff',
            '#e53935',
            '#1e88e5',
            '#43a047',
            '#fdd835',
            '#8e24aa'
        ];
        const actionLabels: Record<ControlAction, string> = {
            throttle: 'Accelerate',
            brake: 'Brake',
            left: 'Turn Left',
            right: 'Turn Right',
            camera: 'Camera'
        };
        const savedSettings = this.loadSavedSettings();
        const bindings: ControlBindings = { ...savedSettings.bindings };
        let selectedRouteId = savedSettings.routeId;
        let selectedColor = colorOptions.includes(savedSettings.carColor) ? savedSettings.carColor : colorOptions[0] as string;
        let captureAction: ControlAction | null = null;
        const bindingButtons = new Map<ControlAction, HTMLButtonElement>();
        const routeButtons = new Map<string, HTMLButtonElement>();
        const colorButtons: HTMLButtonElement[] = [];

        const formatKey = (code: string) => code
            .replace('Key', '')
            .replace('Arrow', '')
            .replace('Digit', '')
            .replace('Numpad', 'Num ');

        const refreshBindingButtons = () => {
            bindingButtons.forEach((button, action) => {
                button.innerText = captureAction === action ? 'Press key...' : formatKey(bindings[action]);
            });
        };

        const refreshRouteButtons = () => {
            routeButtons.forEach((button, routeId) => {
                const selected = routeId === selectedRouteId;
                button.style.backgroundColor = selected ? '#203a2a' : '#171b20';
                button.style.borderColor = selected ? '#42e66f' : 'rgba(255, 255, 255, 0.65)';
            });
        };

        const refreshColorButtons = () => {
            colorButtons.forEach((button) => {
                const selected = button.dataset.color === selectedColor;
                button.style.outline = selected ? '3px solid #ffffff' : 'none';
                button.style.transform = selected ? 'scale(1.08)' : 'scale(1)';
            });
        };

        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.inset = '0';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.gap = '18px';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.82)';
        overlay.style.color = '#fff';
        overlay.style.fontFamily = 'Arial, sans-serif';
        overlay.style.zIndex = '900';

        const title = document.createElement('h1');
        title.innerText = 'Choose Track';
        title.style.margin = '0';
        title.style.fontSize = '54px';
        title.style.letterSpacing = '0';
        overlay.appendChild(title);

        const options = document.createElement('div');
        options.style.display = 'grid';
        options.style.gridTemplateColumns = 'repeat(3, minmax(180px, 230px))';
        options.style.gap = '14px';
        options.style.maxWidth = '760px';
        options.style.width = 'calc(100% - 40px)';

        RoadSystem.ROUTE_VARIANTS.forEach((route) => {
            const button = document.createElement('button');
            button.style.minHeight = '132px';
            button.style.padding = '16px';
            button.style.borderRadius = '8px';
            button.style.border = '1px solid rgba(255, 255, 255, 0.65)';
            button.style.backgroundColor = '#171b20';
            button.style.color = '#fff';
            button.style.cursor = 'pointer';
            button.style.textAlign = 'left';
            button.style.fontFamily = 'Arial, sans-serif';

            const name = document.createElement('div');
            name.innerText = route.name;
            name.style.fontSize = '22px';
            name.style.fontWeight = 'bold';
            name.style.marginBottom = '10px';

            const description = document.createElement('div');
            description.innerText = route.description;
            description.style.fontSize = '15px';
            description.style.color = '#cbd5df';
            description.style.lineHeight = '1.35';

            button.appendChild(name);
            button.appendChild(description);
            button.onclick = () => {
                selectedRouteId = route.id;
                refreshRouteButtons();
            };
            routeButtons.set(route.id, button);
            options.appendChild(button);
        });

        overlay.appendChild(options);

        const settingsPanel = document.createElement('div');
        settingsPanel.style.display = 'grid';
        settingsPanel.style.gridTemplateColumns = 'minmax(260px, 360px) minmax(260px, 360px)';
        settingsPanel.style.gap = '14px';
        settingsPanel.style.width = 'calc(100% - 40px)';
        settingsPanel.style.maxWidth = '760px';

        const controlsPanel = document.createElement('div');
        controlsPanel.style.padding = '14px';
        controlsPanel.style.backgroundColor = 'rgba(12, 16, 20, 0.9)';
        controlsPanel.style.border = '1px solid rgba(255, 255, 255, 0.35)';
        controlsPanel.style.borderRadius = '8px';

        const controlsTitle = document.createElement('div');
        controlsTitle.innerText = 'Controls';
        controlsTitle.style.fontWeight = 'bold';
        controlsTitle.style.fontSize = '18px';
        controlsTitle.style.marginBottom = '10px';
        controlsPanel.appendChild(controlsTitle);

        (Object.keys(bindings) as ControlAction[]).forEach((action) => {
            const row = document.createElement('div');
            row.style.display = 'grid';
            row.style.gridTemplateColumns = '1fr 110px';
            row.style.alignItems = 'center';
            row.style.gap = '10px';
            row.style.marginBottom = '8px';

            const label = document.createElement('label');
            label.innerText = actionLabels[action];
            label.style.color = '#dce4ec';

            const button = document.createElement('button');
            button.type = 'button';
            button.style.height = '34px';
            button.style.borderRadius = '6px';
            button.style.border = '1px solid rgba(255, 255, 255, 0.55)';
            button.style.backgroundColor = '#222832';
            button.style.color = '#fff';
            button.style.cursor = 'pointer';
            button.style.fontWeight = 'bold';
            button.onclick = () => {
                captureAction = action;
                refreshBindingButtons();
            };

            bindingButtons.set(action, button);
            row.appendChild(label);
            row.appendChild(button);
            controlsPanel.appendChild(row);
        });

        const colorPanel = document.createElement('div');
        colorPanel.style.padding = '14px';
        colorPanel.style.backgroundColor = 'rgba(12, 16, 20, 0.9)';
        colorPanel.style.border = '1px solid rgba(255, 255, 255, 0.35)';
        colorPanel.style.borderRadius = '8px';

        const colorTitle = document.createElement('div');
        colorTitle.innerText = 'Car Color';
        colorTitle.style.fontWeight = 'bold';
        colorTitle.style.fontSize = '18px';
        colorTitle.style.marginBottom = '12px';
        colorPanel.appendChild(colorTitle);

        const swatches = document.createElement('div');
        swatches.style.display = 'flex';
        swatches.style.flexWrap = 'wrap';
        swatches.style.gap = '10px';

        colorOptions.forEach((color) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.color = color;
            button.style.width = '42px';
            button.style.height = '42px';
            button.style.borderRadius = '50%';
            button.style.border = '2px solid rgba(255, 255, 255, 0.8)';
            button.style.backgroundColor = color;
            button.style.cursor = 'pointer';
            button.onclick = () => {
                selectedColor = color;
                refreshColorButtons();
            };
            colorButtons.push(button);
            swatches.appendChild(button);
        });

        colorPanel.appendChild(swatches);
        settingsPanel.appendChild(controlsPanel);
        settingsPanel.appendChild(colorPanel);
        overlay.appendChild(settingsPanel);

        const startButton = document.createElement('button');
        startButton.innerText = 'Start Race';
        startButton.style.padding = '14px 34px';
        startButton.style.borderRadius = '8px';
        startButton.style.border = 'none';
        startButton.style.backgroundColor = '#42e66f';
        startButton.style.color = '#07120a';
        startButton.style.fontSize = '22px';
        startButton.style.fontWeight = 'bold';
        startButton.style.cursor = 'pointer';
        startButton.onclick = () => {
            const settings = {
                routeId: selectedRouteId,
                carColor: selectedColor,
                bindings: { ...bindings }
            };
            this.saveSettings(settings);
            this.onStart(settings);
            window.removeEventListener('keydown', captureKey, true);
            overlay.remove();
        };
        overlay.appendChild(startButton);

        const captureKey = (event: KeyboardEvent) => {
            if (!captureAction) return;
            event.preventDefault();
            event.stopPropagation();
            bindings[captureAction] = event.code;
            captureAction = null;
            refreshBindingButtons();
        };
        window.addEventListener('keydown', captureKey, true);

        refreshRouteButtons();
        refreshBindingButtons();
        refreshColorButtons();
        document.body.appendChild(overlay);
    }

    public updateMap(progressZ: number, carWorldX: number, _carWorldZ: number) {
        const ctx = this.mapContext;
        const width = this.mapCanvas.width;
        const height = this.mapCanvas.height;
        const roadHalfWidth = RoadSystem.ROAD_WIDTH / 2;
        const progress = THREE.MathUtils.clamp(progressZ / RoadSystem.COURSE_LENGTH, 0, 1);
        const referenceZ = RoadSystem.START_LINE_Z - progressZ;
        const lateralOffset = THREE.MathUtils.clamp(carWorldX, -roadHalfWidth, roadHalfWidth);
        const scale = Math.min((width - 34) / (RoadSystem.MAP_EXTENT * 2), (height - 62) / (RoadSystem.MAP_EXTENT * 2));
        const centerX = width / 2;
        const centerY = 128;

        ctx.clearRect(0, 0, width, height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Arial';
        ctx.fillText('CLOSED LOOP', 14, 15);

        const toCanvas = (point: THREE.Vector2) => ({
            x: centerX + point.x * scale,
            y: centerY + point.y * scale
        });

        const drawLoop = (sideOffset: number, color: string, lineWidth: number) => {
            ctx.beginPath();
            for (let i = 0; i <= 160; i++) {
                const sampleZ = RoadSystem.START_LINE_Z - (i / 160) * RoadSystem.LOOP_LENGTH;
                const point = toCanvas(RoadSystem.getLoopMapPoint(sampleZ, sideOffset));
                if (i === 0) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            }
            ctx.closePath();
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
        };

        drawLoop(-roadHalfWidth * 0.65, '#f5f5f5', 2);
        drawLoop(roadHalfWidth * 0.65, '#f5f5f5', 2);

        ctx.setLineDash([6, 6]);
        RoadSystem.getLaneLineOffsets().forEach((offset) => drawLoop(offset * 0.65, '#f1d33f', 1.2));
        ctx.setLineDash([]);

        const startPoint = toCanvas(RoadSystem.getLoopMapPoint(RoadSystem.START_LINE_Z));
        ctx.fillStyle = '#22cc55';
        ctx.fillRect(startPoint.x - 5, startPoint.y - 5, 10, 10);

        const carPoint = toCanvas(RoadSystem.getLoopMapPoint(referenceZ, lateralOffset * 0.65));
        ctx.fillStyle = '#42e66f';
        ctx.beginPath();
        ctx.arc(carPoint.x, carPoint.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(14, height - 20, width - 28, 8);
        ctx.fillStyle = '#42e66f';
        ctx.fillRect(14, height - 20, (width - 28) * progress, 8);
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px Arial';
        ctx.fillText(`${Math.round(progress * 100)}%`, width - 42, height - 24);
    }

    public showGameOver(finalScore: number, finalHits: number, titleText = 'TIME IS UP!') {
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
        title.innerText = titleText;
        title.style.fontSize = '64px';
        title.style.color = '#ffcc00';
        title.style.margin = '0 0 20px 0';

        const stats = document.createElement('p');
        stats.innerText = `Final Score: ${Math.floor(finalScore)}  |  Total Cones Hit: ${finalHits}`;
        stats.style.fontSize = '28px';
        stats.style.margin = '0 0 40px 0';

        const restartBtn = document.createElement('button');
        restartBtn.innerText = 'Restart Game';
        restartBtn.style.padding = '15px 30px';
        restartBtn.style.fontSize = '24px';
        restartBtn.style.fontWeight = 'bold';
        restartBtn.style.cursor = 'pointer';
        restartBtn.style.backgroundColor = '#28a745';
        restartBtn.style.color = '#fff';
        restartBtn.style.border = 'none';
        restartBtn.style.borderRadius = '8px';
        restartBtn.onclick = () => window.location.reload();

        overlay.appendChild(title);
        overlay.appendChild(stats);
        overlay.appendChild(restartBtn);
        document.body.appendChild(overlay);
    }
}
