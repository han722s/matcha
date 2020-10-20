const express = require('express');
const authRouter = new express.Router();
const axios = require('axios').default;
const conf = require("../config")
const api = `http://${conf.apiIp}:${conf.portNumApi}`
const helpers = require("../helpers/helpers")

authRouter.get('/register',async (req, res) => {
    res.render('pages/register', {error: undefined , success : undefined})    
});

authRouter.post('/register',async (req, res) => {
    if(req.body.password != req.body.confirmPassword)
    {
        error = 'confirm password does not match';
        return res.render('pages/register',{success : undefined, error});
    }
    else 
    {
        req.body= {
            'username' : req.body.username,
            'name' : req.body.name,
            'email' : req.body.email,
            'password' : req.body.password
         };
         axios.post(`${api}/users`,req.body)
         .then((response) => {
            if(response.data.Code == 201)
                return res.render('pages/register',{success : response.data.result, error: undefined})         
         }
         ).catch((e) => {
             if(!e.response)
                return res.render('pages/register',{success : undefined, error : "Something went wrong"})
            if(e.response.data.Code == 400)
                return res.render('pages/register',{success : undefined, error : e.response.data.Error})
         }
         );
    }
});


authRouter.get('/login', async (req, res) => {
    res.render('pages/login', {error: undefined})
});

authRouter.post('/login', async (req, res) => {
    axios.post(`${api}/users/login`,req.body)
    .then((response) => {
        if(typeof response.status !== 'undefined' &&  response.status == 200)
        {
             const cookieOptions = {
                httpOnly: true,
                expires: 0 
                }
             res.cookie('jwt', response.data.jwt, cookieOptions)
             res.cookie('user', JSON.stringify(helpers.getPublicUser(response.data.user)), cookieOptions)
             res.cookie('userinfo', response.data.user.username+"/"+response.data.user.uuid)
                if(response.data.user.setupDone == false)
                    return res.redirect('/complete')
                return res.redirect('/')  
        }       
    }
    ).catch((e) => {
        if(!e.response)
            return res.render('pages/login',{error : "Something went wrong"}); 
        return res.render('pages/login',{error : e.response.data.Error}); 
    }
    ); 
});

// post reset password
authRouter.post('/reset/:token',async(req,res) => {
        token = req.params.token
        if(req.body.newPassword != req.body.ConfirmNewPassword){
            error = 'passwords does not match';
            return res.render('pages/resetPassword',{error ,token, message_success: undefined});
        }
            password = req.body.newPassword
            data_to_send = {
                'password' : password,
                'token' : token
            }
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + req.cookies.jwt;
            axios.patch(`${api}/users/reset`, data_to_send, { headers: { 'Content-Type': 'application/json' } })
              .then((response) => {
                if (typeof response.data !== 'undefined')
                  if (response.data.Code == 200){
                    res.clearCookie("jwt");
                    res.clearCookie("user");
                    res.clearCookie("userinfo");
                    return res.render('pages/login',{error: undefined, message_success : 'password reset succefully you can now log in'})
                  }     
              }).catch((error) => {
                if(!error.response)
                    return res.render('pages/resetPassword', { error: "Something Went wrong..." , token, message_success : undefined})
                if(error.response.data.Code === 400 || error.response.data.Code === 404) 
                    return res.render('pages/resetPassword', { error: error.response.data.Error , token, message_success : undefined})
              });
  })

// get reset password
authRouter.get('/reset/:token',async(req,res) => {
    const token = req.params.token
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + req.cookies.jwt;
    axios.get(`${api}/users/token/${token}`).then((response)=>{
        return res.render('pages/resetPassword',{ token, error: undefined, message_success: undefined})
    }).catch((error)=>{
        if(!error.response)
            return res.render('pages/resetPassword',{ token: undefined, error: "Something went wrong", message_success: undefined})
        return res.render('pages/resetPassword',{ token: undefined, error: error.response.data.Error, message_success: undefined})
    })
  })

  
// get forgot password
authRouter.get('/forgotPassword',async(req,res) => {
    res.render('pages/forgotPassword', {message:undefined
        ,message_success: undefined})
  })
  
// post forgot password
authRouter.post('/forgotPassword',async(req,res) => {
    axios.post(`${api}/users/reset`,req.body)
         .then((response) => {
             if(typeof response.data !== 'undefined' )
                if(response.data.Code == 200) 
                return res.render('pages/forgotPassword',{message_success : 'A reset password link has been sent to your mailbox',message:undefined})       
         }
         ).catch((e) => {
             if(!e.response)
             return res.render('pages/forgotPassword',{message : "Something went wrong", message_success: undefined})  
            if(e.response.data.Code === 400 || e.response.data.Code === 404)
            return res.render('pages/forgotPassword',{message : e.response.data.Error,message_success: undefined})       
            })
         
  })

authRouter.get('/confirm/:token', async (req,res) => {
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + req.cookies.jwt;
    const data = {token: req.params.token}
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + req.cookies.jwt;
    axios.post(`${api}/users/activate`, data, { headers: { 'Content-Type': 'application/json' } })
    .then((response)=>{
        if(response.data)
            return res.render('pages/confirm', {success: response.data.result, error: undefined, Code: undefined})
        return res.render('pages/confirm', {success: undefined, error: "Something Went Wrong", Code: 400})
    })
    .catch((error)=>{
        if(!error.response)
            return res.render('pages/confirm', {success: undefined, error: "Something Went Wrong", Code: 400})
        return res.render('pages/confirm', {success: undefined, error: error.response.data.Error, Code: 400})
    })
  })


module.exports = authRouter;