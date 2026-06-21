// --- START OF FILE UI.ts ---
import * as THREE from 'three';
import { RoadSystem } from './RoadSystem';
import { DEFAULT_CONTROL_BINDINGS } from './InputSystem';
import type { ControlAction, ControlBindings } from './InputSystem';

export interface GameSettings {
    routeId: string;
    carModel: string;
    carColor: string;
    sfxVolume: number;
    musicVolume: number;
    bindings: ControlBindings;
}

const SETTINGS_STORAGE_KEY = 'traffic-game-settings';

export const AVAILABLE_CARS = [
    { id: 'default', name: 'Sports Car', path: '/models/car.glb', scale: 1.0, rotationY: 0, offsetY: 0.8 },
    {
        id: '1', name: 'hyundai', path: '/models/suzuki_carry_minivan.glb', scale: 0.008, rotationY: -3 * Math.PI / 4, offsetY: 0.8, frontWheels: ['Object_4', 'Object_5'], // <-- Change these to the real names from the viewer
        rearWheels: ['Object_6', 'Object_7']
    },
    {
        id: '2', name: 'mini', path: '/models/mitsubishi_minicab_2005.glb', scale: 0.5, rotationY: -Math.PI / 2, offsetY: 0.8, frontWheels: ['Object_4', 'Object_5'], // <-- Change these to the real names from the viewer
        rearWheels: ['Object_6', 'Object_7']
    },


    // You can add more cars here later! example:
    // { id: 'suv', name: 'SUV Offroader', path: '/models/suv.glb' }
];

function isControlAction(value: string): value is ControlAction {
    return ['throttle', 'reverse', 'brake', 'left', 'right', 'camera', 'radio'].includes(value);
}

export class UI {
    private timeLabel!: HTMLElement;
    private scoreLabel!: HTMLElement;
    private hitsLabel!: HTMLElement;
    private speedLabel!: HTMLElement;
    private buffLabel!: HTMLElement;
    private radioLabel!: HTMLButtonElement;
    private mapCanvas!: HTMLCanvasElement;
    private mapContext!: CanvasRenderingContext2D;

    constructor(
        private onCameraToggle: () => void,
        private onGasChange: (pressed: boolean) => void,
        private onReverseChange: (pressed: boolean) => void,
        private onBrakeChange: (pressed: boolean) => void,
        private onStart: (settings: GameSettings) => void,
        private onRadioNext: () => void
    ) {
        this.initHUD();
        this.showRouteSelect();
    }

