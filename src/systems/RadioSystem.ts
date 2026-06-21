// --- START OF FILE RadioSystem.ts ---
export interface RadioTrack {
    name: string;
    url: string;
}

export class RadioSystem {
    private audio: HTMLAudioElement;
    private currentTrackIndex = 0;
    private baseVolume = 1.0; // NEW: Volume multiplier
    
    private tracks: RadioTrack[] = [
        { name: "Radio OFF", url: "" },
         { name: "Song 5", url: "/sounds/song5.m4a" },
        { name: "Song 1", url: "/sounds/song1.mp3" },
        { name: "Song 2", url: "/sounds/song2.mp3" },
        { name: "Song 3", url: "/sounds/song3.mp3" },
        { name: "Song 4", url: "/sounds/song4.mp3" },
    ];

    constructor(private onTrackChange: (trackName: string) => void) {
        this.audio = new Audio();
        this.audio.loop = true;   
    }

    // NEW: Apply volume setting
    public setVolume(volume: number) {
        this.baseVolume = volume;
        this.audio.volume = this.baseVolume * 0.35; // Keep radio slightly quieter than game
    }

    public init() {
        this.currentTrackIndex = 1; 
        this.playCurrentTrack();
    }

    public nextTrack() {
        this.currentTrackIndex++;
        if (this.currentTrackIndex >= this.tracks.length) this.currentTrackIndex = 0;
        this.playCurrentTrack();
    }

    private playCurrentTrack() {
        const track = this.tracks[this.currentTrackIndex];
        if (track.url === "") {
            this.audio.pause(); 
        } else {
            this.audio.src = track.url;
            this.audio.play().catch(() => console.warn('Radio playback blocked.'));
        }
        this.onTrackChange(track.name);
    }
}