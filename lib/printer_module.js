var fs = require('fs');
var ejs = require('ejs');
var recipe_template = fs.readFileSync ('lib/recipe_template.ejs','utf8');

exports.renderRecipe = function ( recipe_data, cb ) {
    recipe = recipe_data.recipe;
    console.log(recipe);
    latex_clean( recipe, function (clean_recipe) {
        clean_recipe.source = recipe_data.source;
        clean_recipe.type = recipe_data.type;
        clean_recipe.creation = (new Date(clean_recipe.creation)).toLocaleDateString();
        clean_recipe.modified = (new Date(clean_recipe.modified)).toLocaleDateString();
        cb ( ejs.render ( recipe_template, clean_recipe ) );
    });
}

//private functions

function latex_clean ( recipe, cb ) {
    var i,j;
    var regex = /[#$%&_{}]/g;
    var rep = '\\$&';
    //Escape LaTeX special characters (isn't perfect; misses ^, ~ and \)
    recipe.name = recipe.name.replace( regex, rep );
    for (i=0; i < recipe.comp.length; i ++) {
        recipe.comp[i].name = recipe.comp[i].name.replace( regex, rep );
        for (j=0; j < recipe.comp[i].ingred.length; j++) {
            recipe.comp[i].ingred[j].name = 
                recipe.comp[i].ingred[j].name.replace( regex, rep );
        }
    }
    for (i=0; i < recipe.direct.text.length; i ++) {
        recipe.direct.text[i] = recipe.direct.text[i].replace( regex, rep );
    }
    cb ( recipe );
}
