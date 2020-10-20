const express = require("express");
const userRouter = new express.Router();
const axios = require("axios").default;
const public_ip = require("public-ip");
const iplocation = require("node-iplocate");
const conf = require("../config");
const auth = require("../middleware/auth");
const complete = require("../middleware/complete");
const api = `http://${conf.apiIp}:${conf.portNumApi}`;
const helpers = require("../helpers/helpers");
const fs = require("fs");
const upload = require("../middleware/upload");

/////////////////////////////// GETS

userRouter.post("/users/deleteAccount", auth, complete, async (req, res) => {
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .delete(`${api}/users/me`)
    .then(function (response) {
      if (response.status == 200) res.clearCookie("jwt");
      res.clearCookie("user");
      res.clearCookie("userinfo");
      res.redirect("/login");
    })
    .catch(function (error) {
      if (!error.response)
        return res.render("pages/editProfile", {
          error: "Something went wrong, try again shortly..",
        });
      if (error.response.data.Code == 400) {
        return res.render("pages/editProfile", {
          error: error.response.data.Error,
        });
      }
    });
});

///error check done
userRouter.get("/history", auth, complete, async (req, res) => {
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .get(`${api}/users/fame`)
    .then(function (response) {
      if (response.status == 200)
        res.render("pages/history", {
          results: response.data.results,
          error_msg: undefined,
          error_code: undefined,
        });
    })
    .catch(function (error) {
      if (!error.response)
        return res.render("pages/history", {
          error_msg: "Something went wrong, try again shortly..",
          error_code: 400,
          results: undefined,
        });
      if (error.response.status == 404)
        return res.render("pages/history", {
          error_msg: error.response.data.Message,
          error_code: error.response.status,
          results: undefined,
        });
      if (error.response.status == 400)
        return res.render("pages/history", {
          error_msg: error.response.data.Error,
          error_code: error.response.status,
          results: undefined,
        });
    });
});

// post change password
///error check done
userRouter.post("/changePassword", auth, complete, async (req, res) => {
  if (
    req.body.newPassword === "" ||
    req.body.confirmNewPassword === "" ||
    req.body.oldPassword == ""
  ) {
    error_msg = "empty fields";
    return res.render("pages/changePassword", {
      error_msg,
      success_msg: undefined,
    });
  }
  if (req.body.newPassword !== req.body.confirmNewPassword) {
    error_msg = "your new password dosen't match";
    return res.render("pages/changePassword", {
      error_msg,
      success_msg: undefined,
    });
  }
  delete req.body.confirmNewPassword;
  req.body = {
    oldpassword: req.body.oldPassword,
    newpassword: req.body.newPassword,
  };
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .patch(`${api}/users/password`, req.body)
    .then((response) => {
      if (response.data.Code == 200)
        return res.render("pages/changePassword", {
          success_msg: "password changed successfully",
          error_msg: undefined,
        });
    })
    .catch((error) => {
      if (!error.response)
        return res.render("pages/changePassword", {
          error_msg: "Something went wrong, try again shortly..",
          success_msg: undefined,
        });
      if (error.response.data.Code == 400)
        return res.render("pages/changePassword", {
          error_msg: error.response.data.Error,
          success_msg: undefined,
        });
    });
});

// get change password

userRouter.get("/changePassword", auth, complete, async (req, res) => {
  res.render("pages/changePassword", {
    error_msg: undefined,
    success_msg: undefined,
  });
});

// get activity page
///error check done
userRouter.get("/activity", auth, complete, async (req, res) => {
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .get(`${api}/users/activity`)
    .then(function (response) {
      if (response.status == 200)
        return res.render("pages/activity", {
          results: response.data.results,
          error_msg: undefined,
          error_code: undefined,
        });
    })
    .catch(function (error) {
      if (!error.response)
        return res.render("pages/activity", {
          error_msg: "Something went wrong, try again shortly..",
          error_code: 400,
          results: undefined,
        });
      if (error.response.status == 404)
        return res.render("pages/activity", {
          error_msg: error.response.data.Message,
          error_code: error.response.status,
          results: undefined,
        });
      if (error.response.status == 400)
        return res.render("pages/activity", {
          error_msg: error.response.data.Error,
          error_code: error.response.status,
          results: undefined,
        });
    });
});

