const config = {
    "userInfoUrl": "https://www.googleapis.com/plus/v1/people/me",
    "implicitGrantUrl": "https://accounts.google.com/o/oauth2/auth",
    "logoutUrl": "https://accounts.google.com/logout",
    "tokenInfoUrl": "https://www.googleapis.com/oauth2/v3/tokeninfo",
    "clientId": "408016905439-t2ooip6mmu6f7p18301nor6r8hgp8p6b.apps.googleusercontent.com",
    "scopes": "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email"
};

let token = null;

function getLastToken() {
    return token;
}

async function getUserInfo(token) {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
    if (response.ok) {
        return await response.json();
    }
}

async function login() {
    let authUrl = config.implicitGrantUrl
        + '?response_type=token&client_id=' + config.clientId
        + '&scope=' + config.scopes
        + '&redirect_uri=' + chrome.identity.getRedirectURL("oauth2")
        + '&prompt=select_account';

    try {
        const redirectUrl = await chrome.identity.launchWebAuthFlow({ 'url': authUrl, 'interactive': true });
        if (redirectUrl) {
            let parsed = parse(redirectUrl.substr(chrome.identity.getRedirectURL("oauth2").length + 1));
            return parsed.access_token
        }
    } catch (error) {
        console.error(error)
        return;
    }
}

async function logout() {
    let logoutUrl = config.logoutUrl;

    try {
        // TODO revoke token too
        await chrome.identity.clearAllCachedAuthTokens();
        // const redirectUrl = await chrome.identity.launchWebAuthFlow({ 'url': logoutUrl, 'interactive': false });
        // console.log(redirectUrl);
        return true;
    } catch (err) {
        console.error(err)
        return false;
    }
}

function parse(str) {
    if (typeof str !== 'string') {
        return {};
    }
    str = str.trim().replace(/^(\?|#|&)/, '');
    if (!str) {
        return {};
    }
    return str.split('&').reduce(function (ret, param) {
        let parts = param.replace(/\+/g, ' ').split('=');
        let key = parts.shift();
        let val = parts.length > 0 ? parts.join('=') : undefined;
        key = decodeURIComponent(key);
        val = val === undefined ? null : decodeURIComponent(val);
        if (!ret.hasOwnProperty(key)) {
            ret[key] = val;
        }
        else if (Array.isArray(ret[key])) {
            ret[key].push(val);
        }
        else {
            ret[key] = [ret[key], val];
        }
        return ret;
    }, {});
}

export { login, logout, getLastToken, getUserInfo };
