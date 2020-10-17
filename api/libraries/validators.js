
const helpers = require("../helpers/helpers")
const userArgs = {email : false, name: false, username: false, gender: false, password: false, orientation: false, birthdate:false, location: false, bio: false}
const searchArgs = {username: false, name: false, gender: false, orientation: false, location: false, fame: false, interests: false, age: false, radius: false, sortage: false, sortfame: false, sortinterests: false, sortlocation: false, strict: false}

const validators = {

    /**
     * Validate user all user info or by specifying arguments
     * @param {Object} data - input data
     * @param {Object} args - validate all or arguments specified {email, name, gender, password, orient, birthdate, }
     * @return validated data
    */
   userValidator : async (data ,args = userArgs) => {

    const emailRegex = new RegExp(/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i)
    const genderRegex = new RegExp(/^male$|^female$/g)
    const nameRegex = new RegExp(/^[A-Za-z][A-Za-z\'\-]+([\ A-Za-z][A-Za-z\'\-]+)*/)
    const tagsRegex = new RegExp(/\b[a-zA-Z0-9]{1,20}\b/)
    const userNameRegex = new RegExp(/^(?=.{8,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/)
    const orientationRegex = new RegExp(/^Heterosexual$|^Homosexual$|^Bisexual$/g)
    const passwordRgex = new RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-])/)
    const latitudeRegex = new RegExp(/^(\+|-)?(?:90(?:(?:\.0{1,6})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,20})?))$/)
    const longitudeRegex = new RegExp(/^(\+|-)?(?:180(?:(?:\.0{1,6})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,20})?))$/)
    const birthdateRegex = new RegExp(/^\d{2}\/\d{2}\/\d{4}/)
    const Body = Object.keys(data)
    const values = Object.values(data)
    const Allowed = ['orientation','password','gender','name','email','birthdate', 'location','username', 'bio', 'interests']

    //// check every element of body if it has the allowed array elements returns false if one element doest correspond
    const isValidOperation = Body.every((element) => Allowed.includes(element))
    if(!isValidOperation)
        throw new Error("Not a valid operation Element not Allowed")
    /// gets types of every input
    const typeAllowed = values.every((element) => typeof element == "string" ? true : false)
    if(!typeAllowed)
        throw new Error("Not a Valid operation Type not Allowed")
        
    if(JSON.stringify(data) === '{}' || data == '')
        throw new Error("Empty Body")

    if(args.email == true){
        data.email = data.email.trim()
        data.email = data.email.toLowerCase()
        if(!emailRegex.test(data.email) || data.email.length > 250 )
        throw new Error("Not a valid operation Email")
    }
    if (args.birthdate == true)
        {
            console.log(data.birthdate)
                    if(!validators.dateValidator(data.birthdate) 
                    || helpers.getAge(data.birthdate) < 18 || helpers.getAge(data.birthdate) >= 100 
                    || data.birthdate === '' || data.birthdate == undefined 
                    || data.birthdate.length != 10 || !birthdateRegex.test(data.birthdate) || isNaN(Date.parse(data.birthdate)))
            throw new Error("Not a valid operation Birthdate")
        }
    if (args.gender == true)
        if(!genderRegex.test(data.gender))
            throw new Error("Not a valid operation Gender")

    if (args.name == true){
        data.name = data.name.trim()
        data.name = data.name.toLowerCase()
        if(!nameRegex.test(data.name) || data.name.length > 70 || data.name.length < 2)
            throw new Error("Not a valid operation name")
        }
       
    if(args.username == true){
        data.username = data.username.trim()
        data.username = data.username.toLowerCase()
        if(!userNameRegex.test(data.username) || data.username.length > 70 || data.username.length < 2)
            throw new Error("Not a valid operation Username")
    }

    if (args.orientation == true)
        if(!orientationRegex.test(data.orientation))
            throw new Error("Not a valid operation Orientation")

    if (args.location == true){
        let coordinates = data.location.split(",")
        //                  coordinates[0]: Latitude               coordinates[1]: Longtitude
        if(!coordinates || !latitudeRegex.test(coordinates[0]) || !longitudeRegex.test(coordinates[1]))
            throw new Error("Not a valid operation Location")
        delete data.location
        data.location = coordinates
    }

    if (args.bio == true){
        data.bio = data.bio.trim()
        data.bio = data.bio.toLowerCase()
        data.bio = await helpers.sanitizeStr(data.bio)
        if(data.bio.length > 200 || data.bio.length < 10)
            throw new Error("Not a valid operation Biography")
    }

    if(args.interests == true){
        let tags = data.interests.split("-")
        let newTags = []
        console.log(tags)
        tags.forEach(element => {
            element = element.trim()
            element = element.toLowerCase()
            if(!tagsRegex.test(element) || element.length > 30)
                throw new Error("Not a valid operation Tag")
            newTags.push(element)
        })
        delete data.interests
        data.interests = newTags
    }
   
    if (args.password == true)
        if(!passwordRgex.test(data.password) || data.password.length < 6 ||  data.password.length > 72)
            throw new Error("Not a valid operation password")
    return data
    },

    /**
     * Obviously it validates dates
     * @param {} - date string
     * @return {} validated data
    */
    dateValidator: async (dateString) => {
    if(!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString))
        return false;

    // Parse the date parts to integers
    var parts = dateString.split("/");
    var day = parseInt(parts[1], 10);
    var month = parseInt(parts[0], 10);
    var year = parseInt(parts[2], 10);

    // Check the ranges of month and year
    if(year < 1000 || year > 3000 || month == 0 || month > 12)
        return false;

    var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

    // Adjust for leap years
    if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
        monthLength[1] = 29;

    // Check the range of the day
    return day > 0 && day <= monthLength[month - 1];
    },

    /**
     * validates preferences 
     * @param {} - preference Object ex: {tags: string, age, [min, max]}
     * @param {} - arguments to validate
     * @return {} validated data
    */

    searchValidator: async (data, args = searchArgs) => {
        // &sort.age=desc&sort.fame=asc&sort.interests=asc&sort.location=desc
        const Allowed = ['orientation','gender','name','location','username','fame', 'interests', 'age', 'radius','sortage','sortfame','sortinterests','sortlocation', 'strict']
        const genderRegex = new RegExp(/^male$|^female$/g)
        const nameRegex = new RegExp(/^[A-Za-z][A-Za-z\'\-]+([\ A-Za-z][A-Za-z\'\-]+)*/)
        const userNameRegex = new RegExp(/^(?=.{8,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/)
        const tagsRegex = new RegExp(/\b[a-zA-Z0-9]{1,20}\b/)
        const orientationRegex = new RegExp(/^Heterosexual$|^Homosexual$|^Bisexual$/g)
        const latitudeRegex = new RegExp(/^(\+|-)?(?:90(?:(?:\.0{1,6})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,20})?))$/)
        const longitudeRegex = new RegExp(/^(\+|-)?(?:180(?:(?:\.0{1,6})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,20})?))$/)
        const strictRegex = new RegExp(/^true$|^false$/g)
        const radiusRegex = new RegExp(/^\d+$/)
        const Body = Object.keys(data)
        const isValidOperation = Body.every((element) => Allowed.includes(element))
        if(!isValidOperation)
            throw new Error("Not a valid operation Operation not Allowed")
        const values = Object.values(data)
        const typeAllowed = values.every((element) => typeof element == "string" ? true : false)
        
        if(!typeAllowed)
            throw new Error("Not a Valid operation Type not Allowed")

        if(args.strict == true){
            if(!strictRegex.test(data.strict))
                throw new Error("Not a valid operation strict parameter")
        }

        if (args.fame == true){
            const fameTest = data.fame.split("-")
            if(fameTest[0] == undefined || fameTest[1] == undefined)
                throw Error("Not a valid operation Fame")
            if(fameTest.length != 2 || parseFloat(fameTest[0]) > parseFloat(fameTest[1]) || fameTest === undefined || 
                parseFloat(fameTest[0]) < 0 ||
                parseFloat(fameTest[0]) > 5 ||  
                parseFloat(fameTest[1]) < 0 ||
                parseFloat(fameTest[1]) > 5 ||
                isNaN(fameTest[0]) ||
                isNaN(fameTest[1]))
                throw new Error("Not a valid operation Fame")
            delete data.fame
            data.fameMin = parseFloat(fameTest[0]).toFixed(1)
            data.fameMax = parseFloat(fameTest[1]).toFixed(1)
        }
           
        
        if (args.age == true) {
            const ageTest = data.age.split("-")
            if  (
                    ageTest.length != 2 || parseInt(ageTest[0]) > parseInt(ageTest[1]) || ageTest === undefined || 
                    parseInt(ageTest[0]) < 18 ||
                    parseInt(ageTest[0]) > 100 ||  
                    parseInt(ageTest[1]) < 18 ||
                    parseInt(ageTest[1]) > 100 ||
                    isNaN(ageTest[0]) ||
                    isNaN(ageTest[1])
                )
            throw new Error("Not a valid operation Age min/max")
            delete data.age
            data.min = parseInt(ageTest[0])
            data.max = parseInt(ageTest[1])
        }
        if (args.gender == true)
        if(!genderRegex.test(data.gender))
            throw new Error("Not a valid operation Gender")

        if (args.name == true){
            data.name = data.name.trim()
            data.name = data.name.toLowerCase()
        if(!nameRegex.test(data.name) || data.name.length > 70 || data.name.length < 2)
            throw new Error("Not a valid operation name")
        }
       
        if(args.username == true){
            data.username = data.username.trim()
            data.username = data.username.toLowerCase()
        if(!userNameRegex.test(data.username) || data.username.length > 70 || data.username.length < 2)
            throw new Error("Not a valid operation Username")
        }

        if (args.orientation == true)
        if(!orientationRegex.test(data.orientation))
            throw new Error("Not a valid operation Orientation")
        
        if (args.location == true){
            let coordinates = data.location.split(",")
            //                  coordinates[0]: Latitude               coordinates[1]: Longtitude
            if(!coordinates || !latitudeRegex.test(coordinates[0]) || !longitudeRegex.test(coordinates[1]))
                throw new Error("Not a valid operation Location")
            delete data.location
            data.coordinates = coordinates
        }
        if (args.radius == true){
            /// maximum of 130km
            if(parseInt(data.radius) > 20000000 || !radiusRegex.test(data.radius) || parseInt(data.radius) === 0)
                throw new Error("Not a valid operation Radius")
            data.radius = parseInt(data.radius)
        }
        if(args.radius == true && args.location == false)
            throw new Error("Provide Both Location and Radius")

        if(args.interests == true){
            let tags = data.interests.split("-")
            let newTags = []
            tags.forEach(element => {
                element = element.trim()
                element = element.toLowerCase()
                if(!tagsRegex.test(element) || element.length > 30)
                    throw new Error("Not a valid operation Tag")
                newTags.push(element)
            })
            delete data.interests
            data.interests = newTags
        }

        /// sort fame
        if(args.sortfame == true){
            if(!helpers.checkSortable(data.sortfame))
                throw new Error("Not a valid operation Sort Fame")
            }
        // sort age
        if(args.sortage == true){
            if(!helpers.checkSortable(data.sortage))
                throw new Error("Not a valid operation Sort Age")
        }
        // sort interests
        if(args.sortinterests == true){
            if(!helpers.checkSortable(data.sortinterests))
                throw new Error("Not a valid operation Sort Interests")
        }
            
        // sort location
        if(args.sortlocation == true){
            if(!helpers.checkSortable(data.sortlocation))
                throw new Error("Not a valid operation Sort Location")
        }
        
        return data
    },

    /**
     * validates picture format  
     * @param {} - picture filename
     * @return {} return true throws error in case not valid
    */
   pictureValidator: async (filename) => {
    pictureRegex = new RegExp(/[\w-]+.(jpg|png|jpeg)/g)

    if(filename.length > 40)
        throw new Error("Not a valid operation picture filename too big")
        
    if(!pictureRegex.test(filename))
        throw new Error("Not a valid operation picture filename")
    
    /// checks forr double file extension
    let extension = filename.split('.');
     if(extension.length > 2) 
        throw new Error("Not a valid operation picture file extension")
    return true    
   },

   /**
     * validates chat text
     * @param {} - chat text
     * @return {} return validated text throws error in case not valid
    */
   chatValidator: async (data) => {
    const Body = Object.keys(data)
    const Allowed = ['message']
    const isValidOperation = Body.every((element) => Allowed.includes(element))
    if(!isValidOperation)
        throw new Error("Not a valid operation Element not Allowed")
    var chatText = data.message
    if(typeof chatText != "string")
        throw new Error("Check message body")
    chatText =  chatText.trim()
    chatText =  chatText.toLowerCase()
    chatText = await helpers.sanitizeStr(chatText)
    if( chatText.length > 200 ||  chatText.length <= 0)
        throw new Error("Not a valid operation Chat")
    return chatText
   }

}
 module.exports = validators