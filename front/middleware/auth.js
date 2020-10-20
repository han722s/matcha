const axios = require('axios').default;
const conf = require("../config")
const api = `http://${conf.apiIp}:${conf.portNumApi}`

const auth = async (req, res, next) => {
    if (!req.cookies.user && !req.cookies.jwt && req.url != '/login')
        return res.redirect("/login"); 
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + req.cookies.jwt;
    axios.get(`${api}/users/me`)
    .then((response) => {
        if(response.data.user){    
            return next();
        }
        return res.redirect("/login")
    })
    .catch((error)=>{
    if(!error.response)
        return res.redirect("/login")
    if(error.response.data.Code == 401 || response.status == 401)
        return res.redirect("/login")
    })
}
module.exports = auth;