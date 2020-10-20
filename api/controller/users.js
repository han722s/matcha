const express = require("express");
const Usercontroller = new express.Router();
const UserModel = require("../model/user");
const helper = require("../helpers/helpers");
const validators = require("../libraries/validators")
const auth = require("../middleware/auth");


//// adds a new user
Usercontroller.post("/users", async (req, res) => {
  try {
    const validated = await validators.userValidator(req.body,{email: true, username: true, name: true, password: true});
    const mailExist = await UserModel.userGetByEmail(validated.email);
    if (mailExist) throw new Error("Email already taken");
    const usernameExists = await UserModel.userGetByUsername(validated.username)
    if (usernameExists) throw new Error("Username already taken");
    let info = {
      email: validated.email, 
      username: validated.username,
      name: validated.name,
      password: validated.password 
    }
    var result = await UserModel.userAdd(info);
    res.status(201).send({ Code: 201, result });
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
});

Usercontroller.post('/users/reset', async (req, res) =>{
  try{
    const validated = await validators.userValidator(req.body,{email: true})
    const mailExist = await UserModel.userGetByEmail(validated.email);
    if (!mailExist) throw new Error("There is no account matching this email");
    const result = await UserModel.userSendReset(validated.email)
    res.status(200).send({ Code: 200, result});
  }
  catch(e){
  
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
})

Usercontroller.patch('/users/reset', async (req, res) => {
  try{
    let data = {'password': req.body.password}
    const validated = await validators.userValidator(data,{password: true})
    data.token = req.body.token
    const result = await UserModel.userResetPassword(data)
    res.status(200).send({ Code: 200, result});
  }
  catch(e){
  
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
})

Usercontroller.post('/users/activate', async (req, res) => {
  try{
    const data = {token : req.body.token}
    const result = await UserModel.userConfirmAccount(data)
    res.status(200).send({ Code: 200, result: "Account Activated successfully"});
  }
  catch(e){
    
      res.status(400).send({
        Code: 400,
        Error: e.message
      });
    }
})

/// gets all users
Usercontroller.get("/users", auth, async (req, res) => {
  try {
    var users = await UserModel.userGet();
    res.status(200).send({ Code: 200, users });
  } catch (e) {
    
    res.status(404).send({
      Code: 404,
      Error: e.message
    });
  }
});

// my info
Usercontroller.get("/users/me", auth, async (req, res) => {
  try {
    user = await helper.getPublicProfile(req.user);
    res.status(200).send({ Code: 200,user});
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
});

//// token valid for user
Usercontroller.get("/users/token/:token", async (req, res) => {
  try {
    let data = {
      token : req.params.token
    } 
   const result = await UserModel.userGetByToken(data)
   if(result)
    return res.status(200).send({ Code: 200, result});
  } 
  catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
})

// delete user
Usercontroller.delete("/users/me", auth, async (req, res) => {
  try {
    result = await UserModel.userDel(req.user[0].uuid);
    if (!result)
      return res
        .status(405)
        .send({ Code: 405, Error: "Account was not Deleted" });
    res
      .status(200)
      .send({ Code: 200, Message: "Account Deleted Successfully" });
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
});

Usercontroller.patch("/users/me", auth, async (req, res) => {
  try {
    const args = helper.ReqtoArgs({ ...req.body });
    const validated = await validators.userValidator(req.body, args);
    result = await UserModel.userUpdate(req.user[0].uuid, validated);
    if (!result)
      res.status(200).send({ Code: 200, Message: "Nothing has been Updated" });
    res.status(200).send({ Code: 200, args });
  } catch (e) {
    
    delete req.user[0].password
    delete req.user[0].jwt
    delete req.user[0].token
    delete req.user[0].activated
    res.status(400).send({
      Code: 400,
      User: req.user[0],
      Error: e.message
    });
  }
});


///// usage send a json {"oldpassword: "foo", "newpassword": "bar"}
Usercontroller.patch('/users/password', auth, async (req,res)=>{
  try {
    const oldPass = {'password': req.body.oldpassword}
    const newPass = {'password': req.body.newpassword}
    await validators.userValidator(oldPass,{password: true})
    await validators.userValidator(newPass,{password: true})
    const isMatch = await helper.validatePwd(req.user[0].password, oldPass.password);
    if (!isMatch) {
      throw new Error("Old password wrong");
    }
    result = await UserModel.userUpdatePassword(req.user[0].uuid, newPass.password);
    if(result.summary.counters._stats.propertiesSet == 1)
      res.status(200).send({ Code: 200, Message: "Password Changed successfully"});
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
})

/// login
Usercontroller.post("/users/login", async (req, res) => {
  try {
    const validated = await validators.userValidator(req.body,{email: true, password: true});
    const result = await UserModel.findByCredentials(
      validated.email,
      validated.password
    );
    const jwt = await helper.genAuthToken(result[0].uuid);
    await UserModel.logInUser(result[0].uuid, jwt);
    user = await helper.getPublicProfile(result);
    res.status(200).send({ Code: 200, user, jwt });
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
});

// logout
Usercontroller.post("/users/logout", auth, async (req, res) => {
  try {
    await UserModel.userLogOut(req.user[0].uuid, req.token);
    res
      .status(200)
      .send({ Code: 200, Message: `Good Bye ${req.user[0].name} !` });
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
});

//logout all
Usercontroller.post("/users/logoutall", auth, async (req, res) => {
  try {
    await UserModel.userLogOutAll(req.user[0].uuid, req.token);
    res
      .status(200)
      .send({ Code: 200, Message: `Good Bye ${req.user[0].name} !` });
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
});

//user search by name filter TO ADD: filter the ones who blockd you or you blocked
Usercontroller.get("/users/search", auth, async (req, res) => {
  try {
    if (!req.query.name) throw new Error("No Parameter Provided");
    const data = {
      name : req.query.name.replace(/-/g, " ")
    }
    const validated = await validators.userValidator(data, {name: true})
    validated.name = validated.name.toUpperCase() 
    const users = await UserModel.userSearch(validated.name);
    if (!users)
      return res.status(404).send({ Code: 404, Error: "no user(s) found !" });
    res.status(200).send({ Code: 200, users: await helper.organiseUsers(req.user[0],users)});
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
});

//Usage: {{matcha}}/users/filter?interests=tag1-tag2-tag3&gender=male&orientation=Heterosexual&age=18-100&fame=0-5&location=32.883611,-6.913152&sortage=desc&sortfame=asc&sortinterests=asc&sortlocation=desc
// user filter by gender age or orientation 
Usercontroller.get("/users/filter", auth, async (req, res) => {
  try {
    const args = helper.ReqtoArgs({ ...req.query });
    const validated = await validators.searchValidator(req.query, args)
    var result = await UserModel.userFilter(validated, args, req.user[0].location, req.user[0].uuid)
    if (!result)
      return res.status(404).send({ Code: 404, Error: "no user(s) found !" });
    const users = await helper.organiseUsers(req.user[0], result)
    res.status(200).send({ Code: 200, users });

  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
});

Usercontroller.post("/users/picture/:id", auth, async (req, res) => {
  try {
    await validators.pictureValidator(req.params.id)
      if(!req.query.profile)
        throw new Error("Provide Profile picture parameter")
    const queryRegex = new RegExp(/^true$|^false$/g)
    if(!queryRegex.test(req.query.profile))
      throw new Error("Invalid Profile picture parameter")
    const result = await UserModel.userAddPicture(req.user[0].uuid, req.params.id, req.query.profile)
    if(!result)
      throw new Error("Bad Request")
    res.status(200).send({ Code: 200, Picture: req.params.id})
  }
  catch (e){
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
})
 
// delete pic
Usercontroller.delete("/users/picture/:id", auth, async (req, res) => {
  try {
    await validators.pictureValidator(req.params.id)
    const result = await UserModel.userDelPicture(
      req.user[0].uuid,
      req.params.id
    );
    if (!result)
      throw new Error("Bad Request")
    res.status(200).send({ Code: 200, deleted: req.params.id});
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
});


Usercontroller.post("/users/view/:id", auth, async (req, res) => {
  try {
    
    if(req.params.id === req.user[0].uuid) throw new Error("Something went wrong, same id")
    if(req.params.id.length > 40) throw new Error("Invalid id")
    const result = await UserModel.userView(req.user[0].uuid, req.params.id, req.user[0]);
    if (!result) return res.status(404).send({ Code: 404, Error: "This User does not seem to exist"});;
    result.uuid = req.params.id
    res.status(200).send({ Code: 200, result});
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
});

/// match users
Usercontroller.post("/users/like/:id", auth, async (req, res) => {
  try {
    if(req.params.id === req.user[0].uuid) throw new Error("Something went wrong, same id")
    if(req.params.id.length > 40) throw new Error("Invalid id")
    const result = await UserModel.userLike(req.user[0].uuid, req.params.id, req.user[0].username);
    if (!result) throw new Error("Bad request");
    res.status(200).send({ Code: 200, Message: "Liked !" });
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
});

Usercontroller.post("/users/dislike/:id", auth, async (req, res) => {
  try {
    if(req.params.id === req.user[0].uuid) throw new Error("Something went wrong, same id")
    if(req.params.id.length > 40) throw new Error("Invalid id")
    const result = await UserModel.userDislike(req.user[0].uuid, req.params.id,req.user[0].username);
    if (!result) throw new Error("Bad request");
    res.status(200).send({ Code: 200, Message: "Disliked !" });
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
});

Usercontroller.post("/users/block/:id", auth, async (req, res) => {
  try {
    if(req.params.id === req.user[0].uuid) throw new Error("Something went wrong, same id")
    if(req.params.id.length > 40) throw new Error("Invalid id")
    const result = await UserModel.userBlock(req.user[0].uuid, req.params.id,req.user[0].username);
    if (!result) throw new Error("Bad request");
    res.status(200).send({ Code: 200, Message: "Blocked !" });
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
});

Usercontroller.post("/users/unblock/:id", auth, async (req, res) => {
  try {
    if(req.params.id === req.user[0].uuid) throw new Error("Something went wrong, same id")
    if(req.params.id.length > 40) throw new Error("Invalid id")
    const result = await UserModel.userUnBlock(req.user[0].uuid, req.params.id);
    if (!result) throw new Error("Bad request");
    res.status(200).send({ Code: 200, Message: "Unblocked !" });
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
});

//userReport
Usercontroller.post("/users/report/:id", auth, async (req, res) => {
  try {
    if(req.params.id === req.user[0].uuid) throw new Error("Something went wrong, same id")
    if(req.params.id.length > 40) throw new Error("Invalid id")
    const result = await UserModel.userReport(req.user[0].uuid, req.params.id,req.user[0].username);
    if (!result) throw new Error("Bad request");
    res.status(200).send({ Code: 200, Message: "reported !" });
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
});

Usercontroller.get("/users/likes", auth, async (req, res) => {
  try {
    const result = await UserModel.userGetLikes(req.user[0].uuid);
    if (!result) return res.status(404).send({ Code: 404, Message: "No user(s) Found !"});
    res.status(200).send({ Code: 200, users: await helper.organiseUsers(req.user[0],result)});
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
})
Usercontroller.get("/users/blocked", auth, async (req, res) => {
  try {
    const result = await UserModel.userGetBlocked(req.user[0].uuid);
    if (!result) return res.status(404).send({ Code: 404, Message: "No user(s) Found !"});
    res.status(200).send({ Code: 200, users: await helper.organiseUsers(req.user[0],result)});
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
})
Usercontroller.get("/users/dislikes", auth, async (req, res) => {
  try {
    const result = await UserModel.userGetDislikes(req.user[0].uuid);
    if (!result) return res.status(404).send({ Code: 404, Message: "No user(s) Found !"});
    res.status(200).send({ Code: 200, users: await helper.organiseUsers(req.user[0],result)});
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
})

Usercontroller.get("/users/views", auth, async (req, res) => {
  try {
    const result = await UserModel.userGetViews(req.user[0].uuid);
    if (!result) return res.status(404).send({ Code: 404, Message: "No user(s) Found !"});
    res.status(200).send({ Code: 200, users: await helper.organiseUsers(req.user[0],result)});
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
})


/////////////////////////// Notification

Usercontroller.get("/users/notifications", auth, async (req, res) => {
  try {
    const result = await UserModel.userGetNotifications(req.user[0].uuid);
    if (result.length == 0) return res.status(404).send({ Code: 404, Message: "No Notifications for now !"});
    res.status(200).send({ Code: 200, result});
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
})

Usercontroller.post("/users/notification/read", auth, async (req, res) => {
  try {
    const result = await UserModel.userReadNotification(req.user[0].uuid);
    if (!result) return res.status(400).send({ Code: 400, Message: "Something Went Wrong"});
    res.status(200).send({ Code: 200, Message: "All done"});
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
})

///// gets who the user chating with
Usercontroller.get("/users/chat", auth, async (req, res) => {
  try {
    const result = await UserModel.userGetChat(req.user[0].username)
    if (result.length == 0) return res.status(404).send({ Code: 404, Message: "No Conversations Yet !"});
    res.status(200).send({ Code: 200, result});
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
})

////// get 2 users chat messages 
Usercontroller.get("/users/conversation/:username", auth, async (req, res) => {
  try {
    const userinfo = await UserModel.userGetInfo(req.params.username)
    const result = await UserModel.userGetConversation(req.user[0].username, req.params.username)
    if (result.length == 0) return res.status(404).send({ Code: 404, Message: "No messages", userinfo: await helper.organiseUsers(req.user[0],userinfo)});
    
    res.status(200).send({ Code: 200, result, userinfo: await helper.organiseUsers(req.user[0],userinfo)});
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
})
// send message as a json body to username => {"message": "hello !"}
Usercontroller.post("/users/send/:username", auth, async (req, res) => {
  try {
    const message = await validators.chatValidator(req.body)
    const result = await UserModel.userSendMessage(req.user[0].username, req.params.username, message)
    res.status(200).send({ Code: 200, receiver: req.params.username, result});
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
})

//// my activity
Usercontroller.get("/users/activity", auth, async (req, res) => {
  try {
    const results = await UserModel.userGetHistory(req.user[0]);
    if (!results) return res.status(404).send({ Code: 404, Message: "No activity !"});
    res.status(200).send({ Code: 200, results});
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
})
/// interactions with my profile
Usercontroller.get("/users/fame", auth, async (req, res) => {
  try {
    const results = await UserModel.userGetFame(req.user[0]);
    if (!results) return res.status(404).send({ Code: 404, Message: "No interaction with your profile yet!"});
    res.status(200).send({ Code: 200, results});
  } catch (e) {
    
    res.status(400).send({
      Code: 400,
      Error: e.message
    });
  }
})

//// RUN TO ADD USERS TO DATABASE

// Usercontroller.get("/users/seed" , async (req, res) => {
//   try {
//     const result = await UserModel.seedDatabase()
//     res.send(result)
//   }
//   catch (e) {
//     
//     res.status(400).send({
//       Code: 400,
//       Error: e.message
//     });
//   }
// })

/// for other routes than dont exist
Usercontroller.use((req, res, next) => {
  res
    .status(404)
    .send({ Code:404 , Error: "Seems like your page doesn't exists anymore !" });
});

module.exports = Usercontroller;
