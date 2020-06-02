const {ServerConfig} = require('./serverConfig')
const express = require('express')
const { Connection, Request } = require("tedious");
const cors = require('cors')
const TYPES = require('tedious').TYPES;
const redis = require('redis')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const app = express()
app.use(cors({}));
app.use(express.json());
const port = 5000
const redisClient = redis.createClient()

const sess = {
    store: new RedisStore({ client: redisClient }),
    secret : 'zPLaW.....e',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 8*60*60*1000}
};

app.use(session(sess))

const connection = new Connection(ServerConfig);
connection.connect()
connection.on("connect", err => {
if (err) {
    console.error(err.message);
} else {
    console.log("Connected to Azure SQL Database")
}
});

const buildPath = '/Users/toaster/Projects/my-app/build'
app.use(express.static(buildPath));


app.get('/', function(req, res) {
    res.sendFile(path.join(buildPath,'index.html'));
  });

app.post('/addName',(req,res) => 
    {
        if(req.session.name){
            res.send('You can vote again in ' + Math.floor(req.session.cookie.maxAge / 60000) + ' minutes')
            return;
        }
        req.session.name = "touched"
        let name = req.body.name
        console.log(req.session.id);

        let request = new Request('AddName',function(error){
            if(error){
                console.log(error)
            }
        })
        request.addParameter('Name',TYPES.VarChar, name)
        request.addOutputParameter('NameCount',TYPES.Int)

        request.on('returnValue', function(paramaterName, value,metadta){
            console.log(paramaterName + ' = ' + value)
            res.send(value + " people said fuck " + name)
        })
        connection.callProcedure(request)
    }
);

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))