///error check done
userRouter.post("/users/conversations", auth, complete, async (req, res) => {
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .get(`${api}/users/chat`)
    .then(function (response) {
      if (response.status == 200)
        return res.send({
          result: response.data.result,
          Code: 200,
          error: undefined,
        });
    })
    .catch(function (error) {
      if (!error.response)
        return res.send({
          error: "Server down check again later...",
          Code: 400,
          result: undefined,
        });
      if (error.response.status == 404)
        return res.send({
          error: error.response.data.Message,
          Code: 404,
          result: undefined,
        });
      if (error.response.status == 400)
        return res.send({
          error: "Something Went Wrong",
          Code: 400,
          result: undefined,
        });
    });
});

///error check done
userRouter.post("/users/notifications", auth, complete, async (req, res) => {
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .get(`${api}/users/notifications`)
    .then(function (response) {
      if (response.status == 200)
        return res.send({ result: response.data.result, Code: 200 });
    })
    .catch(function (error) {
      if (!error.response)
        return res.send({
          error: "Server down check again later...",
          Code: 400,
        });
      if (error.response.status == 404)
        return res.send({ error: error.response.data.Message, Code: 404 });
      if (error.response.status == 400)
        return res.send({ error: "Something Went Wrong", Code: 400 });
    });
});
///error check done
userRouter.post("/users/read", auth, complete, async (req, res) => {
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .post(`${api}/users/notification/read`)
    .then(function (response) {
      res.send(response.data);
    })
    .catch(function (error) {
      res.send(error.response.data);
    });
});

///error check done
userRouter.post(
  "/users/messages/:username",
  auth,
  complete,
  async (req, res) => {
    axios.defaults.headers.common["Authorization"] =
      "Bearer " + req.cookies.jwt;
    axios
      .get(`${api}/users/conversation/${req.params.username}`)
      .then(function (response) {
        // console.log(response.data)
        //// response.data
        res.send(response.data);
      })
      .catch(function (error) {
        // console.log(error.response.data)
        if (!error.response)
          return res.send({
            error: "Server down check again later...",
            Code: 400,
          });
        if (error.response.data.Code == 400)
          return res.send({ error: error.response.data.Error, Code: 400 });
        res.send(error.response.data);
      });
  }
);

///error check done
///////////// handles posting messages to server
userRouter.post("/users/chat", auth, complete, async (req, res) => {
  if (req.cookies.user) user = JSON.parse(req.cookies.user);
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .post(`${api}/users/send/${req.body.user}`, { message: req.body.message })
    .then((response) => {
      return req.app.io.emit("incomingMessage", {
        receiver: response.data.receiver,
        message: req.body.message,
      });
    })
    .catch((error) => {
      if (!error.response)
        return req.app.io.emit("messageNotSent", {
          username: user.username,
          message: "Server down check again later...",
        });
      if (error.response.data.Code == 400)
        return req.app.io.emit("messageNotSent", {
          username: user.username,
          message: "Message was not sent",
        });
    });
});

userRouter.get("/users/chat/:username", auth, complete, async (req, res) => {
  res.render("pages/chat");
});

///error check done
// browsing
userRouter.get("/", auth, complete, async (req, res) => {
  console.log(req.cookies.jwt);
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  let data = {
    gender: "",
    age: "",
    interests: "",
    fame: "",
    location: "",
    sortfame: "desc",
    sortage: "asc",
    sortinterests: "desc",
    sortlocation: "asc",
  };
  axios
    .get(`${api}/users/me`)
    .then((response) => {
      const user = response.data.user;
      let age = helpers.getAge(user.birthdate);
      data.age = `${age}-100`;
      data.interests = user.interests.join("-");
      data.fame = `${user.fameRating}-5`;
      data.location = user.location.join(",");
      if (user.orientation == "Heterosexual") {
        if (user.gender == "male") {
          data.gender = "female";
        }
        if (user.gender == "female") {
          data.gender = "male";
        }
      }
      if (user.orientation == "Homosexual") {
        if (user.gender == "male") {
          data.gender = "male";
        }
        if (user.gender == "female") {
          data.gender = "female";
        }
      }
      if (user.orientation == "Bisexual") delete data.gender;
      data.strict = false;
      console.log(data);
      axios
        .get(`${api}/users/filter`, { params: data })
        .then((response) => {
          if (response.data.users.length <= 0)
            return res.render("pages/browsing", {
              error:
                "Sorry no compatible users found try using advanced search",
              Code: 404,
            });
          res.render("pages/browsing", {
            users: response.data.users,
            error: undefined,
            Code: undefined,
          });
        })
        .catch((error) => {
          if (!error.response)
            return res.render("pages/browsing", {
              error: "Something went wrong, try again shortly..",
              Code: 400,
            });
          if (error.response.status == 400)
            return res.render("pages/browsing", {
              error: error.response.data.Error,
              Code: 400,
            });
          if (error.response.status == 404)
            return res.render("pages/browsing", {
              error: error.response.data.Error,
              Code: 404,
            });
        });
    })
    .catch((error) => {
      if (!error.response)
        return res.render("pages/browsing", {
          error: "Something went wrong, try again shortly..",
          Code: 400,
        });
      if (error.response.status == 400)
        return res.render("pages/browsing", {
          error: error.response.data.Error,
          Code: 400,
        });
      if (error.response.status == 401) return res.redirect("/login");
    });
});

