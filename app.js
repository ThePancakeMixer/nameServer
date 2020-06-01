const {ServerConfig} = require('./serverConfig')
const express = require('express')
const { Connection, Request } = require("tedious");

var TYPES = require('tedious').TYPES;
const app = express()
var cors = require('cors')
app.use(express.json());


const port = 5000

app.use(cors())



const connection = new Connection(ServerConfig);
connection.connect()
connection.on("connect", err => {
if (err) {
    console.error(err.message);
} else {
    console.log("Connected to Azure SQL Database")
}
});

  

app.get('/', (req, res) => res.send('Hello World!'))
app.post('/addName',(req,res) => 
    {
        let firstName = req.body.firstName
        let lastName = req.body.lastName
        let request = new Request('AddName',function(error){
            if(error){
                console.log(error)
            }
        })
        request.addParameter('FirstName',TYPES.VarChar, firstName)
        request.addParameter('LastName',TYPES.VarChar,lastName)
        request.addOutputParameter('NameCount',TYPES.Int)

        request.on('returnValue', function(paramaterName, value,metadta){
            console.log(paramaterName + ' = ' + value)
            res.send(value + " people said fuck " + firstName + " " + lastName)
        })
        connection.callProcedure(request)
    }
);

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))