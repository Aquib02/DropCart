const mongoose = require ('mongoose');
const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required:true
        
    },
    isAdmin:{
        type: Boolean,
        required:true,
        default:false
    },
    phone:{
        type:String,
        default:"",

    },

    address:{ 
        type: String,
        default: ''
    },
    city: { 
        type: String, 
        default: '' 
    },
    postalCode: { 
        type: String, 
        default: '' 
    },
    country: { 
        type: String, 
        default: '' 
    },

},{timestamps: true});

const User = mongoose.model('User', userSchema);
module.exports =User;