///error check done
//// browsing js
userRouter.post("/browse", auth, complete, async (req, res) => {
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  let data = req.body;
  if (!data.fame && !data.age && !data.location && !data.interests) {
    return res.render("pages/browsing", {
      error: "Select at least one criteria",
      Code: 405,
    });
  }

  axios
    .get(`${api}/users/me`)
    .then((response) => {
      const user = response.data.user;
      // filterables
      if (data.age) {
        let age = helpers.getAge(user.birthdate);
        data.age = `${age}-100`;
      }

      if (data.interests) data.interests = user.interests.join("-");

      if (data.fame) data.fame = `${user.fameRating}-5`;

      if (data.location) data.location = user.location.join(",");
      // end filterables

      if (user.orientation == "Heterosexual") {
        if (user.gender == "male") {
          data.gender = "female";
        }
        if (user.gender == "female") {
          data.gender = "male";
        }
      }
      if (user.orientation == "Homosexual") {
        if (user.gender == "male") {
          data.gender = "male";
        }
        if (user.gender == "female") {
          data.gender = "female";
        }
      }
      if (user.orientation == "Bisexual") delete data.gender;

      data.strict = false;
      axios
        .get(`${api}/users/filter`, { params: data })
        .then((response) => {
          if (response.data.users.length <= 0)
            return res.render("pages/browsing", {
              error:
                "Sorry no compatible users found try using advanced search",
              Code: 404,
            });
          res.render("pages/browsing", {
            users: response.data.users,
            error: undefined,
            Code: undefined,
          });
        })
        .catch((error) => {
          if (!error.response)
            return res.render("pages/browsing", {
              error: "Something went wrong, try again shortly..",
              Code: 400,
            });
          if (error.response.status == 400)
            return res.render("pages/browsing", {
              error: error.response.data.Error,
              Code: 400,
            });
          if (error.response.status == 404)
            return res.render("pages/browsing", {
              error: error.response.data.Error,
              Code: 404,
            });
        });
    })
    .catch((error) => {
      if (!error.response)
        return res.render("pages/browsing", {
          error: "Something went wrong, try again shortly..",
          Code: 400,
        });
      if (error.response.status == 400)
        return res.render("pages/browsing", {
          error: error.response.data.Error,
          Code: 400,
        });
      if (error.response.status == 401) return res.redirect("/login");
    });
});

