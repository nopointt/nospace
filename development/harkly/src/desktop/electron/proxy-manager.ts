export interface ProxyConfig {
    host: string;
    port: string;
    username?: string;
    password?: string;
}

export class ProxyManager {
    private proxies: ProxyConfig[] = [];
    private currentIndex = 0;

    constructor(proxiesInput?: string | ProxyConfig[]) {
        if (proxiesInput) {
            this.loadProxies(proxiesInput);
        }
    }

    // Load from newline separated string "HOST:PORT:USER:PASS"
    loadProxies(input: string | ProxyConfig[]) {
        if (Array.isArray(input)) {
            this.proxies = input;
        } else {
            this.proxies = input.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .map(line => {
                    const parts = line.split(':');
                    if (parts.length >= 2) {
                        return {
                            host: parts[0],
                            port: parts[1],
                            username: parts[2],
                            password: parts[3]
                        };
                    }
                    return null;
                })
                .filter(Boolean) as ProxyConfig[];
        }
        // Shuffle for "non-sequential" start
        this.shuffle();
    }

    private shuffle() {
        for (let i = this.proxies.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.proxies[i], this.proxies[j]] = [this.proxies[j], this.proxies[i]];
        }
    }

    getNext(): ProxyConfig | undefined {
        if (this.proxies.length === 0) return undefined;

        const proxy = this.proxies[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
        return proxy;
    }

    getRandom(): ProxyConfig | undefined {
        if (this.proxies.length === 0) return undefined;
        return this.proxies[Math.floor(Math.random() * this.proxies.length)];
    }
}
