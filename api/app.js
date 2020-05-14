const express = require('express')
const app = express()
const Users = require("./controller/users")


// app.use((req, res, next) => {
//     res.status(500).send({Error: "Site Under Maintenance"})
// })

app.use(express.json())
app.use(Users)

app.listen(3000, () =>{
    console.log('Listening on port 3000')
})