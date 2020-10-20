const multer = require('multer')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "/front/public/assets/images");
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + "-" + Date.now() + ".jpg");
    }
});
const upload = multer({
    limits: {
      fileSize: 5000000
    },
    fileFilter(req, file, cb) {
      if (!file.originalname.match(/\.(jpeg|jpg)$/)){
        req.fileValidationError = 'File ext error'
        return cb(new Error("File ext error"));
      }
      if (!file.mimetype === "image/jpeg" || !file.mimetype === "image/jpg"){
        req.fileValidationError = "File error"
        return cb(new Error("File error"));
      }
       
      cb(undefined, true);
    },
    storage: storage
  }).single('profile')


const uploadFile = async (req, res, next)=>{
    upload(req, res, function(err) {
    if (req.fileValidationError) {
        req.fileError = req.fileValidationError
        // return res.redirect('/editProfile?error=' + req.fileValidationError)
    }
    else if (!req.file) {
        req.fileError = "select image"
        // return res.redirect('/editProfile?error=select image')
    }
    else if (err instanceof multer.MulterError) {
        req.fileError = err
        // return res.redirect('/editProfile?error=' + err)
    }
    else if (err) {
        req.fileError = err
        // return res.redirect('/editProfile?error=' + err)
    }
    next()
})
}
// multer settings

  module.exports = uploadFile