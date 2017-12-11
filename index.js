var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our model
var Users  = new User();

app.set('secret', config.secret);

var port = process.env.PORT || 8080;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function(req, res) {
    Users.get_all_users(function(l){
        console.log(l)
    });
    res.send('Hello!');
});

// API ROUTES -------------------

var apiRoutes = express.Router();

apiRoutes.post('/authenticate', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    Users.authentication(username, password, function(result){
        if(result == "User not found"){
            res.json({ success: false, message: 'Authentication failed. User not found.' });
        } else if(result == "Wrong password") {
            res.json({ success: false, message: 'Authentication failed. Wrong password.' });
        } else {
            var user = result;
            const payload = {
                username: user.username,
                role: user.role
            };
            var token = jwt.sign(payload, app.get('secret'), {
                expiresIn: 60*60*24 // expires in 24 hours
            });
            res.json({
                success: true,
                message: 'Authentication success',
                token: token
            });
        }
    });
});

// route middleware to verify a token
apiRoutes.use(function(req, res, next) {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, app.get('secret'), function(err, decoded) {      
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });    
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;    
                next();
            }
        });
    } else {
        // if there is no token
        // return an error
        return res.status(403).send({ 
            success: false, 
            message: 'No token provided.' 
        });
    }
});

apiRoutes.get('/', function(req, res) {
  res.json({ message: 'Welcome to the coolest API on earth!' });
});

apiRoutes.get('/users', function(req, res) {
  Users.get_all_users(function(users) {
    res.json(users);
  });
});



app.use('/api', apiRoutes);


app.listen(port);
console.log('App running at port ' + port);