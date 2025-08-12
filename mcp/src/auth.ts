import  { AuthSupevisor } from  '@cloudbase/toolbox'
import { debug,error } from './utils/logger.js';

const auth = AuthSupevisor.getInstance({
})

export async function getLoginState() {
    const {
        TENCENTCLOUD_SECRETID,
        TENCENTCLOUD_SECRETKEY,
        TENCENTCLOUD_SESSIONTOKEN
    } = process.env
    debug('TENCENTCLOUD_SECRETID',TENCENTCLOUD_SECRETID)
    
    // If environment variables are available, construct login state directly 
    // to avoid local file caching and cross-process contamination
    if (TENCENTCLOUD_SECRETID && TENCENTCLOUD_SECRETKEY) {
        debug('Constructing login state from environment variables')
        return {
            isLoggedIn: true,
            credential: {
                secretId: TENCENTCLOUD_SECRETID,
                secretKey: TENCENTCLOUD_SECRETKEY,
                token: TENCENTCLOUD_SESSIONTOKEN
            }
        }
    }
    
    // Fallback to AuthSupevisor for interactive login
    const loginState = await auth.getLoginState()
    if (!loginState) {
        debug('No cached login state, attempting web auth')
       await auth.loginByWebAuth({})
       const loginState = await auth.getLoginState()
       return loginState
    } else {
        return loginState
    }
}

export async function logout() {
    const result = await auth.logout()
    return result
}