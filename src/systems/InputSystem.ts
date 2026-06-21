// --- START OF FILE InputSystem.ts ---
export type ControlAction = 'throttle' | 'reverse' | 'brake' | 'left' | 'right' | 'camera' | 'radio';
export type ControlBindings = Record<ControlAction, string>;

export const DEFAULT_CONTROL_BINDINGS: ControlBindings = {
    throttle: 'KeyW',
    reverse: 'KeyS',
    brake: 'Space',
    left: 'KeyA',
    right: 'KeyD',
    camera: 'KeyC',
    radio: 'KeyR'
};

export class InputSystem {
    public keys: { [key: string]: boolean } = {};
    private previousActionStates: Partial<Record<ControlAction, boolean>> = {};
    private virtualActions: Partial<Record<ControlAction, boolean>> = {};
    private bindings: ControlBindings = { ...DEFAULT_CONTROL_BINDINGS };

    constructor() {
        this.init();
    }

    private init() {
        window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
        window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    }

    public isKeyPressed(code: string): boolean { return !!this.keys[code]; }

    public isActionPressed(action: ControlAction): boolean {
        return !!this.virtualActions[action] || this.isKeyPressed(this.bindings[action]);
    }

    public wasActionPressed(action: ControlAction): boolean {
        const pressed = this.isActionPressed(action);
        const wasPressed = !!this.previousActionStates[action];
        this.previousActionStates[action] = pressed;
        return pressed && !wasPressed;
    }

    public setBindings(bindings: ControlBindings) { this.bindings = { ...bindings }; }
    public setVirtualKey(code: string, pressed: boolean) { this.keys[code] = pressed; }
    public setVirtualAction(action: ControlAction, pressed: boolean) { this.virtualActions[action] = pressed; }
}