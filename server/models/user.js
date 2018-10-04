const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const SALT = 10;



const userSchema = mongoose.Schema({
    email:{
        type: String,
        required: true,
        unique: 1,
        trim: true
    },
    password:{
        type: String,
        required: true,
        minlength: 5
    },
    firstname:{
        type: String,
        required: true,
        maxlength: 100
    },
    lastname:{
        type: String,
        required: true,
        maxlength: 100
    },
    cart:{
        type: Array,
        default: []
    },
    history:{
        type: Array,
        default: []
    },
    role:{
        type: Number,
        default: 0
    },
    token:{
        type: String
    }

});

userSchema.pre('save', function(next){
    const user = this;
    if(user.isModified('password')){
        bcrypt.genSalt(SALT, function(err, salt){
            if(err) return next(err);
    
            bcrypt.hash(user.password, salt, function(err, hashedPass){
                if (err) return next(err);
    
                user.password =  hashedPass;
                next();
            });
        });

    } else {
        next();
    }
});

userSchema.methods.camparePassword = function (password, cb){
    bcrypt.compare(password, this.password, (err, isMatch) => {
        if(err) return cb(err);
        cb(null, isMatch);       
    });
}

userSchema.methods.generateToken = function (cb){
    const user = this;
    const token = jwt.sign(user._id.toHexString(), process.env.SECRET);

    user.token = token;
    user.save(function(err, user){
        if(err) return cb(err);
        cb(null, user);
    });
}

userSchema.statics.findByToken = function (token, cb){
    const user = this;
    jwt.verify(token, process.env.SECRET, function(err, decode){
        if(err) return cb(err);
        user.findOne({"_id": decode, "token": token}, function(err, user){
            if(err) return cb(err);
            cb(null, user);
        })
    });
}



const User = mongoose.model('User', userSchema);

module.exports = {User}