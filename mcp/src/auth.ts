import  { AuthSupevisor } from  '@cloudbase/toolbox'

const auth = AuthSupevisor.getInstance({
})

export async function getLoginState() {
    const {
        TENCENTCLOUD_SECRETID,
        TENCENTCLOUD_SECRETKEY,
        TENCENTCLOUD_SESSIONTOKEN
    } = process.env
    if (TENCENTCLOUD_SECRETID && TENCENTCLOUD_SECRETKEY) {
        await auth.loginByApiSecret(TENCENTCLOUD_SECRETID, TENCENTCLOUD_SECRETKEY, TENCENTCLOUD_SESSIONTOKEN)
    }
    const loginState = await auth.getLoginState()
    if (!loginState) {
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