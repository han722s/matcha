const execSync = require("child_process").execSync;
   
// const config = {
//     apiIp: execSync("getent hosts api | awk '{print $1}'", (error, stdout,stderr) => {
//         return stdout
//     }).toString().trim()
// }

const config = {
    apiIp : execSync("getent hosts api | awk '{print $1}'").toString().trim(),
    portNumApi: 3000,
    portNumFront: 8080
}
 
module.exports =  config;