/// User Model
const helper = require("../helpers/helpers");
const uuidv4 = require("uuid/v4");
const database = require("../libraries/database");
const fs = require("fs");
const geolib = require("geolib");
const fastsort = require("fast-sort");
const mailHandler = require("../libraries/mailhandler")

const User = {
  userAdd: async data => {
    try {
      data.uuid = uuidv4();
      data.hash = await helper.password_hash(data.password);
      data.token = await helper.tokenGen();
      data.jwt = await helper.genAuthToken(data.uuid);
      await mailHandler.sendConfirmation(data.email, data.token)
      const result = await database.insertOne(data);
      if (result.summary.counters._stats.nodesCreated == 1)
        return "User created successfully.";
      else throw new Error("Something went wrong.");
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userGet: async () => {
    try {
      let resultsArray = [];
      result = await database.find("Person");
      result.forEach(record => {
        resultsArray.push(helper.filterSensitive(record));
      });
      return resultsArray;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userGetById: async (id = "") => {
    try {
      let resultsArray = [];
      result = await database.findById(id);
      result.records.forEach(record => {
        resultsArray.push(helper.filterSensitive(record._fields[0].properties));
      });
      return resultsArray;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },
  userGetByToken: async (data) => {
    try{
    const user = await database.findOne(data.token, "token")
    if(!user)
      throw new Error("Token invalid, check again");
    return result = true
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userDel: async (id = "") => {
    try {
      const result = await database.deleteOne("Person", id);
      if (result == 1) return true;
      return false;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userGetByEmail: async email => {
    try {
      const result = await database.findOne(email, "email");
      console.log(result);
      if (!result) return false;
      return true;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userGetByUsername: async username => {
    try {
      const result = await database.findOne(username, "username");
      console.log(result);
      if (!result) return false;
      return true;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userUpdate: async (uuid = "", params) => {
    try {
      // prevents interest duplicates
      /// new Set return Object with unique values from array and then gets spread (...) as values in the new array
      if(params.interests)
        params.interests = [...new Set(params.interests)]
      const required = ['orientation','gender','birthdate','location','bio','interests']
      const given = Object.keys(params)
      const complete = given.every((element) => required.includes(element))
      setupDone = {}
      if(complete){
        setupDone = {setupDone: true}
      }
      params = Object.assign(params, setupDone)
      // console.log(params)
      const result = await database.updateOne(uuid, params);
      if (result.summary.counters._stats.propertiesSet > 0) return true;
      return false;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  findByCredentials: async (email, password) => {
    const user = await database.findOne(email, "email");
    if (!user) {
      throw new Error("Unable to login: Make sure email is correct");
    }
    const isMatch = await helper.validatePwd(user[0].password, password);
    if (!isMatch) {
      throw new Error("Unable to login: Make sure password is correct");
    }
    if(user[0].activated !== true)
      throw new Error("Unable to login: Make sure you confirm your registration");
    return user;
  },

  logInUser: async (uuid, jwt) => {
    try {
      const result = await database.updateJWT(uuid, jwt, "add");
      if (!result) throw new Error("Something went wrong.");
      await database.updateLogTime(uuid)
      return result;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userLogOut: async (uuid, jwt) => {
    try {
      const result = await database.updateJWT(uuid, jwt, "del");
      if (!result) throw new Error("Something went wrong.");
      return result;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userLogOutAll: async (uuid, jwt) => {
    try {
      const result = await database.updateJWT(uuid, jwt, "all");
      if (!result) throw new Error("Something went wrong.");
      return result;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userCheck: async (id, token) => {
    const user = await database.findById(id);
    if (user) {
      found = user[0].jwt.indexOf(token);
      if (found < 0) throw new Error("JWT ERROR");
      else return user;
    } else throw new Error("NO USER FOUND");
  },

  userSearch: async who => {
    try {
      const users = await database.findMany(who);
      return users;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userFilter: async (data, args, userLocation, uuid) => {
    try {
      if(!data.radius)
        data.radius = 130
      const users = await database.filterSearch(data, args, uuid);
      let sortables = [];
      if (data.sortfame == "desc")
        sortables.push({
          desc: u => (u.fameRating = parseFloat(u.fameRating))
        });
      if (data.sortfame == "asc")
        sortables.push({ asc: u => (u.fameRating = parseFloat(u.fameRating)) });
      if (data.sortage == "desc")
        sortables.push({ desc: u => helper.getAge(u.birthdate) });
      if (data.sortage == "asc")
        sortables.push({ asc: u => helper.getAge(u.birthdate) });
      if (data.sortinterests == "desc")
        sortables.push({ desc: u => u.interests.length });
      if (data.sortinterests == "asc")
        sortables.push({ asc: u => u.interests.length });
      if (data.sortlocation == "desc")
        sortables.push({
          desc: u =>
            geolib.getDistance(
              { latitude: userLocation[0], longitude: userLocation[1] },
              { latitude: u.location[0], longitude: u.location[1] }
            )
        });
      if (data.sortlocation == "asc")
        sortables.push({
          asc: u =>
            geolib.getDistance(
              { latitude: userLocation[0], longitude: userLocation[1] },
              { latitude: u.location[0], longitude: u.location[1] }
            )
        });
      if (sortables.length == 0)
        throw new Error("Please provide Sort option");
      var sorted = fastsort(users).by(sortables);
      return sorted;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userAddPicture: async (uuid, picture, param) => {
    try {
      var arg;
      param == "true" ? (arg = "profile") : (arg = "add");
      const result = await database.updatePicture(uuid, picture, arg);
      if (result.summary.counters._stats.propertiesSet > 0) return true;
      return false;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userDelPicture: async (uuid, picture) => {
    try {
      const result = await database.updatePicture(uuid, picture, "del");
      if (result.summary.counters._stats.propertiesSet > 0) return true;
      return false;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userView : async (userA, userB, user) => {
    const result = await database.findById(userB)
    if(result.length == 0) return false
    const blocked = await database.findByRelation(userB, userA, "BLOCKED");
    if (blocked.records.length > 0) throw new Error("Sorry You're Blocked");
    const isCompleted = await database.profileCompleted(userB)
    if (!isCompleted) throw new Error("Sorry User has Not completed his/her profile yet");
      await database.findOneAndRelate(userA, userB, "VIEWED");
    const rating = await database.updateRating(userB);
      if (!rating) throw new Error("Error Getting Fame Rating ");
      await database.insertNotification(result[0].username, `${user.username} just Visited your profile !`)
      const filtered = helper.filterSensitive(result[0])
      const liked = await database.findByRelation(userB, userA, "LIKES");
      filtered.like = (liked.records.length > 0) ? "This User Likes You" : "This User havent liked you yet"
      const distance = geolib.getDistance(
        {latitude: user.location[0], longitude: user.location[1]},
        { latitude: filtered.location[0], longitude: filtered.location[1]})
      if(distance > 1000)
      filtered.distance = ~~(distance / 1000) + " Km away "
      else 
      filtered.distance = distance + " Meters away "
      delete filtered.location
      delete filtered.uuid
      delete filtered.email
      delete filtered.setupDone
      filtered.age = helper.getAge(filtered.birthdate)
      return filtered
  },

  userLike: async (userA, userB, username) => {
    try {
      const exists = await database.findById(userB)
      if(exists.length == 0)
      throw new Error("User does not Exist")
      const isCompleted = await database.profileCompleted(userB)
      if (!isCompleted) throw new Error("Sorry User has Not completed his/her profile yet");
      const blocked = await database.findByRelation(userB, userA, "BLOCKED");
      if (blocked.records.length > 0) throw new Error("Sorry You're Blocked");
      // deletes old dislike or block relationship if any
      await database.findByRelationAndDelete(userA, userB, "BLOCKED");
      await database.findByRelationAndDelete(userA, userB, "DISLIKES");
      const result = await database.findOneAndRelate(userA, userB, "LIKES");
      counter = result.summary.counters._stats.relationshipsCreated;
      if (counter == 0) throw new Error("Already Liked");
      // change frame rating
      const rating = await database.updateRating(userB);
      if (!rating) throw new Error("Error Getting Fame Rating ");
      const matched = await database.findByRelation(userB, userA, "LIKES");
      (matched.records.length > 0) ? await database.insertNotification(exists[0].username, `You're Matched with ${username} say Hello ;)`) : await database.insertNotification(exists[0].username, `${username} just liked You !`)
      if(matched.records.length > 0){
        chatExists = await database.chatExits(username, exists[0].username)
        if(!chatExists){
          chat = await database.createChat(username, exists[0].username)
          if(!chat)
            throw new Error("Chat unavailable")
        }
      }
      return true;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userDislike: async (userA, userB, username) => {
    try {
      const exists = await database.findById(userB)
      if(exists.length == 0)
      throw new Error("User does not Exist")
      const isCompleted = await database.profileCompleted(userB)
      if (!isCompleted) throw new Error("Sorry User has Not completed his/her profile yet");
      const blocked = await database.findByRelation(userB, userA, "BLOCKED");
      if (blocked.records.length > 0) throw new Error("Sorry You're Blocked");
      const matched = await database.findByRelation(userB, userA, "LIKES")
      if(matched.records.length > 0){
        await database.insertNotification(exists[0].username, `You are not matched with ${username} anymore :( `)
        await database.deleteChat(username, exists[0].username)
      }
      // deletes old like or block relationship if any
      await database.findByRelationAndDelete(userA, userB, "BLOCKED");
      await database.findByRelationAndDelete(userA, userB, "LIKES");
      const result = await database.findOneAndRelate(userA, userB, "DISLIKES");
      counter = result.summary.counters._stats.relationshipsCreated;
      if (counter == 0) throw new Error("Already Disliked");
      const rating = await database.updateRating(userB);
      if (!rating) throw new Error("Error Getting Fame Rating ");
      return true;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userBlock: async (userA, userB,username) => {
    try {
      const exists = await database.findById(userB)
      if(exists.length == 0)
      throw new Error("User does not Exist")
      const isCompleted = await database.profileCompleted(userB)
      if (!isCompleted) throw new Error("Sorry User has Not completed his/her profile yet");
      const result = await database.findOneAndRelate(userA, userB, "BLOCKED");
      counter = result.summary.counters._stats.relationshipsCreated;
      if (counter == 0) throw new Error("Already Blocked");
      await database.deleteChat(username, exists[0].username)
      await database.findByRelationAndDelete(userA, userB, "LIKES");
      const rating = await database.updateRating(userB);
      if (!rating) throw new Error("Error Getting Fame Rating ");
      return true;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userUnBlock: async (userA, userB) => {
    try {
      const blocked = await database.findByRelation(userA, userB, "BLOCKED");
      if (blocked.records.length == 0) throw new Error("Not even Blocked");
      result = await database.findByRelationAndDelete(userA, userB, "BLOCKED");
      const rating = await database.updateRating(userB);
      if (!rating) throw new Error("Error Getting Fame Rating ");
      if (!result) return false;
      return true;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userReport : async (userA,userB, username) => {
    try {
      const exists = await database.findById(userB)
      if(exists.length == 0)
      throw new Error("User does not Exist")
      const isCompleted = await database.profileCompleted(userB)
      if (!isCompleted) throw new Error("Sorry User has Not completed his/her profile yet");
      const result = await database.findOneAndRelate(userA, userB, "REPORTED");
      counter = result.summary.counters._stats.relationshipsCreated;
      if (counter == 0) throw new Error("Already Reported");
      await database.findByRelationAndDelete(userA, userB, "LIKES");
      await database.deleteChat(username, exists[0].username)
      const rating = await database.updateRating(userB);
      if (!rating) throw new Error("Error Getting Fame Rating ");
      return true;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userGetLikes: async uuid => {
    try {
      const users = await database.findManyByRelation(uuid, "LIKES");
      return users;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userGetBlocked: async uuid => {
    try {
      const users = await database.findManyByRelation(uuid, "BLOCKED");
      return users;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userGetDislikes: async uuid => {
    try {
      const users = await database.findManyByRelation(uuid, "DISLIKES");
      return users;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },
  userGetViews: async uuid => {
    try {
      const users = await database.findManyByRelation(uuid, "VIEWED");
      return users;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  }
,
  userGetNotifications: async (uuid) => {
    try {
      const result = await database.findNotifications(uuid)
      return result
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userReadNotification: async (uuid) => {
    try {
      const result = await database.updateReadNotification(uuid)
      return result
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userGetChat : async (username) => {
    try {
      const result = await database.getUserChats(username)
      return result
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userGetConversation: async (usernameA, usernameB) =>{
    try {
      const result = await database.getChatConversation(usernameA, usernameB)
      return result
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userGetInfo : async (username) => {
    try{
      const result = await database.findOne(username, "username")
      return result
    }
    catch (e){
      console.log(e);
      throw new Error(e.message);
    }
  },

  userGetHistory: async(user) => {
    try{
      const uuid = user.uuid
      let result = {}
      const dislikes = await database.findManyByRelation(uuid, "DISLIKES");
      const likes = await database.findManyByRelation(uuid, "LIKES");
      const views = await database.findManyByRelation(uuid, "VIEWED");
      const blocked = await database.findManyByRelation(uuid, "BLOCKED");
      if(dislikes)
      result.dislikes = await helper.organiseUsers(user, dislikes)
      if(likes)        
      result.likes = await helper.organiseUsers(user,likes)
      if(views) 
      result.views = await helper.organiseUsers(user,views) 
      if(blocked)
      result.blocked = await helper.organiseUsers(user,blocked)

      if(result === {})
        return false
      return result
    }
    catch (e){
      console.log(e);
      throw new Error(e.message);
    }
  },

  userGetFame: async (user) =>{
    try{
      const uuid = user.uuid
      let result = {}
      const likes = await database.findMyRelations(uuid, "LIKES");
      const views = await database.findMyRelations(uuid, "VIEWED");
      if(likes)        
      result.likes = await helper.organiseUsers(user,likes)
      if(views) 
      result.views = await helper.organiseUsers(user,views) 

      if(result === {})
        return false
      return result
    }
    catch (e){
      console.log(e);
      throw new Error(e.message);
    }
  },
  
  userSendMessage: async (usernameA, usernameB, body) =>{
    try {
      chatExists = await database.chatExits(usernameA, usernameB)
      if(!chatExists) throw new Error("You're not Matched")
      const result = await database.createMessage(usernameA, usernameB, body)
      notify = await database.insertNotification(usernameB, `${usernameA} has sent you a message`)
      return result
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  },

  userSendReset: async (email) => {
    const user = await database.findOne(email, "email")
    if(!user)
      throw new Error("An account by this email Does Not Exist")
    if(user[0].activated == false)
      throw new Error("Please Activate account first")
    data = {}
    data.token = await helper.tokenGen();
    await mailHandler.sendReset(email, data.token)
    const result = await database.updateOne(user[0].uuid, data)
    return result
  },

  userResetPassword: async (data) => {
    const user = await database.findOne(data.token, "token")
    if(!user)
      throw new Error("Something went wrong, User not found")
    if(user[0].activated == false)
      throw new Error("Please Activate account first")
    if(user[0].token == '')
      throw new Error("Something went wrong with your reset token, resend another request.")
    data.password = await helper.password_hash(data.password)
    data.token = ''
    const result = await database.updateOne(user[0].uuid, data)
    return result
  },

  userUpdatePassword: async (uuid,password) => {
    const user = await database.findOne(uuid, "uuid")
    if(!user)
      throw new Error("Something went wrong, User not found")
    if(user[0].activated == false)
      throw new Error("Please Activate account first")
    password = await helper.password_hash(password)
    const result = await database.updatePassword(uuid, password)
    return result
  },
  userConfirmAccount: async (data) => {
    const user = await database.findOne(data.token, "token")
    if(!user)
      throw new Error("Something went wrong, User not found")
    if(user[0].activated === true)
      throw new Error("Your Account is already activated")
    if(user[0].token == '')
      throw new Error("Something went wrong with your token, contact support")
    data.token = ''
    data.activated = true
    const result = await database.updateOne(user[0].uuid, data)
    return result
  },
  
  //// add users file support
  seedDatabase: async () => {
    try {
      let rawdata = fs.readFileSync('generated.json');
      let users = JSON.parse(rawdata);
      // console.log(users.length);
      param = {
        props: users
      };
      cypher = "UNWIND $props AS map CREATE (n:Person) SET n = map";
      const result = await database.testCypher(cypher, param);
      return result;
    } catch (e) {
      console.log(e);
      throw new Error(e.message);
    }
  }
};

module.exports = User;
