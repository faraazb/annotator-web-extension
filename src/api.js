import { convertFileSize } from "./utils/blob";

class API {
    constructor({ baseUrl, options }) {
        this.baseUrl = baseUrl || "";
        this.options = options;
    }

    async request(endpoint, options) {
        let opts = { ...this.options, ...options };
        // jsonify body when required
        if ("body" in opts && opts.headers["Content-type"] === "application/json") {
            opts.body = JSON.stringify(opts.body);
        }
        const req = new Request(this.baseUrl + endpoint, opts);
        try {
            const res = await fetch(req);
            const data = await res.json();
            if (res.ok) {
                return { ok: true, data };
            }
            // TODO once the server starts returning a consistent error field
            // retutn them from here
            return { ok: false, data };
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
    baseUrl: process.env.API_URL,
    options: {
        headers: {
            "Content-type": "application/json"
        }
    }
});

const routes = {
    createUser: "/create-user",
    leaderboard: "/scoreboard",
    labels: "/labels",
    submit: "/submissions",
    submitConfirm: "/submissions/confirm",
}


const getLeaderboard = async () => {
    return await api.get(routes.leaderboard);
}

const getLabels = async () => {
    return await api.get(routes.labels);
}

const createLabel = async ({ title }) => {
    return await api.post(routes.labels, { body: { title } });
}

const createUser = async ({ email }) => {
    return await api.post(routes.createUser, { body: { email } });
}

/**
 * 
 * @param {File} screenshot
 * @param {File} annotations
 * @param {string} email
 */
const createAnnotation = async ({ screenshot, annotations, email, url }) => {
    const headers = { ...api.options.headers, email };
    const { data, ok } = await api.post(routes.submit, { headers, body: { url } });
    if (!ok) {
        return { ok: false }
    }
    // console.log(convertFileSize(screenshot.size))
    const { id, labels, image } = data;

    try {
        await Promise.all([
            fetch(labels.uploadURL, { method: "PUT", body: annotations }),
            fetch(image.uploadURL, { method: "PUT", body: screenshot })
        ]);
        const { data, ok } = await api.post(routes.submitConfirm, { headers, body: { id, url } });
        return { ok };
    } catch (error) {
        return { ok: false, error: error.message }
    }
}

export {
    createUser,
    getLeaderboard,
    getLabels,
    createLabel,
    createAnnotation
}