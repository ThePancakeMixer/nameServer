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
const port = 80
const redisClient = redis.createClient()

const sess = {
    store: new RedisStore({ client: redisClient }),
    secret : 'zPLaW.....e',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1*60*1000}
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

const buildPath = '../my-app/build'
app.use(express.static(buildPath));


app.get('/', function(req, res) {
    res.sendFile(path.join(buildPath,'index.html'));
  });

app.get('/getTopFive', function(req,res){

    let request = new Request(
        'SELECT TOP 5 * FROM NameTable ORDER BY NameCnt DESC',
        (err, rowCount) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log(`${rowCount} row(s) returned`);
            }
        }
    )
    let rowsText = [];
    request.on("row", columns => {
        let rowText = ""
        columns.forEach(column => 
        {
            rowText = rowText +  column.value + " "
        })
        rowsText.push(rowText)
    });
    request.on('requestCompleted', function () { 
        console.log(rowsText)
        res.send(rowsText)
    });

    connection.execSql(request)
})

function isEmptyOrSpaces(str){
    return str === null || str.match(/^ *$/) !== null;
}

let getTotal = function(req,res){
    let name = req.body.name
    if(isEmptyOrSpaces(name) || name.length>25){
        res.send({
            one: 'Name must be between 1 and 25 characters long'
        })
        return
    }
    
    let request = new Request('GetTotal',function(error){
        if(error){
            console.log(error)
        }
    })
    request.addParameter('Name',TYPES.VarChar, name)
    request.addOutputParameter('NameCount',TYPES.Int)
    request.on('returnValue', function(paramaterName, value,metadta){
        console.log(paramaterName + ' = ' + value)
        let ret = {
            one: (value || 0) + " people said fuck " + name,
            two: 'Vote Not Counted',
            three: 'You can vote again in ' + Math.floor(req.session.cookie.maxAge / 600) + ' seconds'
        }
        res.send(ret)
    })
    connection.callProcedure(request)
}
app.post('/addName',(req,res) => 
{
    if(req.session.name){
        getTotal(req,res)
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
        let ret = {
            one: value + " people said fuck " + name,
        }
        res.send(ret)
    })
    connection.callProcedure(request)
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))