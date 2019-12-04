Object.values = function(obj) {
    var vals = [];
    for( var key in obj ) {
        if ( obj.hasOwnProperty(key) ) {
            if(typeof(obj[key]) === 'object') {
              vals.push(JSON.stringify(obj[key]));
            } else {
              vals.push(obj[key])
            }
        }
    }
    return vals;
}
