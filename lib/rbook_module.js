var fs = require('fs');

var book_data = undefined;
var dataLoaded = false;
var data_path = 'lib/data/';

/* Exports */

exports.addSrc = function ( src, cb ) {

    if (!book_data) {
        cb ( new Error ('Book data has not been loaded') );
    } else {
        book_data.sources.push( src );
        cb();
    }

}

exports.addCat = function ( cat, cb ) {

    if (!book_data) {
        cb ( new Error ('Book data has not been loaded') );
    } else {
        book_data.categories.push( cat );
        cb();
    }

}

exports.addRecipe = function ( recipe, cb ) {

    if (!book_data) {
        cb ( new Error ('Book data has not been loaded') );
    } else {
        var digest = [];
        digest = Object.keys(recipeDigest( { 'blank':recipe } )[0]);
        digest.shift();
        recipe.digest = digest;
        book_data.recipes[ recipe.uid ] = recipe;
        if ( book_data.next_uid.toString() === recipe.uid ) {
            book_data.next_uid += 1;
        }
        cb();
    }
};

exports.getRecipe = function ( uid, cb ) {

    processPageData( function (data) {
        
        var req_info;
        
        if (uid >= data.next_uid)
            cb (new Error('UID outside of range'), {});

        /*console.log(req, data);*/

        req_info = { 'name':data.recipes[uid].name, 'categories':data.categories,
                     'sources':data.sources, 'source':data.recipes[uid].source,
                     'direct':data.recipes[uid].direct, 'type':data.recipes[uid].type,
                     'comp':data.recipes[uid].comp,'uid':uid, 'book_name':data.name,
                     'version':data.version, 'next_uid':data.next_uid,
                     'creation':data.recipes[uid].creation, 
                     'modified':data.recipes[uid].modified };

        cb ('', req_info); //First parameter for error
    });

};

exports.getRecipeList = function ( cb ) {

    processPageData( function (data) {
        
        var req_info;

        req_info = { 'name': data.name, 'categories': data.categories,
                     'sources' : data.sources, 'version':data.version,
                     'recipes' : [],  };

        Object.keys(data.recipes).forEach ( function (r_key, i) {
            req_info.recipes.push( { 'name' : data.recipes[r_key].name } );
            req_info.recipes[i].source = data.recipes[r_key].source;
            req_info.recipes[i].type = data.recipes[r_key].type;
            req_info.recipes[i].uid = data.recipes[r_key].uid;
            req_info.recipes[i].digest = data.recipes[r_key].digest;
        });
   
        cb ( '', req_info ); //First parameter for error

    });

};

exports.getSources = function ( cb ) {
    
    processPageData( function (data) {

        var data_sources;
        
        data_sources = { 'sources':data.sources, 'name':data.name, 'version':data.version,
                         'next_uid':data.next_uid };

        cb ('', data_sources);

    });

};

exports.getCats = function ( cb ) {
    
    processPageData( function ( data ) {

        var data_cats;

        data_cats = { 'categories':data.categories, 'name':data.name, 'version':data.version };

        cb ('', data_cats);

    });

};


exports.saveBook = function ( cb ) {

    if (!book_data) {
        cb (new Error ("Book data has not been loaded") );
    } else {
        var d = new Date();
        var time = d.getTime();
        var f_path = data_path + 'book_' + time.toString() + '.json';

        fs.writeFile( f_path, JSON.stringify(book_data), function (err) {
            if (err)
                throw err;

            console.log('Saved Book');
            cb ();
        });

    }
};

/* Private Methods */

function textGobble (t_array, hash) {
    var working, index, notNumber = true;;
    var removeCh = [',',';',"'",'.',':','"','?','!','-','+','_','(',')'];
    var removeTx = ['and','the','for','if','we','i','my','put','on','to',
                    'in','is','then','add','&','as','or','of','will','be',
                    'they','are','otherwise','until','just','with','other',
                    'over','mix','combine','well','up','down','stir',
                    'together','per','normal','high','low','medium','with',
                    'keep','aside','set','a','few','season','taste','serve',
                    'but','not','oven','rack','adjust','position','off','all',
                    'no','return','you','choose','remove','from','half','out',
                    'optional','twice','wash','heat','cook','little'];
    t_array.forEach( function (data) {
        working = data.toLowerCase();
        removeCh.forEach ( function (ch) {
            data = data.toLowerCase().replace(ch,'');
        });
        removeTx.forEach ( function (txt) {
            if (data === txt)
                data = '';
        });
        if (/^\d+$/.test(data)) {
            notNumber = false;
        }
        if (data !== '' && notNumber) {
            hash[data] = '';
        }
    });
}

function recipeDigest (recipeHash) {
    var i,j,k,digest = [];
    var keys = Object.keys(recipeHash), str_key;
    for (i = 0; i < keys.length; i++) {
        /* Each Recipe (i) */
        digest.push( { '__uid__' : keys[i] } );
        for (j = 0; j < recipeHash[keys[i]].comp.length; j++) {
            textGobble (recipeHash[keys[i]].comp[j].name.split(' '), digest[i]);
            /* Each Component (j) */
            for (k = 0; k < recipeHash[keys[i]].comp[j].ingred.length; k++) {
                /* Each Ingredient (k) */
                textGobble (recipeHash[keys[i]].comp[j].ingred[k].name.split(' '), digest[i]);
            }
        }
        
        for (j = 0; j < recipeHash[keys[i]].direct.text.length; j++ ) {
            /* Each Recipe Direction (j) */
            textGobble (recipeHash[keys[i]].direct.text[j].split(' '), digest[i]);
        }
            
    }
    return digest;
}

function processPageData ( cb ) {

    if (!dataLoaded) {
        findNewestBook ( function (data) { 
            cb ( data );
        });
    } else {
        process.nextTick(function () {        
            cb ( book_data );
        });
    }

}

function findNewestBook ( cb ) {
    var d;

    fs.readdir( data_path, function (err, files) {
        var newest = 0, iter;
        files.forEach ( function (data, i) {
            iter = parseInt(data.split('.')[0].split('_')[1], 10); // book_<jstime#>.json, getting jstime 
            if (iter > newest) {
                newest = iter;
            }
        });
        loadBookData ( data_path + 'book_' + newest.toString() + '.json', cb );
    });
}

function loadBookData ( path, cb ) {
    fs.readFile(path, function (err, data) {
            var digest_holder, uid;
            if (err)
                throw err;
            book_data = JSON.parse(data);
            recipeDigest(book_data.recipes).forEach ( function (data, i) {
                uid = data['__uid__'];
                digest_holder = Object.keys(data);
                digest_holder.shift();
                book_data.recipes[uid].digest = digest_holder;

            });
            dataLoaded = true;
            cb(book_data);
        });
}
