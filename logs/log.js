import { fileURLToPath } from 'url';
import fs from 'fs'
import path,{dirname} from 'path'
import fsPromises from 'fs/promises'
import date from 'date-and-time'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logDir = __dirname
const infoLog = path.join(logDir,'info.log')
const errorLog = path.join(logDir,'error.log')
const authDir = path.join(logDir,'auth')
const signupLog = path.join(authDir,'signup.log')
const signinLog = path.join(authDir,'signin.log')
const authErrorLog = path.join(authDir,'authError.log')





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


async function logAuthError(message, error) {
    const timeStamp = getTimestamp()
    ensureDirExists(authDir)
    if (!fs.existsSync(authErrorLog)){
        await fsPromises.writeFile(authErrorLog,`ACCOUNT_ERROR_LOG \n ${message}: ${error.message} at ${timeStamp}\n`)
    }
    else{
        await fsPromises.appendFile(authErrorLog,`${message}: ${error.message} at ${timeStamp}\n`)
    }
}


async function LogInfo(message){
    const timeStamp = getTimestamp()
    if (!fs.existsSync(infoLog)){
        await fsPromises.writeFile(infoLog,`INFO_LOG \n message ${timeStamp} \n`)
    }
    else{
        await fsPromises.appendFile(infoLog,`${message}  at ${timeStamp} \n`)
    }
}


async function LogError(error,message){
    const timeStamp = getTimestamp()
    if (!fs.existsSync(infoLog)){
        await fsPromises.writeFile(errorLog,`INFO_LOG \n ${message}: ${error.message} at ${timeStamp} \n`)
    }
    else{
        await fsPromises.appendFile(errorLog,`${message}: ${error.message} at ${timeStamp} \n`)
    }
}



const Log = {
    getTimestamp,LogInfo,LogError,logAccount,logAuthError,logSignIn
}

export default Log