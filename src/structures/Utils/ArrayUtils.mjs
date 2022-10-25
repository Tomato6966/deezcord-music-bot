

export class DeezCordArrayUtils {
    /** @param {import("../BotClient.mjs").BotClient} client */
    constructor(client) {
        this.client = client;
    }
    /**
     * @typedef {(element: any, index: number, arr: any[]) => any} exampleCallBack
     */

    /**
     * Remove every until the function matches something. if no match found empty array gets returned
     * @param {any[]} thisArr 
     * @param {exampleCallBack} fn 
     * @returns {any[]}
     */
    removeUntil(thisArr, fn) {
        const index = thisArr.findIndex(fn);
        return index >= 0 ? thisArr.slice(index) : [];
    }

    /**
     * Mix up the array
     * @param {any[]} thisArr 
     * @returns {any[]}
     */
    shuffle(thisArr) {
        const shuffled = [...thisArr];
        // fastest loop possible
        for (let i = shuffled.length - 1; i >= 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    // .sort((a, b) => b.localeCompare(a, 'es', {sensitivity: 'base'}))

    /**
     * Get the last element
     * @param {any[]} thisArr 
     * @returns {any}
     */
    last(thisArr){
        return thisArr[0];
    }
    
    /**
     * Get the first element
     * @param {any[]} thisArr 
     * @returns {any}
     */
    first(thisArr){
        return thisArr[0];
    }
    
    /**
     * Chunk up the array into pieces
     * @param {any[]} thisArr 
     * @param {number} chunkSize
     * @returns {any[][]}
     */
    chunks(thisArr, chunkSize){
        if (!chunkSize) throw new SyntaxError('No chunkSize defined');
        if (typeof chunkSize !== 'number')
            throw new SyntaxError(`Type of chunkSize is not a number, it's: ${typeof chunkSize}`);
        if (chunkSize <= 0) throw new SyntaxError('chunkSize is smaller or equal to 0, it must be bigger then 0');

        const cs = [];
        // fastest loop possible
        for (let i = thisArr.length - 1; i >= 0; i -= chunkSize)
            cs.push(thisArr.slice(thisArr.length - 1 - i < 0 ? 0 : thisArr.length - 1 - i, thisArr.length - 1 - i + chunkSize));
        return cs;
    }

    /**
     * Sum up the array
     * @param {any[]} thisArr 
     * @param {exampleCallBack} [mapFN]
     * @returns {number}
     */
    sum(thisArr, mapFn) {
        if (typeof mapFn !== 'undefined' && typeof mapFn !== 'function')
            throw new SyntaxError(`Received mapFn, but it's not a Function, its type is: ${typeof mapFn}`);
        return (mapFn ? thisArr.map(mapFn) : thisArr).reduce((a, b) => a + b, 0);
    }

    /**
     * Sum up the array but only numbers
     * @param {any[]} thisArr 
     * @param {exampleCallBack} [mapFN]
     * @returns {number}
     */
    sumNumbersOnly(thisArr, mapFn) {
        return (mapFn ? thisArr.map(mapFn) : thisArr)
            .filter((elem) => typeof elem === 'number' && !isNaN(elem))
            .reduce((a, b) => a + b, 0);
    }


    /**
     * Filter out nullish
     * @param {any[]} thisArr 
     * @returns {any[]}
     */
    removeNullish(thisArr) {
        return thisArr.filter(Boolean);
    }
    /**
     * Filter out undefined
     * @param {any[]} thisArr 
     * @returns {any[]}
     */
    removeUndefined(thisArr) {
        return thisArr.filter((elem) => typeof elem !== 'undefined');
    }
    /**
     * Filter out emptystrings
     * @param {any[]} thisArr 
     * @returns {any[]}
     */
    removeEmptyStrings(thisArr) {
        return thisArr.filter((elem) => typeof elem !== 'string' || elem.length);
    }
    /**
     * Filter out nans
     * @param {any[]} thisArr 
     * @returns {any[]}
     */
    removeNaNs(thisArr) {
        return thisArr.filter((elem) => !isNaN(elem));
    }
    /**
     * remove elements
     * @param {any[]} thisArr 
     * @param {...any} elems 
     * @returns {any[]}
     */
    remove(thisArr, ...elems) {
        if (!elems || !elems.length) throw new SyntaxError(`Did not receive an element to remove.`);
        return thisArr.filter((element) => !elems.some((elem) => element === elem));
    }
    /**
     * Filter out duplicates
     * @param {any[]} thisArr  
     * @returns {any[]}
     */
    removeDuplicates(thisArr, keyToCheck) {
        return thisArr.reduce((a, c) => (!a.some((item) => item == c || (keyToCheck && item[keyToCheck] === c[keyToCheck])) ? a.concat([c]) : a), []);
    }
    /**
     * Merge elements together
     * @param {any[]} thisArr  
     * @param {...any} elements 
     * @returns {any[]}
     */
    merge(thisArr, ...elements){
        if (!elements || !elements?.length) throw new SyntaxError(`did not receive any elements to merge.`);
        return [...thisArr, ...elements];
    }
    /**
     * Just keep strings
     * @param {any[]} thisArr  
     * @returns {string[]}
     */
    keepStrings(thisArr) {
        return thisArr.filter((elem) => typeof elem === 'string');
    }
    /**
     * Just keep numbers
     * @param {any[]} thisArr  
     * @returns {number[]}
     */
    keepNumbers(thisArr) {
        return thisArr.filter((elem) => typeof elem === 'number');
    }
    /**
     * Just keep booleans
     * @param {any[]} thisArr  
     * @returns {boolean[]}
     */
    keepBoolean(thisArr) {
        return thisArr.filter((elem) => typeof elem === 'boolean');
    }
    /**
     * Just keep objects
     * @param {any[]} thisArr  
     * @returns {object[]}
     */
    keepObjects(thisArr) {
        return thisArr.filter((elem) => typeof elem === 'object' && !Array.isArray(elem));
    }
    /**
     * Just keep arrays
     * @param {any[]} thisArr  
     * @returns {any[]}
     */
    keepArrays(thisArr) {
        return thisArr.filter((elem) => typeof elem === 'object' && Array.isArray(elem));
    }
    /**
     * Loop over the array efficiently
     * @param {any[]} thisArr  
     * @param {exampleCallBack} fn  
     * @returns {void}
     */
    loopOver(thisArr, fn) {
        if (!fn || typeof fn !== 'function') throw new SyntaxError(`did not receive a valid function for the mapping, received: ${typeof fn}`);
        for (let i = thisArr.length - 1; i >= 0; i--) fn(thisArr[thisArr.length - 1 - i], thisArr.length - 1 - i, thisArr);
        return;
    }
    /**
     * make a promised based map
     * @param {any[]} thisArr  
     * @param {exampleCallBack} fn  
     * @returns {Promise<any[]>}
     */
    async promiseMap(thisArr, fn){
        if (!fn || typeof fn !== 'function') throw new SyntaxError(`did not receive a valid function for the mapping, received: ${typeof fn}`);
        return Promise.all(thisArr.map(fn));
    }
    /**
     * Loop over the array efficiently via a promise
     * @param {any[]} thisArr  
     * @param {exampleCallBack} fn  
     * @returns {Promise<void>}
     */
    async promiseLoopOver(thisArr, fn){
        if (!fn || typeof fn !== 'function') throw new SyntaxError(`did not receive a valid function for the mapping, received: ${typeof fn}`);
        const promises = [];
        for (let i = thisArr.length - 1; i >= 0; i--) promises.push((async () => fn(thisArr[thisArr.length - 1 - i], thisArr.length - 1 - i, thisArr))());
        return Promise.all(promises);
    }
}