///error check done
//get edit profile
userRouter.get("/editProfile", auth, complete, async (req, res) => {
  if (req.query.error) error = req.query.error;
  else error = undefined;
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .get(`${api}/users/me`)
    .then((response) => {
      //console.log(response)
      let user = response.data.user;
      var date = user.birthdate.split("/");
      user.birthdate = date[2] + "-" + date[0] + "-" + date[1];
      user.location = user.location.join(",");
      user.tags = user.interests.join("-");
      let userInfo = { user };
      res.render("pages/editProfile", { userInfo, error });
    })
    .catch((error) => {
      if (!error.response)
        return res.render("pages/editProfile", {
          error: "Something went wrong, try again shortly..",
        });
      if (error.response.data.Code == 400)
        return res.render("pages/editProfile", {
          error: error.response.data.Error,
        });
      if (error.response.status == 401) return res.redirect("/login");
    });
});
///error check done
/// post edit profile
userRouter.post("/editProfile", auth, complete, async (req, res) => {
  if (req.body.location != undefined && req.body.location == "") {
    var location;
    var ip = req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',')[0] || req.ip && req.ip.replace('::ffff:', '') || await public_ip.v4();
    location = await iplocation(ip)
      .then((res) => {
        return res.latitude + "," + res.longitude;
      })
      .catch((err) => {
        return res.render("pages/editProfile", { error: err });
      });
    req.body.location = location;
  }
  if (req.body.birthdate != undefined && req.body.birthdate != "") {
    var date = req.body.birthdate.split("-");
    req.body.birthdate = date[1] + "/" + date[2] + "/" + date[0];
  }
  if (req.body.birthdate == "") delete req.body.birthdate;
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .patch(`${api}/users/me`, req.body, {
      headers: { "Content-Type": "application/json" },
    })
    .then((response) => {
      if (typeof response.data !== "undefined")
        if (response.data.Code == 200) return res.redirect("/editProfile");
    })
    .catch((error) => {
      if (!error.response)
        return res.render("pages/editProfile", {
          error: "Something went wrong, try again shortly..",
        });
      if (error.response.data.Code == 400) {
        let userInfo = {};
        userInfo.user = error.response.data.User;
        return res.render("pages/editProfile", {
          error: error.response.data.Error,
          userInfo,
        });
      }
    });
});

userRouter.get("/users/error", auth, complete, async (req, res) => {
  if (req.query.error != undefined) error = req.query.error;
  else error = undefined;
  if (req.query.status != undefined) status = req.query.status;
  else status = 404;
  res.render("pages/error", { error, status });
});
///error check done
userRouter.post("/users/advancedSearch", auth, complete, async (req, res) => {
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  let data = {};
  let entries = Object.entries(req.body);
  for (const [name, value] of entries) {
    data[name] = value;
    if (!value || value == "") delete data[name];
  }
  data.strict = true;
  axios
    .get(`${api}/users/filter`, { params: data })
    .then((response) => {
      if (response.data.users.length <= 0)
        return res.render("pages/advancedSearch", {
          error: "Sorry no users found by this criteria",
          Code: 404,
        });
      return res.render("pages/advancedSearch", {
        users: response.data.users,
        error: undefined,
        Code: undefined,
      });
    })
    .catch((error) => {
      if (!error.response)
        return res.render("pages/advancedSearch", {
          error: "Something went wrong, try again shortly..",
          Code: 400,
        });
      if (error.response.status == 400)
        return res.render("pages/advancedSearch", {
          error: error.response.data.Error,
          Code: 400,
        });
      if (error.response.status == 404)
        return res.render("pages/advancedSearch", {
          error: error.response.data.Error,
          Code: 404,
        });
    });
});
///error check done
// advanced search page
userRouter.get("/users/advancedSearch", auth, complete, async (req, res) => {
  res.render("pages/advancedSearch", { error: undefined });
});

///error check done
// get view /// add if he likes me or not and orientation
userRouter.get("/users/view/:uuid", auth, complete, async (req, res) => {
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .post(`${api}/users/view/${req.params.uuid}`)
    .then((response) => {
      if (response.data.Code == 200) {
        const user = response.data.result;
        req.app.io.emit("viewed", { username: user.username });
        res.render("pages/view", { user, error: undefined, Code: undefined });
      }
    })
    .catch((error) => {
      if (!error.response)
        return res.render("pages/view", {
          user: undefined,
          error: "Something went wrong, try again shortly..",
          Code: 400,
        });
      if (error.response.status == 400)
        return res.render("pages/view", {
          user: undefined,
          error: error.response.data.Error,
          Code: 400,
        });
      if (error.response.status == 404)
        return res.render("pages/view", {
          user: undefined,
          error: error.response.data.Error,
          Code: 404,
        });
      if (error.response.status == 401) return res.redirect("/login");
    });
});

