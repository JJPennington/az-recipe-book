var express = require("express")
var rbook = require("./lib/rbook_module");
var pdf_out = require("./lib/printer_module");
var fs = require('fs');
var path = require('path');
var latex = require("latex");
var app = express();


app.configure ( function () {

    app.use(express.json());       // to support JSON-encoded bodies
    app.use(express.urlencoded()); // to support URL-encoded bodies
    app.use(express.static(path.join(__dirname, 'static')));

});

/* Routes : GET */

app.get("/recipe_list", function ( req, res ) {
    
    rbook.getRecipeList ( function (err, recipe_list) {

        if (err)
            throw (err);
            
        res.json (recipe_list);

    });

 
});

app.get("/recipe/:uid", function (req, res) {

    rbook.getRecipe ( req.params.uid, function ( err, recipe ) {

        if (err)
            throw (err);

        res.json(recipe);

    });
    
});

app.get("/print/:uid", function (req, res) {

    rbook.getRecipe ( req.params.uid, function ( err, recipe ) {
        
        var recipe_path = 'recipes/';
        var filename = "recipe_" + req.params.uid + ".pdf";
        var filestream;

        console.log('Attempting to print');
        res.setHeader('Content-type','application/pdf');
        res.setHeader('Content-disposition', 'attachment; filename="' + encodeURIComponent (filename) + '"');
       
        fs.exists ( recipe_path + filename, function (exists) {
            if (exists) {
                console.log("File already exists");
                fs.createReadStream ( recipe_path + filename ).pipe(res);
            } else {
                filestream = fs.createWriteStream(recipe_path + filename);

                pdf_out.renderRecipe ( { recipe: recipe,
                                         source: recipe.sources[recipe.source],
                                         type  : recipe.categories[recipe.type] }
                                         , function (latex_render) {
                    console.log(latex_render);
                    latex(latex_render).pipe(filestream);

                    filestream.on('finish', function () {
                        console.log("File has been written");
                        fs.createReadStream ( recipe_path + filename ).pipe(res);
                    });

                });
            }
        });
    });
});

app.get("/sources/", function (req, res) {

    rbook.getSources ( function (err, data_sources) {

        if (err)
            throw (err);

        res.json (data_sources);

    });
    
});

app.get("/categories/", function (req, res) {

    rbook.getCats( function (err, data_cats) {

        if (err)
            throw (err);

        res.json (data_cats);

    });
    
});

/* Routes : POST */

app.post("/sources/add/", function (req, res) {

    rbook.addSrc ( req.query['new_source'], function ( err ) {

        if (err)
            throw (err);

        res.end();
    });

});

app.post("/recipe/add/", function (req, res) {

    rbook.addRecipe ( JSON.parse(req.query['new_recipe']), function (err) {

        if (err)
            throw (err);

        res.end();

    });
});

app.post("/categories/add/", function (req, res) {
    
    rbook.addCat ( req.query['new_category'], function ( err ) {

        if (err)
            throw (err);

        res.end();

    });

});

app.post("/save_book/", function (req, res) {

    rbook.saveBook( function (err) {
        
        if (err)
            throw (err);

        res.end();

    });
});


app.listen(8080);

