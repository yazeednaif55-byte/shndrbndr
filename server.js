/**
 * ============================================================================
 * ULTIMATE STORE PLATFORM - BACKEND SERVER ENGINE (v15.0 MASSIVE PRODUCTION)
 * ============================================================================
 * Developed for high-concurrency real-time WebSocket communication, state 
 * synchronization, and secure fund transfers between client nodes.
 * ============================================================================
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ============================================================================
 * CENTRAL SERVER STATE REGISTRY
 * ============================================================================ */
let serverState = {
    theme: 'default',
    globalDiscount: 0,
    customSoundUrl: '',
    products: [
        { 
            id: 1, name: "بيتزا ببروني ساخنة وجديدة", price: 12.99, oldPrice: 18.00, cat: "food", isOffer: true,
            desc: "بيتزا إيطالية طازجة بصلصة الطماطم الطبيعية وجبنة الموتزاريلا الفاخرة مع شرائح الببروني المقرمشة.",
            images: ["https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80"]
        },
        { 
            id: 2, name: "برجر لحم ديلوكس مع الجبن", price: 9.50, oldPrice: 14.00, cat: "food", isOffer: true,
            desc: "قطعة لحم بقر مشوية على الفحم مع شريحة جبن شيدر ذائبة وخس طازج وصلصة خاصة.",
            images: ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80"]
        },
        { 
            id: 3, name: "بطاطس مقلية مقرمشة بالحجم الكبير", price: 4.50, oldPrice: 7.00, cat: "food", isOffer: true,
            desc: "أصابع بطاطس ذهبية ومقرمشة ومملحة باعتدال، وجبة جانبية مثالية.",
            images: ["https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=80"]
        },
        { 
            id: 4, name: "معكرونة باستا إيطالية بصلصة الكريمة", price: 11.00, oldPrice: 15.00, cat: "food", isOffer: false,
            desc: "معكرونة باستا بصلصة الكريمة والجبن مع قطع الدجاج المشوي والأعشاب.",
            images: ["https://images.unsplash.com/photo-1621996346565-e3d5d6281358?w=400&auto=format&fit=crop&q=80"]
        },
        { 
            id: 5, name: "شيبس مقرمش بنكهة الحار والحامض", price: 2.50, oldPrice: 3.50, cat: "sweets", isOffer: true,
            desc: "رقائق شيبس طازجة ومقرمشة ومبهرة بخلطة التوابل الحارة والليمون.",
            images: ["https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80"]
        },
        { 
            id: 6, name: "علبة شوكولاتة فاخرة مشكلة", price: 15.00, oldPrice: 20.00, cat: "sweets", isOffer: false,
            desc: "تشكيلة غنية من قطع الشوكولاتة البلجيكية المحشوة بالكراميل.",
            images: ["https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&auto=format&fit=crop&q=80"]
        }
    ],
    pendingTransfers: {}
};

/* ============================================================================
 * WEBSOCKET BROADCAST CONTROLLER
 * ============================================================================ */
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'INIT_STATE', state: serverState }));

    ws.on('message', (message) => {
        try {
            const parsed = JSON.parse(message);
            
            if (parsed.type === 'CHECK_TRANSFERS') {
                const email = parsed.email.toLowerCase().trim();
                if (serverState.pendingTransfers[email] && serverState.pendingTransfers[email].length > 0) {
                    ws.send(JSON.stringify({
                        type: 'BATCH_TRANSFERS',
                        transfers: serverState.pendingTransfers[email]
                    }));
                    serverState.pendingTransfers[email] = [];
                }
            }
            else if (parsed.type === 'TRANSFER_MONEY') {
                const recipient = parsed.recipientEmail.toLowerCase().trim();
                const transferData = {
                    senderName: parsed.senderName,
                    amount: parsed.amount,
                    timestamp: Date.now()
                };

                if (!serverState.pendingTransfers[recipient]) {
                    serverState.pendingTransfers[recipient] = [];
                }
                serverState.pendingTransfers[recipient].push(transferData);

                broadcast({ 
                    type: 'INCOMING_TRANSFER', 
                    recipientEmail: recipient,
                    senderName: parsed.senderName,
                    amount: parsed.amount 
                });
            }
            else if (parsed.type === 'SET_THEME') {
                serverState.theme = parsed.theme;
                broadcast({ type: 'THEME_CHANGE', theme: parsed.theme });
            }
            else if (parsed.type === 'APPLY_DISCOUNT') {
                serverState.globalDiscount = parsed.percent;
                serverState.products.forEach(p => {
                    p.oldPrice = p.price;
                    p.price = p.price * (1 - parsed.percent / 100);
                    p.isOffer = true;
                });
                broadcast({ type: 'GLOBAL_DISCOUNT', percent: parsed.percent, products: serverState.products });
            }
            else if (parsed.type === 'ADD_PRODUCT') {
                serverState.products.unshift(parsed.product);
                broadcast({ type: 'NEW_PRODUCT', product: parsed.product, products: serverState.products });
            }
        } catch (e) {}
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
    console.log(`Ultimate Store Server is running smoothly on port ${PORT}`);
});
