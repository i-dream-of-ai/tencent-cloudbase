import CloudBase from "@cloudbase/manager-node";
import { getCreatial } from './auth.js'

export async function getCloudBaseManager() {
    const loginState = await getCreatial()
    const {
        envId,
        secretId,
        secretKey,
        token
    } = loginState
    const cloudbase = new CloudBase({
        envId,
        secretId,
        secretKey,
        token
    });
    return cloudbase
}