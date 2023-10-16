/**
 * awaitable wrapper around setTimeout
 * 
 * @param  {number} ms - the number of milliseconds to sleep
 * @returns Promise
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g,'-');
} 

export function intersectArrays(a1: string[], a2: string[]) {
    return  a1.filter(function(n: string) { return a2.indexOf(n) !== -1;});
}

export function intersectArraysLowercase(a1: string[], a2: string[]) {
    return  a1.filter(function(n: string) { return a2.indexOf(n.toLowerCase()) !== -1;});
}

export function diffArrays(a1: string[], a2: string[]) {
    return  a1.filter(item => a2.indexOf(item) < 0);
}

export function filterTags(tags: string []) {

    // everything lowercase
    let lowercaseTags = [];
    let badTags = [];
    for (let i = 0; i < tags.length; i += 1) {
        const tag = tags[i];

        // empty tag
        if (tag.length <= 0) {
            badTags.push(tag);
        }
        else {

            // check tags with more than 1 space in the begining or in the end
            if (tag.startsWith("  ") || tag.endsWith("  ")) {
                badTags.push(tag);
            }
            /*
            else if (tag.startsWith(" ") && tag.endsWith(" ")) {
                lowercaseTags.push(tag.substring(1, tag.length - 1).toLowerCase());
            }
            else if (tag.startsWith(" ")) {
                lowercaseTags.push(tag.substring(1, tag.length).toLowerCase());
            }
            else if (tag.endsWith(" ")) {
                lowercaseTags.push(tag.substring(0, tag.length - 1).toLowerCase());
            }*/
            else {
                //lowercaseTags.push(tag.toLowerCase());
                lowercaseTags.push(tag.trim().toLowerCase());
            }
        }
    }

    // remove duplicates
    const uniqueTags = [...new Set(lowercaseTags)];

    // identify shared tags
    let sharedTags = uniqueTags.filter(it => it.includes(','));

    // add shared tags individually to goodTags
    let individualSharedTags = [];
    sharedTags.forEach(shared => {
        const appArray = shared.split(',');
        appArray.forEach(app => {
            // trim leading and trailing spaces
            const appName = app.trim().toLowerCase();
            individualSharedTags.push(appName);
        });
    });

    // merge shared apps
    let mergedTags = uniqueTags.concat(individualSharedTags);

    // remove duplicates
    const uniqueUniqueTags = [...new Set(mergedTags)];

    return {
        goodTags: uniqueUniqueTags.filter(it => !it.includes(',')),
        sharedTags: uniqueUniqueTags.filter(it => it.includes(',')),
        badTags: badTags
    }
}


// declare all characters
const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// Generate random strings
export function generateString(length: number) {
    let result = ' ';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

// Generate guid based on timestamp
export function generateTimestampGuid() : string {

    let guid = "";
    const currentTime = new Date();

    // Part 1. Year
    const year = currentTime.getFullYear();
    guid = guid + year.toString().charAt(3);

    // Part 2. Month
    const month = currentTime.getMonth();
    guid = guid + getDateElementChar(month);

    // Part 3. Day
    const day = currentTime.getDay();
    guid = guid + getDateElementChar(day);

    // Part 4. Hour
    const hour = currentTime.getHours();
    guid = guid + hour;

    // Part 5. Minutes
    const min = currentTime.getMinutes();
    guid = guid + min;

    return guid;
}

function getDateElementChar(num: number) : string {
    if (num < 10) {
        return "" + num;
    }
    else {
        // 97 is 'a' ascii code
        return String.fromCharCode(num-10+97);
    }
}

export function cleanSharedAppsTags(tags: string): string[] {
    const appArray = tags.split(',');
    const appCleanedArray = appArray.map(t => t.trim().toLowerCase());
    return appCleanedArray;
}


// Get resource name from resource id
// Example id: /subscriptions/57701fdc-da76-4568-8afe-19859ba440d5/resourcegroups/dash-shr-rg-02/providers/microsoft.operationalinsights/workspaces/tdmi-cost-logan-02
// Returns: tdmi-cost-logan-02
export function getResourceNameFromId(resourceId: string) : string {
    const idx = resourceId.lastIndexOf('/');
    return resourceId.substring(idx+1);
}


