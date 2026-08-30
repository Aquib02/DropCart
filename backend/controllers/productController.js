const Product = require ('../models/productModel');


const getProduct = async (req,res)=>{
    try{
        const products = await Product.find({});
        res.json(products);

    }catch{
        res.status(500).json({message: error.message});
    }
};

const getProductById = async(req,res)=>{
    try{
        const product = await Product.findById(req.params.id);

        if (product){
            res.json(product);

        }else{
            res.status(404).json({message: "Product not found"});
        }
    }catch (error){
        res.status(500).json({message:error.message});
    }
};


const deleteProduct = async (req,res)=>{
    try{
        const product = Product.findById(req.params.id);

        if (product){
            await product.deleteOne();
            res.json({message: 'Item Deleted'});

        }else{
            res.status(404).json({message: 'Item not found'})
        }
    }catch(error){
        res.status(500).json({message:error.message})
    }
};


const createProduct = async (req, res)=>{
    try{
        const{name,price,description,image,category,countInStock}=req.body;

        const product = new Product({
            name,
            price,
            user: req.user._id,
            image,category,countInStock,
            description,
        });
        const createdProduct = await product.save();
        res.status(201).json({message:createdProduct});

    }catch(error){
        res.status(500).json({message:error.message});
    }
};


const updateProduct = async (req,res)=>{
    try{
        const { name, price, description, image, category, countInStock} = req.body;
        const product = await Product.findById(req.params.id);

        if (product){
            product.name =name || product.name;
            product.price =price !== undefined ? price: product.price;
            product.description=description || product.description;
            product.category = category || product.category;
            product.countInStock =countInStock !== undefined ? countInStock: product.countInStock;
            
            const updatedProduct = await product.save();
            res.json(updatedProduct);
        }else{
            res.status(404).json({message: 'Product not Found'});
        }
    }catch(error){
        res.status(500).json({message: error.message});
    }
};

module.exports = {
    getProduct,
    getProductById,
    deleteProduct,
    updateProduct,
    createProduct,
}