    private initHUD() {
        // ... (Camera Toggle Button)
        const toggleBtn = document.createElement('button');
        toggleBtn.innerText = 'Toggle Camera';
        toggleBtn.style.position = 'absolute';
        toggleBtn.style.bottom = '20px';
        toggleBtn.style.left = '20px';
        toggleBtn.style.padding = '10px 15px';
        toggleBtn.style.backgroundColor = '#111';
        toggleBtn.style.color = '#fff';
        toggleBtn.onclick = () => this.onCameraToggle();
        document.body.appendChild(toggleBtn);

        // CREATE PEDALS
        const createPedal = (text: string, color: string, activeColor: string, right: string, bottom: string, callback: (p: boolean) => void) => {
            const btn = document.createElement('button');
            btn.innerText = text;
            btn.style.position = 'absolute';
            btn.style.bottom = bottom;
            btn.style.right = right;
            btn.style.width = '80px';
            btn.style.height = '80px';
            btn.style.borderRadius = '50%';
            btn.style.fontSize = '16px';
            btn.style.fontWeight = 'bold';
            btn.style.backgroundColor = color;
            btn.style.color = '#fff';
            btn.style.touchAction = 'none';

            const setPressed = (pressed: boolean) => {
                btn.style.transform = pressed ? 'scale(0.94)' : 'scale(1)';
                btn.style.backgroundColor = pressed ? activeColor : color;
                callback(pressed);
            };

            btn.addEventListener('pointerdown', (e) => { e.preventDefault(); btn.setPointerCapture(e.pointerId); setPressed(true); });
            btn.addEventListener('pointerup', () => setPressed(false));
            btn.addEventListener('pointercancel', () => setPressed(false));
            btn.addEventListener('pointerleave', () => setPressed(false));
            document.body.appendChild(btn);
        };

        createPedal('GAS', '#1f8f3a', '#2ebf50', '20px', '110px', this.onGasChange);
        createPedal('REV', '#d4a017', '#e8b835', '20px', '20px', this.onReverseChange);
        createPedal('BRAKE', '#d32f2f', '#e53935', '110px', '20px', this.onBrakeChange);

        // Stats Bar
        const statsBar = document.createElement('div');
        statsBar.style.position = 'absolute'; statsBar.style.top = '0'; statsBar.style.left = '0'; statsBar.style.width = '100%'; statsBar.style.padding = '15px'; statsBar.style.display = 'flex'; statsBar.style.justifyContent = 'center'; statsBar.style.gap = '34px'; statsBar.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; statsBar.style.color = '#fff'; statsBar.style.fontSize = '23px'; statsBar.style.fontWeight = 'bold';
        this.timeLabel = document.createElement('div'); this.scoreLabel = document.createElement('div'); this.hitsLabel = document.createElement('div'); this.speedLabel = document.createElement('div');
        statsBar.append(this.timeLabel, this.scoreLabel, this.hitsLabel, this.speedLabel);
        document.body.appendChild(statsBar);

        this.buffLabel = document.createElement('div');
        this.buffLabel.style.position = 'absolute'; this.buffLabel.style.top = '65px'; this.buffLabel.style.left = '50%'; this.buffLabel.style.transform = 'translateX(-50%)'; this.buffLabel.style.fontSize = '26px'; this.buffLabel.style.fontWeight = 'bold'; this.buffLabel.style.textShadow = '2px 2px 4px #000';
        document.body.appendChild(this.buffLabel);

        this.radioLabel = document.createElement('button');
        this.radioLabel.innerText = '📻 Radio: Loading...';
        this.radioLabel.style.position = 'absolute'; this.radioLabel.style.top = '78px'; this.radioLabel.style.left = '18px'; this.radioLabel.style.padding = '12px 18px'; this.radioLabel.style.backgroundColor = 'rgba(10, 14, 18, 0.78)'; this.radioLabel.style.color = '#42e66f'; this.radioLabel.style.borderRadius = '8px'; this.radioLabel.style.cursor = 'pointer'; this.radioLabel.style.fontWeight = 'bold';
        this.radioLabel.onclick = () => { this.radioLabel.style.transform = 'scale(0.95)'; setTimeout(() => this.radioLabel.style.transform = 'scale(1)', 100); this.onRadioNext(); };
        document.body.appendChild(this.radioLabel);

        this.mapCanvas = document.createElement('canvas');
        this.mapCanvas.width = 190; this.mapCanvas.height = 250; this.mapCanvas.style.position = 'absolute'; this.mapCanvas.style.top = '78px'; this.mapCanvas.style.right = '18px'; this.mapCanvas.style.backgroundColor = 'rgba(10, 14, 18, 0.78)'; this.mapCanvas.style.border = '2px solid rgba(255, 255, 255, 0.75)'; this.mapCanvas.style.borderRadius = '8px';
        this.mapContext = this.mapCanvas.getContext('2d') as CanvasRenderingContext2D;
        document.body.appendChild(this.mapCanvas);
    }

    public updateRadioName(trackName: string) {
        this.radioLabel.innerText = `📻 ${trackName} (Click to change)`;
        this.radioLabel.style.color = trackName === "Radio OFF" ? '#aaa' : '#42e66f';
    }

