const complete = async (req, res, next) => {
    const user = JSON.parse(req.cookies.user)
    if (!user.setupDone) {
        if(req.url == "/complete")
            next();
        else
        res.redirect("/complete");
    }
    else if(user.setupDone){
        if(req.url == "/complete")
        res.redirect("/")
        else
        next();
    }
}
module.exports = complete;