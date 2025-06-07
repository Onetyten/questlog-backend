import { fileURLToPath } from 'url';
import * as fs from 'fs'; // Changed from 'node:fs'
import path,{dirname} from 'path'
const { promises: fsPromises } = fs; // Get promises API from the main fs module
import date from 'date-and-time'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logDir = __dirname
const infoLog = path.join(logDir,'info.log')
const authDir = path.join(logDir,'auth')
const signupLog = path.join(authDir,'signup.log')
const signinLog = path.join(authDir,'signin.log')





function getTimestamp(params) {
    return date.format(new Date(),'YYYY-MM-DD HH:mm:ss')  
}

function ensureDirExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}


async function logAccount(message, user) {
    const timeStamp = getTimestamp()
    ensureDirExists(authDir)
    if (!fs.existsSync(signupLog)){
        await fsPromises.writeFile(signupLog,`ACCOUNT_LOG \n ${message} at ${timeStamp} \n user: ${user} \n`)
    }
    else{
        await fsPromises.appendFile(signupLog,`${message}  at ${timeStamp} \n`)
    }
}

async function logSignIn(message) {
    const timeStamp = getTimestamp()
    ensureDirExists(authDir)
    if (!fs.existsSync(signinLog)){
        await fsPromises.writeFile(signinLog,`ACCOUNT_LOG \n ${message} at ${timeStamp} \n`)
    }
    else{
        await fsPromises.appendFile(signinLog,`${message}  at ${timeStamp} \n`)
    }
}

async function LogInfo(level,source,message){
    const timeStamp = getTimestamp()
    if (!fs.existsSync(infoLog)){
        await fsPromises.writeFile(infoLog,`INFO_LOG \n ${level}\n source : ${source} \n ${message}  at ${timeStamp} \n`)
    }
    else{
        await fsPromises.appendFile(infoLog,`${level}\n source : ${source} \n ${message}  at ${timeStamp} \n`)
    }
}




const Log = {
    getTimestamp,LogInfo,logAccount,logSignIn
}

export default Log