    public updateStats(timeLeft: number, dist: number, hits: number, spd: number, turbo: boolean, shield: boolean) {
        this.timeLabel.innerText = `Time: ${Math.floor(timeLeft / 60)}:${Math.floor(timeLeft % 60).toString().padStart(2, '0')}`;
        this.scoreLabel.innerText = `Score: ${Math.floor(dist)}`;
        this.hitsLabel.innerText = `Hits: ${hits}`;
        this.speedLabel.innerText = `SPD: ${Math.max(0, Math.round(spd * 3.6))} km/h`;
        if (timeLeft <= 10) this.timeLabel.style.color = '#ff4444';

        if (turbo && shield) { this.buffLabel.innerText = '🔥 TURBO + SHIELD 🛡️'; this.buffLabel.style.color = '#ffcc00'; }
        else if (turbo) { this.buffLabel.innerText = '🔥 TURBO ACTIVE! 🔥'; this.buffLabel.style.color = '#00aaff'; }
        else if (shield) { this.buffLabel.innerText = '🛡️ SHIELD ACTIVE! 🛡️'; this.buffLabel.style.color = '#ffcc00'; }
        else { this.buffLabel.innerText = ''; }
    }

    private loadSavedSettings(): GameSettings {
        const fb: GameSettings = { routeId: 'speed-loop', carModel: AVAILABLE_CARS[0]!.path, carColor: '#ffffff', sfxVolume: 1.0, musicVolume: 1.0, bindings: { ...DEFAULT_CONTROL_BINDINGS } };
        try {
            const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (!raw) return fb;
            const p = JSON.parse(raw);
            const bindings = { ...DEFAULT_CONTROL_BINDINGS };
            if (p.bindings) Object.entries(p.bindings).forEach(([a, c]) => { if (isControlAction(a) && typeof c === 'string') bindings[a as ControlAction] = c; });
            return {
                routeId: p.routeId || fb.routeId, carModel: p.carModel || fb.carModel, carColor: p.carColor || fb.carColor,
                sfxVolume: p.sfxVolume ?? fb.sfxVolume, musicVolume: p.musicVolume ?? fb.musicVolume, bindings
            };
        } catch { return fb; }
    }

