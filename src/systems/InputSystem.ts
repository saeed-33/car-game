export class InputSystem {
    public keys: { [key: string]: boolean } = {};

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
}