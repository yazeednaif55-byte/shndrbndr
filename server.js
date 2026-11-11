/**
 * Ultimate Store Server Engine
 * Real-time WebSocket broadcasting & Server State Sync for all clients.
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

// Server-side State Database
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
        },
        { 
            id: 7, name: "عبوة مناديل ناعمة 10 حبات", price: 6.99, oldPrice: 9.99, cat: "tissues", isOffer: true,
            desc: "مناديل ورقية فائقة النعومة وقوية الامتصاص تناسب الاستخدام اليومي.",
            images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80"]
        },
        { 
            id: 8, name: "سماعات بلوتوث برو اللاسلكية", price: 49.99, oldPrice: 79.99, cat: "electronics", isOffer: true,
            desc: "سماعات أذن لاسلكية بتقنية عزل الضوضاء وصوت نقي عالي الدقة.",
            images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80"]
        },
        { 
            id: 9, name: "يد تحكم ألعاب لاسلكية احترافية", price: 39.99, oldPrice: 59.99, cat: "gaming", isOffer: true,
            desc: "يد تحكم متوافقة مع الكمبيوتر والأجهزة الذكية مع اهتزاز تفاعلي.",
            images: ["https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=400&auto=format&fit=crop&q=80"]
        },
        { 
            id: 10, name: "كيبورد مكانيكي مضيء بـ RGB", price: 34.99, oldPrice: 49.99, cat: "gaming", isOffer: true,
            desc: "لوحة مفاتيح ميكانيكية استجابة فائقة مع إضاءة RGB مخصصة للألعاب.",
            images: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=80"]
        },
        { 
            id: 11, name: "ماوس جيمنج احترافي عالي الدقة", price: 19.99, oldPrice: 29.99, cat: "gaming", isOffer: false,
            desc: "فأرة ألعاب مع حساسية تصل إلى 12000 DPI وأزرار جانبية قابلة للبرمجة.",
            images: ["https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&auto=format&fit=crop&q=80"]
        },
        { 
            id: 12, name: "عصير برتقال طبيعي منعش", price: 3.00, oldPrice: 4.50, cat: "food", isOffer: true,
            desc: "عصير برتقال طبيعي 100% معصور طازج بدون إضافة سكر.",
            images: ["https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&auto=format&fit=crop&q=80"]
        }
    ]
};

// Broadcast data to all open WebSockets
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
            
            if (parsed.type === 'APPLY_DISCOUNT') {
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
            else if (parsed.type === 'SET_THEME') {
                serverState.theme = parsed.theme;
                broadcast({ type: 'THEME_CHANGE', theme: parsed.theme });
            }
            else if (parsed.type === 'SET_SOUND') {
                serverState.customSoundUrl = parsed.url;
                broadcast({ type: 'SOUND_CHANGE', url: parsed.url });
            }
        } catch (e) {
            console.error('WebSocket Error:', e);
        }
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