    private saveSettings(s: GameSettings) { try { window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(s)); } catch { } }

    private showRouteSelect() {
        const saved = this.loadSavedSettings();
        const bindings = { ...saved.bindings };
        let settings = { ...saved };
        let captureAction: ControlAction | null = null;

        const overlay = document.createElement('div');
        overlay.style.position = 'absolute'; overlay.style.inset = '0'; overlay.style.display = 'flex'; overlay.style.flexDirection = 'column'; overlay.style.alignItems = 'center'; overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'; overlay.style.color = '#fff'; overlay.style.fontFamily = 'Arial'; overlay.style.zIndex = '900'; overlay.style.overflowY = 'auto'; overlay.style.padding = '40px';

        const title = document.createElement('h1'); title.innerText = 'Game Setup'; overlay.appendChild(title);

        // 1. TRACK SELECT
        const trackDiv = document.createElement('div'); trackDiv.style.display = 'flex'; trackDiv.style.gap = '10px'; trackDiv.style.marginBottom = '20px';
        RoadSystem.ROUTE_VARIANTS.forEach(r => {
            const b = document.createElement('button'); b.innerText = r.name; b.style.padding = '10px'; b.style.cursor = 'pointer';
            b.style.backgroundColor = settings.routeId === r.id ? '#42e66f' : '#333';
            b.onclick = () => { settings.routeId = r.id; Array.from(trackDiv.children).forEach((c: any) => c.style.backgroundColor = '#333'); b.style.backgroundColor = '#42e66f'; };
            trackDiv.appendChild(b);
        });
        overlay.appendChild(trackDiv);

        // 2. CAR SELECT
        const carDiv = document.createElement('div'); carDiv.style.display = 'flex'; carDiv.style.gap = '10px'; carDiv.style.marginBottom = '20px';
        AVAILABLE_CARS.forEach(c => {
            const b = document.createElement('button'); b.innerText = c.name; b.style.padding = '10px'; b.style.cursor = 'pointer';
            b.style.backgroundColor = settings.carModel === c.path ? '#1e88e5' : '#333';
            b.onclick = () => { settings.carModel = c.path; Array.from(carDiv.children).forEach((ch: any) => ch.style.backgroundColor = '#333'); b.style.backgroundColor = '#1e88e5'; };
            carDiv.appendChild(b);
        });
        overlay.appendChild(carDiv);

        // 3. COLOR SELECT
        const colorDiv = document.createElement('div'); colorDiv.style.display = 'flex'; colorDiv.style.gap = '10px'; colorDiv.style.marginBottom = '20px';
        ['#ffffff', '#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#111111'].forEach(c => {
            const b = document.createElement('button'); b.style.width = '40px'; b.style.height = '40px'; b.style.backgroundColor = c; b.style.borderRadius = '50%'; b.style.cursor = 'pointer';
            b.style.border = settings.carColor === c ? '3px solid #fff' : 'none';
            b.onclick = () => { settings.carColor = c; Array.from(colorDiv.children).forEach((ch: any) => ch.style.border = 'none'); b.style.border = '3px solid #fff'; };
            colorDiv.appendChild(b);
        });
        overlay.appendChild(colorDiv);

        // 4. AUDIO SLIDERS
        const audioDiv = document.createElement('div'); audioDiv.style.marginBottom = '20px'; audioDiv.style.width = '300px';
        const createSlider = (label: string, val: number, onChange: (v: number) => void) => {
            const wrap = document.createElement('div'); wrap.style.display = 'flex'; wrap.style.justifyContent = 'space-between'; wrap.style.marginBottom = '10px';
            const l = document.createElement('label'); l.innerText = label;
            const inp = document.createElement('input'); inp.type = 'range'; inp.min = '0'; inp.max = '1'; inp.step = '0.05'; inp.value = val.toString();
            inp.oninput = (e) => onChange(parseFloat((e.target as HTMLInputElement).value));
            wrap.append(l, inp); return wrap;
        };
        audioDiv.appendChild(createSlider('SFX Volume', settings.sfxVolume, v => settings.sfxVolume = v));
        audioDiv.appendChild(createSlider('Radio Music', settings.musicVolume, v => settings.musicVolume = v));
        overlay.appendChild(audioDiv);

        // 5. CONTROLS
        const controlsDiv = document.createElement('div'); controlsDiv.style.display = 'grid'; controlsDiv.style.gridTemplateColumns = '1fr 1fr'; controlsDiv.style.gap = '10px'; controlsDiv.style.marginBottom = '30px';
        const actionLabels: Record<ControlAction, string> = { throttle: 'Gas', reverse: 'Reverse', brake: 'Brake', left: 'Left', right: 'Right', camera: 'Camera', radio: 'Radio' };

        Object.keys(bindings).forEach(a => {
            const action = a as ControlAction;
            const btn = document.createElement('button'); btn.innerText = `${actionLabels[action]}: ${bindings[action]}`; btn.style.padding = '8px';
            btn.onclick = () => { captureAction = action; btn.innerText = 'Press Key...'; };
            window.addEventListener('keydown', (e) => {
                if (captureAction === action) { e.preventDefault(); bindings[action] = e.code; btn.innerText = `${actionLabels[action]}: ${e.code}`; captureAction = null; }
            });
            controlsDiv.appendChild(btn);
        });
        overlay.appendChild(controlsDiv);

        // START BUTTON
        const startBtn = document.createElement('button'); startBtn.innerText = 'START RACE'; startBtn.style.padding = '15px 40px'; startBtn.style.fontSize = '24px'; startBtn.style.backgroundColor = '#42e66f'; startBtn.style.cursor = 'pointer';
        startBtn.onclick = () => {
            settings.bindings = bindings;
            this.saveSettings(settings);
            this.onStart(settings);
            overlay.remove();
        };
        overlay.appendChild(startBtn);
        document.body.appendChild(overlay);
    }

    // ... Keep map function
    public updateMap(progressZ: number, carWorldX: number, _carWorldZ: number) {
        // [KEEP YOUR EXACT updateMap FUNCTION CODE HERE]
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
        // [KEEP YOUR EXACT showGameOver FUNCTION CODE HERE]
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