const express = require ("express");
const dotenv = require ("dotenv");
const cors = require ("cors");
const connectDB = require("./config/db.js");
const authRoutes = require('./routes/authRoutes.js');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes.js');

dotenv.config();

connectDB ();

const app = express();

app.use(express.json());
app.use(cors());
app.use('/api/users',authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);


app.get ('/',(req,res)=>{
    res.send("API is running.....");
});



const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{
    console.log(`Server is running at: ${PORT}`)
});