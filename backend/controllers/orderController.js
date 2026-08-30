const Order = require ('../models/orderModel');

const Product = require('../models/productModel');

const addOrderItems = async (req,res)=>{
    try{
        const{
            orderItems,
            shippingAddress,
            paymentMethod,
            totalPrice,
        } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        // --- Stock Validation Check ---
        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ message: `Product not found: ${item.name}` });
            }
            if (item.qty > product.countInStock) {
                return res.status(400).json({ 
                    message: `Requested quantity for ${product.name} exceeds available stock (${product.countInStock})` 
                });
            }
        }


        const order = new Order({
            orderItems,
            user:req.user._id,
            shippingAddress,
            paymentMethod,
            totalPrice,

        });

        const createadOrder = await order.save();
        res.send(201).json(createadOrder);
    }catch(error){
        res.status(500).json({message:error.message});

    }
};



const getOrderById = async (req,res)=>{
    try{
        const order = await Order.findById(req.params.id).populate(
            'user',
            'name email'
        );


        if (order){
            if (order.user._id.toString()===req.user._id.toString()|| req.user.isAdmin){
                res.json(order);
            }else{
                res.status(403).json({message:'Not authorized to view order details.'});
            }
        }else {
            res.status(404).json({message:'Order not found'})
        }
    }catch (error){
        res.status(500).json({message: error.message});
    }
};


const getMyOrders = async (req, res)=>{
    try{
        const orders = await Order.find({user: req.user._id});
        res.json(orders);
    }catch(error){
        res.status(500).json({message: error.message});
    }
};

const getOrders = async (req,res)=>{
    try{
        const orders = await Order.find ({}).populate('user', 'id name');
        res.json (orders);
    }catch (error){
        res.status(500).json({message: error.message});
    }
};


const updateOrderStatus = async (req,res)=>{
    try {
        const order = await Order.findById(req.params._id);


        if (order){
            order.status = req.body.status || order.status;
            if (req.body.status === "Delivered"){
                order.isPaid = true;

            }
            const updatedOrder = await order.save();
            res.json(updatedOrder)
        }else{
            res.status(404).json({mesage:'Order not found'});
        }
    }catch(error){
        res.status(500).json({message:error.mesage});
    }
};



module.exports = {
    addOrderItems,
    getOrderById,
    getMyOrders,
    getOrders,
    updateOrderStatus,
};