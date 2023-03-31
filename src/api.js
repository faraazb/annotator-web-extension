class API {
    constructor({ baseUrl, options }) {
        this.baseUrl = baseUrl || "";
        this.options = options;
    }

    async request(endpoint, options) {
        let opts = { ...this.options, ...options};
        // jsonify body when required
        if ("body" in opts && opts.headers["Content-type"] === "application/json") {
            opts.body = JSON.stringify(opts.body);
        }
        const req = new Request(this.baseUrl + endpoint, opts);
        try {
            const res = await fetch(req);
            if (res.ok) {
                return { ok: true, data: await res.json() };
            }
        }
        catch (error) {
            return { ok: false, error };
        }
    }

    async get(endpoint, options) {
        return await this.request(endpoint, { ...options, method: "GET" });
    }

    async post(endpoint, options) {
        return await this.request(endpoint, { ...options, method: "POST" });
    }
}

const api = new API({ 
    baseUrl: "https://data-science-theta.vercel.app/api",
    options: { 
        headers: { 
            "Content-type": "application/json"
        } 
    } 
});

const routes = {
    leaderboard: "/scoreboard",
    labels: "/labels"
}


const getLeaderboard = async () => {
    return await api.get(routes.leaderboard)
}

const createLabel = async ({ title }) => {
    return await api.post(routes.labels, { body: { title } });
}

export {
    getLeaderboard,
    createLabel,
}