// logout
userRouter.get("/logout", auth, async (req, res) => {
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .post(`${api}/users/logout`)
    .then((response) => {
      res.clearCookie("jwt");
      res.clearCookie("user");
      res.clearCookie("userinfo");
      res.redirect("/login");
    })
    .catch((error) => {
      if (error.response.status == 401) return res.redirect("/login");
      console.log(e.response);
    });
});
////////////////////////// POSTS

///error check done
// upload picture profile edit profile
userRouter.post("/uploadProfile", auth, upload, async (req, res) => {
  if (typeof req.fileError == "string") {
    return res.redirect("/editProfile?error=" + req.fileError);
  }
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .post(
      `${api}/users/picture/${req.file.filename}`,
      { headers: { "Content-Type": "application/json" } },
      { params: { profile: true } }
    )
    .then((response) => {
      if (typeof response.data !== "undefined")
        if (response.data.Code == 200) return res.redirect("/editProfile");
    })
    .catch((error) => {
      if (!error.response)
        return res.render("pages/editProfile", {
          error: "Something went wrong, try again shortly..",
        });
      if (error.response.data.Code == 400) {
        let userInfo = {};
        userInfo.user = error.response.data.User;
        return res.render("pages/editProfile", {
          error: error.response.data.Error,
          userInfo,
        });
      }
    });
});
///error check done
// upload picture profile edit profile
userRouter.post("/uploadPictures", auth, upload, async (req, res) => {
  if (typeof req.fileError == "string") {
    return res.redirect("/editProfile?error=" + req.fileError);
  }
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .post(
      `${api}/users/picture/${req.file.filename}`,
      { headers: { "Content-Type": "application/json" } },
      { params: { profile: false } }
    )
    .then((response) => {
      if (typeof response.data !== "undefined")
        if (response.data.Code == 200) return res.redirect("/editProfile");
    })
    .catch((error) => {
      if (!error.response)
        return res.render("pages/editProfile", {
          error: "Something went wrong, try again shortly..",
        });
      if (error.response.data.Code == 400) {
        let userInfo = {};
        userInfo.user = error.response.data.User;
        return res.render("pages/editProfile", {
          error: error.response.data.Error,
          userInfo,
        });
      }
    });
});
///error check done
userRouter.post("/complete", auth, upload, async (req, res) => {
  if (typeof req.fileError == "string") {
    return res.render("pages/complete", { message: req.fileError });
  }
  if (req.body.birthdate == "")
    return res.render("pages/complete", { message: "select birthdate" });
  if (req.body.location != undefined && req.body.location == "") {
    var location;
    var ip = req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',')[0] || req.ip && req.ip.replace('::ffff:', '') || await public_ip.v4();
    location = await iplocation(ip)
      .then((res) => {
        return res.latitude + "," + res.longitude;
      })
      .catch((err) => {
        return res.render("pages/complete", { error: err });
      });
    req.body.location = location;
  }
  var date = req.body.birthdate.split("-");
  req.body.birthdate = date[1] + "/" + date[2] + "/" + date[0];
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .all([
      axios.patch(`${api}/users/me`, req.body, {
        headers: { "Content-Type": "application/json" },
      }),
      axios.post(
        `${api}/users/picture/${req.file.filename}`,
        { headers: { "Content-Type": "application/json" } },
        { params: { profile: true } }
      ),
    ])
    .then(
      axios.spread((...response) => {
        if (response[0].status == 200 && response[1].status == 200) {
          return res.redirect("/logout");
        }
      })
    )
    .catch((errors) => {
      if (!errors.response)
        return res.render("pages/complete", {
          message: "Something went wrong",
        });
      if (errors.response)
        return res.render("pages/complete", {
          message: errors.response.data.Error,
        });
      else
        return res.render("pages/complete", {
          message: "Something went wrong",
        });
    });
});

userRouter.get("/complete", auth, complete, async (req, res) => {
  res.render("pages/complete");
});

