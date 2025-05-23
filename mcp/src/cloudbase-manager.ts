import CloudBase from "@cloudbase/manager-node";
import { getLoginState } from './auth.js'

export async function getCloudBaseManager() {
    const loginState = await getLoginState()
    const {
        envId,
        secretId,
        secretKey,
        token
    } = loginState

    const cloudbase = new CloudBase({
        envId: process.env.CLOUDBASE_ENV_ID || envId,
        secretId,
        secretKey,
        token
    });
    return cloudbase
}