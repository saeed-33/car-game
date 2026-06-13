export type ControlAction = 'throttle' | 'brake' | 'left' | 'right' | 'camera';
export type ControlBindings = Record<ControlAction, string>;

export const DEFAULT_CONTROL_BINDINGS: ControlBindings = {
    throttle: 'KeyW',
    brake: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    camera: 'KeyC'
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
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    // Other systems can call this to check if a key is pressed
    public isKeyPressed(code: string): boolean {
        return !!this.keys[code];
    }

    public isActionPressed(action: ControlAction): boolean {
        return !!this.virtualActions[action] || this.isKeyPressed(this.bindings[action]);
    }

    public wasActionPressed(action: ControlAction): boolean {
        const pressed = this.isActionPressed(action);
        const wasPressed = !!this.previousActionStates[action];
        this.previousActionStates[action] = pressed;
        return pressed && !wasPressed;
    }

    public setBindings(bindings: ControlBindings) {
        this.bindings = { ...bindings };
    }

    public setVirtualKey(code: string, pressed: boolean) {
        this.keys[code] = pressed;
    }

    public setVirtualAction(action: ControlAction, pressed: boolean) {
        this.virtualActions[action] = pressed;
    }
}
