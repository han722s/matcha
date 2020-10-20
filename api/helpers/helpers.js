/// A set of helper methods and properties
const bcrypt = require('bcryptjs')
const TokenGenerator = require('uuid-token-generator')
const jwt = require('jsonwebtoken')
const sanitizeHtml = require('sanitize-html');
const geolib = require("geolib");


const helper = {
    sanitizeStr: async str => sanitizeHtml(str),
    
    password_hash: async (password) => {
        const saltRounds = 10;
        try {
            var hash = await bcrypt.hash(password, saltRounds)
            return hash
        }
        catch (e) {
            throw new Error(e.message)
        }
    },

    ReqtoArgs : (Request) => {
        Object.keys(Request).forEach(function(key, value) {
            Request[key] = true;
        })
        return Request
    },

    tokenGen : async () => {
        try {
            const tokgen = new TokenGenerator();
            return tokgen.generate();
        }
        catch (e) {
            throw new Error(e.message);
        }
    },

    validatePwd : async (existing, provided) => {
        try {
            const res = await bcrypt.compare(provided, existing)
            return res
        }
        catch (e) {
            throw new Error(e.message);
        }
    },

    genAuthToken : async (id) => {
        const token = jwt.sign({ _id: id.toString() }, 'matcha')
        return token
    },

    getPublicProfile: async (userArray) => {
        result = userArray.shift()
        user = {}
        Object.assign(user, result)
        delete user.password
        delete user.activated
        delete user.token
        delete user.jwt
        return user
    },

    getAge : birthDate => Math.floor((new Date() - new Date(birthDate).getTime()) / 3.15576e+10)
    ,
    trimInput: input => input.trim()
    ,
    
    filterSensitive: (result) => {
        user = {}
        Object.assign(user, result)
        // delete user.uuid
        delete user.password
        delete user.activated
        delete user.token
        delete user.jwt
        return user
    },
    
    getFame : async (data) => {
        let fame = ((((data.views + data.likes) - (data.reports + data.blocks)) / data.users) * 5).toFixed(1)
        if(fame < 0) 
            return String(0)
        return String(fame)
    },

    checkSortable : async (data) => {
        const sortRegex = new RegExp(/^desc$|^asc$/g)
        if(!sortRegex.test(data))
            return false
        return true
    },

    organiseUsers: async (requester ,users) => {

        const currentUserIndex = users.findIndex(user => user.uuid === requester.uuid)
        if(currentUserIndex != -1)
            users.splice(currentUserIndex, 1)
        
        users.forEach((user) => {
            const distance = geolib.getDistance(
                {latitude: requester.location[0], longitude: requester.location[1]},
                { latitude: user.location[0], longitude: user.location[1]})
              if(distance > 1000)
              user.distance = ~~(distance / 1000) + " Km away "
              else
              user.distance = distance + " Meters away"
              
              delete user.activated
              delete user.token
              delete user.jwt
              delete user.location
              delete user.email
              delete user.setupDone
              user.age = helper.getAge(user.birthdate)
        })
        return users
    }

    
}
    
module.exports = helper