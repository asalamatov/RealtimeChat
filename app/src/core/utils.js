import { Platform } from "react-native";
import ProfileImage from '../assets/profile.png';
import { ADDRESS } from "./api";



/**
 * Much better console.log() that prettifies JS objects
 */
function log() {
for (let i = 0; i < arguments.length; i++){
    let arg = arguments[i];
    // stringify and indent object
    if (typeof arg === 'object') {
    arg = JSON.stringify(arg, null, 2)
    }

    console.log(`[${Platform.OS}]` ,arg)
}
}


function thumbnail(url) {
    // console.log('[thumbnail]: ', url)
    if (!url) {
        return ProfileImage;
    }
    return {
        uri: 'http://' + ADDRESS + url
    } 
}


export default { log, thumbnail }