// api/_routes/logistics.js
import express from 'express';
import Order from '../_models/Order.js';
import { protect, requirePermission } from '../_middleware/auth.js';
import {
    checkShiprocketHealth,
    checkShiprocketServiceability,
    trackShiprocketAwb
} from '../utils/shiprocket.js';

const router = express.Router();

// 1. Live Courier Partners API Status & Health Check
router.get('/partners', protect, requirePermission('orders'), async (req, res) => {
    try {
        // Query live Shiprocket server health / latency
        const srHealth = await checkShiprocketHealth();

        const partners = [
            {
                id: 'bluedart',
                name: 'Blue Dart Air Express',
                code: 'BLUEDART',
                status: 'Active',
                latencyMs: 142,
                priority: 1,
                supportedZones: ['Delhi-NCR', 'Metro Air', 'National'],
                avgWorkingDays: '1-3 Working Days'
            },
            {
                id: 'delhivery',
                name: 'Delhivery Surface & Express',
                code: 'DELHIVERY',
                status: 'Active',
                latencyMs: 210,
                priority: 2,
                supportedZones: ['All India', 'North Zone', 'Remote'],
                avgWorkingDays: '2-4 Working Days'
            },
            {
                id: 'shiprocket',
                name: 'Shiprocket Multi-Carrier',
                code: 'SHIPROCKET',
                status: srHealth.status,
                latencyMs: srHealth.latencyMs,
                priority: 3,
                isLive: srHealth.isLive,
                supportedZones: ['National Express', 'Hyperlocal', 'Air & Surface'],
                avgWorkingDays: '2-5 Working Days'
            },
            {
                id: 'dtdc',
                name: 'DTDC Premium Express',
                code: 'DTDC',
                status: 'Maintenance',
                latencyMs: 890,
                priority: 4,
                supportedZones: ['National Air', 'Regional'],
                avgWorkingDays: '3-5 Working Days'
            }
        ];

        res.json({ success: true, partners, shiprocketLive: srHealth.isLive });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. Check Serviceability by Pincode
router.post('/check-serviceability', protect, async (req, res) => {
    const { pincode } = req.body;
    if (!pincode || pincode.length !== 6) {
        return res.status(400).json({ success: false, message: 'Invalid 6-digit Pincode' });
    }

    try {
        // Attempt live Shiprocket serviceability lookup
        const srResult = await checkShiprocketServiceability(pincode);
        if (srResult.success && srResult.data?.couriers?.length > 0) {
            const mappedPartners = srResult.data.couriers.map(c => ({
                partner: c.name,
                serviceable: true,
                codAvailable: c.codAvailable,
                estimatedDays: `${c.estimatedDays || c.etd || '2-4'} Days`,
                carrierRecommended: c.isRecommended,
                rate: c.rate,
                rating: c.rating
            }));

            return res.json({
                success: true,
                pincode,
                isLive: true,
                partners: mappedPartners
            });
        }
    } catch (e) {
        console.warn('Shiprocket live serviceability fallback:', e.message);
    }

    // Resilient Fallback Pincode Serviceability Map
    const availablePartners = [
        {
            partner: 'Blue Dart Air Express',
            serviceable: true,
            codAvailable: true,
            estimatedDays: '1-2 Working Days',
            carrierRecommended: true
        },
        {
            partner: 'Delhivery Surface & Express',
            serviceable: true,
            codAvailable: true,
            estimatedDays: '2-3 Working Days',
            carrierRecommended: false
        },
        {
            partner: 'Shiprocket Multi-Carrier',
            serviceable: true,
            codAvailable: true,
            estimatedDays: '2-4 Working Days',
            carrierRecommended: false
        }
    ];

    res.json({ success: true, pincode, isLive: false, partners: availablePartners });
});

// 2.5 Live AWB Tracking Endpoint
router.get('/track/:awb', protect, async (req, res) => {
    const { awb } = req.params;
    if (!awb) return res.status(400).json({ success: false, message: 'AWB required' });

    const trackResult = await trackShiprocketAwb(awb);
    res.json(trackResult);
});

// 3. Manual Courier Assignment & Delivery Date Override
router.put('/assign-courier/:orderId', protect, requirePermission('orders'), async (req, res) => {
    const { orderId } = req.params;
    const { courierPartner, awbNumber, estimatedDeliveryDate, trackingUrl } = req.body;

    try {
        const order = await Order.findOne({ $or: [{ id: orderId }, { _id: orderId }] });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.logistics = {
            courierPartner: courierPartner || order.logistics?.courierPartner || 'Blue Dart Express',
            awbNumber: awbNumber || order.logistics?.awbNumber || `AWB-${Math.floor(100000000 + Math.random() * 900000000)}`,
            trackingUrl: trackingUrl || `https://track.khroniq.com/?awb=${awbNumber || 'AUTO'}`,
            assignedMode: 'Manual',
            assignedAt: new Date(),
            assignedBy: req.user.email || 'Admin',
            estimatedDeliveryDate: estimatedDeliveryDate || order.logistics?.estimatedDeliveryDate,
            dispatchDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            partnerStatus: 'Booked'
        };

        if (order.status === 'Paid' || order.status === 'Processing') {
            order.status = 'Shipped';
        }

        await order.save();

        res.json({
            success: true,
            message: `Courier updated to ${courierPartner} successfully!`,
            order
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
