const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
require('dotenv').config();

//Models
const { User } = require('./models/user');

// instaniate an express app
const app = express();

//middlewares
const auth = require('./middlewares/auth');

//set up mongoose and connect to it
mongoose.Promise = global.Promise;
mongoose.connect(process.env.DATABASE, () => {
    console.log('Database connection successful!');
});

// set up middlewares
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cookieParser());

//================================
//      USERS
//================================

app.get('/api/users/auth', auth, (req, res) =>{
    res.json({
        isAdmin: req.user.role === 0 ? false:true,
        isAuth: true,
        email: req.user.email,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        cart: req.user.cart,
        history: req.user.history
    })
})
app.post('/api/users/register', (req, res) => {
    const user = new User(req.body);

    user.save((err, user) => {
        if(err) return res.json({success: false, err});
        res.status(200).json({
          success: true 
        });
    });
});

app.post('/api/users/login', (req, res) => {
    //find the email
    User.findOne({'email': req.body.email}, (err, user) => {
        if(!user) return res.json({loginSuccess: false, message: 'Auth failed, user does not exist!'});
        
        //check the password
        user.camparePassword(req.body.password, (err, isMatch) => {
            if(!isMatch) return res.json({loginSuccess: false, message: 'Wrong password!'});

            //generate a token
            user.generateToken((err, user) => {
                if(err) return res.status(400).send(err);
                res.cookie('w_auth', user.token).json({
                    loginSuccess: true
                });
            });
        });
    });   
});



app.get('/api/users/logout', auth, (req, res) => {
    User.findByIdAndUpdate(
        {_id: req.user.id}
    )

});





// run the server on a port
const port = process.env.PORT || 3002;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})