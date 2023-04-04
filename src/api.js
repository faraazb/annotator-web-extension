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
    baseUrl: "https://data-science-theta.vercel.app/api",
    // baseUrl: "http://localhost:3000/api",
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
    submit: "/submit"
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
const createAnnotation = async ({ screenshot, annotations, email }) => {

    const formData = new FormData();
    formData.append("label", annotations);
    formData.append("image", screenshot);

    // console.log(Array.from(formData.entries()))
    // console.log(user.email)
    // console.log(convertFileSize(screenshot.size))

    // header object is overwritten, no application/json for this one
    return await api.post(routes.submit, {
        mode: "cors",
        headers: { "email": email },
        redirect: "follow",
        body: formData
    });
}

export {
    createUser,
    getLeaderboard,
    getLabels,
    createLabel,
    createAnnotation
}