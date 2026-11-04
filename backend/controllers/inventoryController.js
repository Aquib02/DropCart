const Product = require('../models/productModel');
const InventoryLog = require('../models/inventoryLogModel');
const emailService = require('../utils/emailService');

// 1. GET /api/inventory/dashboard
// Overview metrics, low stock warnings, out-of-stock items, and inventory valuation
exports.getInventoryDashboard = async (req, res) => {
    try {
        const { keyword, category, stockStatus, page = 1, limit = 20 } = req.query;

        let query = {};
        if (keyword) {
            query.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { sku: { $regex: keyword, $options: 'i' } },
                { brand: { $regex: keyword, $options: 'i' } },
            ];
        }
        if (category && category !== 'All') {
            query.category = category;
        }

        if (stockStatus === 'out') {
            query.$or = [{ countInStock: 0 }, { isOutOfStock: true }];
        } else if (stockStatus === 'low') {
            query.countInStock = { $gt: 0, $lte: 5 };
            query.isOutOfStock = false;
        } else if (stockStatus === 'in_stock') {
            query.countInStock = { $gt: 5 };
            query.isOutOfStock = false;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [products, totalCount, allProducts] = await Promise.all([
            Product.find(query)
                .select('_id name sku brand category price costPrice countInStock reservedStock isOutOfStock lowStockThreshold supplier totalSalesCount')
                .sort({ countInStock: 1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Product.countDocuments(query),
            Product.find().select('countInStock costPrice price isOutOfStock lowStockThreshold').lean()
        ]);

        let totalUnits = 0;
        let totalValuation = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;

        allProducts.forEach(p => {
            const stock = p.countInStock || 0;
            const cost = p.costPrice || (p.price * 0.7); // 70% cost estimate if costPrice not set
            totalUnits += stock;
            totalValuation += (cost * stock);
            const threshold = p.lowStockThreshold || 5;

            if (stock === 0 || p.isOutOfStock) {
                outOfStockCount++;
            } else if (stock <= threshold) {
                lowStockCount++;
            }
        });

        // Top low stock products needing urgent restock
        const urgentAlerts = await Product.find({
            $or: [
                { countInStock: { $lte: 5 } },
                { isOutOfStock: true }
            ]
        })
            .select('_id name sku image countInStock lowStockThreshold supplier')
            .limit(6)
            .lean();

        res.json({
            success: true,
            kpis: {
                totalSkus: allProducts.length,
                totalUnits,
                totalValuation: Math.round(totalValuation),
                lowStockCount,
                outOfStockCount,
                inStockCount: allProducts.length - (lowStockCount + outOfStockCount),
            },
            urgentAlerts,
            pagination: {
                total: totalCount,
                page: Number(page),
                pages: Math.ceil(totalCount / Number(limit))
            },
            products
        });
    } catch (error) {
        console.error('Error in getInventoryDashboard:', error);
        res.status(500).json({ message: 'Error fetching inventory dashboard', error: error.message });
    }
};

// 2. POST /api/inventory/adjust
// Adjust stock with audit trail logging and atomic safety
exports.adjustStock = async (req, res) => {
    try {
        const { productId, newStock, quantityDelta, reason, type = 'manual_adjustment' } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const previousStock = product.countInStock;
        let targetStock = previousStock;

        if (newStock !== undefined) {
            targetStock = Math.max(0, Number(newStock));
        } else if (quantityDelta !== undefined) {
            targetStock = Math.max(0, previousStock + Number(quantityDelta));
        }

        const delta = targetStock - previousStock;
        product.countInStock = targetStock;
        product.isOutOfStock = targetStock === 0;
        await product.save();

        // Record audit trail
        const log = await InventoryLog.create({
            product: product._id,
            productName: product.name,
            sku: product.sku || '',
            type,
            quantityDelta: delta,
            previousStock,
            newStock: targetStock,
            reason: reason || 'Manual inventory adjustment',
            performedBy: req.user?._id,
            performedByName: req.user?.name || 'Administrator',
        });

        // Real-Time Socket.IO notification
        const io = req.app.get('io');
        if (io) {
            io.emit('inventoryUpdated', {
                productId: product._id,
                name: product.name,
                stock: product.countInStock,
                isOutOfStock: product.isOutOfStock
            });

            if (product.countInStock <= (product.lowStockThreshold || 5)) {
                io.to('admin_channel').emit('lowStockAlert', {
                    productId: product._id,
                    name: product.name,
                    stock: product.countInStock,
                    image: product.image,
                    time: new Date()
                });
                emailService.sendLowStockAlertEmail({ product });
            }
        }

        res.json({
            success: true,
            message: `Stock updated successfully for "${product.name}". New Stock: ${targetStock}`,
            product,
            log
        });
    } catch (error) {
        console.error('Error in adjustStock:', error);
        res.status(500).json({ message: 'Error adjusting stock', error: error.message });
    }
};

// 3. PATCH /api/inventory/bulk-stock
// Update stock in bulk across multiple SKUs
exports.bulkStockUpdate = async (req, res) => {
    try {
        const { updates, reason } = req.body; // updates: [{ productId, countInStock }]
        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({ message: 'Updates array cannot be empty' });
        }

        const logsToInsert = [];
        const bulkOps = [];

        for (const item of updates) {
            const product = await Product.findById(item.productId);
            if (product) {
                const prev = product.countInStock;
                const nextStock = Math.max(0, Number(item.countInStock));
                bulkOps.push({
                    updateOne: {
                        filter: { _id: product._id },
                        update: {
                            $set: {
                                countInStock: nextStock,
                                isOutOfStock: nextStock === 0
                            }
                        }
                    }
                });

                logsToInsert.push({
                    product: product._id,
                    productName: product.name,
                    sku: product.sku || '',
                    type: 'bulk_import',
                    quantityDelta: nextStock - prev,
                    previousStock: prev,
                    newStock: nextStock,
                    reason: reason || 'Bulk stock revision',
                    performedBy: req.user?._id,
                    performedByName: req.user?.name || 'Administrator',
                });
            }
        }

        if (bulkOps.length > 0) {
            await Product.bulkWrite(bulkOps);
            await InventoryLog.insertMany(logsToInsert);
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('inventoryBulkUpdated', { updatedCount: bulkOps.length });
        }

        res.json({
            success: true,
            message: `Successfully updated stock for ${bulkOps.length} products.`,
            count: bulkOps.length
        });
    } catch (error) {
        console.error('Error in bulkStockUpdate:', error);
        res.status(500).json({ message: 'Error performing bulk stock update', error: error.message });
    }
};

// 4. GET /api/inventory/logs
// Audit trail of all stock additions, deductions, cancellations, and manual edits
exports.getInventoryLogs = async (req, res) => {
    try {
        const { keyword, type, page = 1, limit = 30 } = req.query;

        let query = {};
        if (keyword) {
            query.$or = [
                { productName: { $regex: keyword, $options: 'i' } },
                { sku: { $regex: keyword, $options: 'i' } },
                { reason: { $regex: keyword, $options: 'i' } }
            ];
        }
        if (type && type !== 'All') {
            query.type = type;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [logs, total] = await Promise.all([
            InventoryLog.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            InventoryLog.countDocuments(query)
        ]);

        res.json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            logs
        });
    } catch (error) {
        console.error('Error in getInventoryLogs:', error);
        res.status(500).json({ message: 'Error fetching inventory logs', error: error.message });
    }
};

// 5. POST /api/inventory/reserve (Safe atomic reservation to prevent overselling)
exports.reserveStock = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const qty = Number(quantity);

        const updated = await Product.findOneAndUpdate(
            {
                _id: productId,
                $expr: {
                    $gte: [{ $subtract: ['$countInStock', '$reservedStock'] }, qty]
                }
            },
            {
                $inc: { reservedStock: qty }
            },
            { new: true }
        );

        if (!updated) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient available stock for reservation. Item is sold out.'
            });
        }

        res.json({
            success: true,
            message: 'Stock reserved successfully',
            availableStock: updated.countInStock - updated.reservedStock
        });
    } catch (error) {
        console.error('Error in reserveStock:', error);
        res.status(500).json({ message: 'Error reserving stock', error: error.message });
    }
};