///error check done
//delete picture
userRouter.post("/users/deletePicture", auth, complete, async (req, res) => {
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .delete(`${api}/users/picture/${req.body.picture}`, {
      headers: { "Content-Type": "application/json" },
    })
    .then((response) => {
      if (typeof response.data !== "undefined")
        if (response.data.Code == 200) {
          var filePath =
            process.cwd() + "/public/assets/images/" + req.body.picture;
          fs.unlinkSync(filePath);
          return res.redirect("/editProfile");
        }
    })
    .catch((error) => {
      if (!error.response)
        return res.render("pages/editProfile", {
          error: "Something went wrong, try again shortly..",
        });
      if (error.response.data.Code == 400) {
        let userInfo = {};
        userInfo.user = error.response.data.User;
        return res.render("pages/editProfile", {
          error: error.response.data.Error,
          userInfo,
        });
      }
    });
});
//like user
userRouter.post("/users/like", auth, complete, async (req, res) => {
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .post(`${api}/users/like/${req.body.uuid}`, {
      headers: { "Content-Type": "application/json" },
    })
    .then((response) => {
      if (typeof response.data !== "undefined")
        if (response.data.Code == 200) {
          req.app.io.emit("interact", { uuid: req.body.uuid });
          return res
            .status(200)
            .send({ success: "Liked, we'll let them know", Code: 200 });
        }
    })
    .catch((error) => {
      if (!error.response)
        return res.send({
          error: "Something went wrong, try again shortly..",
          Code: 400,
        });
      if (error.response.status == 400)
        return res.send({ error: error.response.data.Error, Code: 400 });
    });
});
//dislike user
userRouter.post("/users/dislike", auth, complete, async (req, res) => {
  console.log(req.body);
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .post(`${api}/users/dislike/${req.body.uuid}`, {
      headers: { "Content-Type": "application/json" },
    })
    .then((response) => {
      if (typeof response.data !== "undefined")
        if (response.data.Code == 200) {
          req.app.io.emit("interact", { uuid: req.body.uuid });
          return res.status(200).send({ success: "Okay, Disliked", Code: 200 });
        }
    })
    .catch((error) => {
      if (!error.response)
        return res.send({
          error: "Something went wrong, try again shortly..",
          Code: 400,
        });
      if (error.response.status == 400)
        return res.send({ error: error.response.data.Error, Code: 400 });
    });
});
//block user
userRouter.post("/users/block", auth, complete, async (req, res) => {
  console.log(req.body);
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .post(`${api}/users/block/${req.body.uuid}`, {
      headers: { "Content-Type": "application/json" },
    })
    .then((response) => {
      if (typeof response.data !== "undefined")
        if (response.data.Code == 200) {
          req.app.io.emit("interact", { uuid: req.body.uuid });
          return res
            .status(200)
            .send({
              success: "Blocked, You'll never hear from them again",
              Code: 200,
            });
        }
    })
    .catch((error) => {
      if (!error.response)
        return res.send({
          error: "Something went wrong, try again shortly..",
          Code: 400,
        });
      if (error.response.status == 400)
        return res.send({ error: error.response.data.Error, Code: 400 });
    });
});

//unblock user
userRouter.post("/users/unblock", auth, complete, async (req, res) => {
  console.log(req.body);
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .post(`${api}/users/unblock/${req.body.uuid}`, {
      headers: { "Content-Type": "application/json" },
    })
    .then((response) => {
      if (typeof response.data !== "undefined")
        if (response.data.Code == 200) {
          req.app.io.emit("interact", { uuid: req.body.uuid });
          return res
            .status(200)
            .send({ success: "Unblocked, fine we get it", Code: 200 });
        }
    })
    .catch((error) => {
      if (!error.response)
        return res.send({
          error: "Something went wrong, try again shortly..",
          Code: 400,
        });
      if (error.response.status == 400)
        return res.send({ error: error.response.data.Error, Code: 400 });
    });
});

//report user
userRouter.post("/users/report", auth, complete, async (req, res) => {
  axios.defaults.headers.common["Authorization"] = "Bearer " + req.cookies.jwt;
  axios
    .post(`${api}/users/report/${req.body.uuid}`, {
      headers: { "Content-Type": "application/json" },
    })
    .then((response) => {
      if (typeof response.data !== "undefined")
        if (response.data.Code == 200) {
          req.app.io.emit("interact", { uuid: req.body.uuid });
          return res
            .status(200)
            .send({ success: "Reported, Sorry about that", Code: 200 });
        }
    })
    .catch((error) => {
      if (!error.response)
        return res.send({
          error: "Something went wrong, try again shortly..",
          Code: 400,
        });
      if (error.response.status == 400)
        return res.send({ error: error.response.data.Error, Code: 400 });
    });
});


module.exports = userRouter;
