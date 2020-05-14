const helpers = {
    getAge : birthDate => Math.floor((new Date() - new Date(birthDate).getTime()) / 3.15576e+10),
    getPublicUser: (user)=>{
      delete user.email
      delete user.bio
      delete user.email
      delete user.token
      return user
    }
}


module.exports = helpers