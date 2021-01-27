const fetch = require('node-fetch');

const map_key = process.env.map_key;

const calc = async (lat1, lon1, lat2, lon2) => {
    let dist;
    const url = `http://dev.virtualearth.net/REST/v1/Routes?wayPoint.1=${lat1},${lon1}&wayPoint.2=${lat2},${lon2}&distanceUnit=km&key=${map_key}`;
    try {
        const result = await fetch(url);
        const res = await result.json();
        if (res.statusCode === 200) {
            dist = res.resourceSets[0].resources[0].travelDistance;
        }
        else if (res.statusCode === 404) {
            return 'no route found';
        }
        else {
            const err = new Error(res.errorDetails[0]);
            return err;
        }
        return dist;
    } catch (err) {
        return err;
    }
}

module.exports = calc;