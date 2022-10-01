import * as ld from 'launchdarkly-node-server-sdk';


export function getLDConfig() {
//    const {LD_SDK_KEY} = process.env
	const LD_SDK_KEY = 'sdk-4aa718c5-4e3c-4d4e-84f3-3488153d9b22'
    return [LD_SDK_KEY, {
        application: {
            id: 'gameoflife',
            version: '1.0.0'
        }
    }]
}



let _ldClient = null 

export function initialize(sdkKey, config) {
    if (!_ldClient) {
        _ldClient = ld.init(sdkKey, config)
    } else {
        throw new Error('LD client already initialized')
    }
    return _ldClient
}

export function getLDClient() {
    return _ldClient
}

export async function variation(flagKey, userObject, fallback) {
    const client = getLDClient()
    return client ? client.variation(flagKey, userObject, fallback) : fallback
}

export function close() {
    const client = getLDClient()
    if (client) {
        return client.close()
    }
}
