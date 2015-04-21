var recipeController = angular.module('recipeController', []);

recipeController.rest_host = 'http://localhost:8080'; /* Node.js RESTful backend */

/*Factory*/

recipeController.factory ("recipeFactory", ['$http',  function ($http) {
    var factory = {};

    factory.getListData = function () {
        return $http({'method':'GET', 
                      'url':recipeController.rest_host + '/recipe_list', 
                      //'withCredentials': true,
                      'Content-Type':'application/json'});
    };

    factory.getDetailData = function ( uid ) {
        return $http({'method':'GET',
                      'url':recipeController.rest_host + '/recipe/' + uid + '/',
                      //'withCredentials': true,
                      'Content-Type':'application/json'});
    };

    factory.getSrcData = function () {
        return $http({'method':'GET',
                      'url':recipeController.rest_host + '/sources/',
                      //'withCredentials':true,
                      'Content-Type':'application/json'});
    };

    factory.getCatData = function () {
        return $http({'method':'GET',
                      'url':recipeController.rest_host + '/categories/',
                      //'withCredentials':true,
                      'Content-Type':'application/json'});
    };

    factory.addSrc = function ( new_source ) {
        return $http({'method':'POST',
                      'url':recipeController.rest_host + '/sources/add/',
                      //'withCredentials':true,
                      'params':{'new_source':new_source},
                      'Content-Type':'application/json'});
    };

    factory.addCat = function ( new_category ) {
        return $http({'method':'POST',
                      'url':recipeController.rest_host + '/categories/add/',
                      //'withCredentials':true,
                      'params':{'new_category':new_category},
                      'Content-Type':'application/json'});
    };

    factory.addRecipe = function ( new_recipe ) {
        return $http({'method':'POST',
                      'url':recipeController.rest_host + '/recipe/add/',
                      //'withCredentials':true,
                      'params':{'new_recipe':new_recipe},
                      'Content-Type':'application/json'});
    };

    factory.saveBook = function () {
        return $http({'method':'POST',
                      'url':recipeController.rest_host + '/save_book/',
                      //'withCredentials':true,
                      'Content-Type':'application/json'});
    };

    factory.printRecipe = function ( uid ) {
        return $http({'method':'GET',
                      'url':recipeController.rest_host + '/print/' + uid + '/',
                      'responseType':'arraybuffer',
                      //'withCredentials':true,
                      'Content-Type':'application/pdf'});
    };

    return factory;

}]);

recipeController.controller('RecipeListCtrl', ['$scope', 'recipeFactory', 
                                      function ($scope,   recipeFactory) {

    $scope.data = {};
    $scope.recipes = [];

    recipeFactory.getListData()
        .then (function(data) {
            $scope.data = data.data;
            $scope.recipe_count = data.data.recipes.length;
        }, function (error) {
            console.log('getListData() failed : ', error);
        } 
    );

    $scope.add = function () {
    }

}]);

recipeController.controller("RecipeDetailCtrl", ['$scope', '$routeParams', 'recipeFactory', 
                                        function ($scope,   $routeParams,   recipeFactory) {
    var d;

    recipeFactory.getDetailData( $routeParams.uid )
        .then (function(data) {

            angular.forEach(data.data.comp, function (comp, i) {
                angular.forEach(comp.ingred, function (ing, j) {
                    if (ing.qty === '0')
                        data.data.comp[i].ingred[j].qty = '';
                    if (ing.units === '0')
                        data.data.comp[i].ingred[j].units = '';
                });
            });

            $scope.recipe = data.data;
            $scope.date = {}
            d = new Date ($scope.recipe.creation);
            $scope.date.created = d.toLocaleString();
            d = new Date ($scope.recipe.modified);
            $scope.date.modified = d.toLocaleString();
        }, function(error) {
            console.log('getDetailData() failed : ', error)
        }
    );

    $scope.printRecipe = function ( uid ) {
        //console.log('Before printRecipe');
        recipeFactory.printRecipe ( uid )
            .then ( function (data) {
                //console.log('printRecipe succeeded', data);
                var file = new Blob([data.data], { type: 'application/pdf', filename:'recipe.pdf' });
                var fileURL = (window.URL || window.webkitURL).createObjectURL(file);
                window.open(fileURL);
            }, function (error) {
                console.log('printRecipe failed', error);
            }
        );
    };
     
}]);

recipeController.controller("RecipeChgCtrl", ['$scope', '$routeParams', 'recipeFactory', 
                                     function ($scope,   $routeParams,   recipeFactory) {
    var c_id = 0, i_id = 0, d_id = 0;

    $scope.recipe = { 'name':'', 
                      'comp': [ ],
                    'direct': { 'text': [], 'style' : 0}, 
                    'source': 0,
                      'type': 0
                    };

    $scope.working = { 'ingred': [{}], 'component_name':'', 'direct':'[insert lines of direction text]' };
   
   /* recipeFactory.getBookData()
        .then (function(data) {
            $scope.book = {'version': data.data['version'],'book_name': data.data['name'],
                           'sources': data.data['sources'],'categories': data.data['categories']};
            $scope.next_uid = data.data['next_uid'];
            
        }, function(error) {
            console.log('getVersion() failed : ' + error);
        }
    );*/
 
    if ($routeParams.uid !== undefined) {

        recipeFactory.getDetailData($routeParams.uid)
            .then (function (data) {

                $scope.recipe_exists = $routeParams.uid;

                $scope.recipe = data.data;
        
                angular.forEach($scope.recipe.comp, function (data, i) {
                    data.id = c_id;
                    c_id += 1;
                    angular.forEach(data.ingred, function (d, j) {
                        d.id = i_id;
                        i_id += 1;
                    });
                 });

                angular.forEach($scope.recipe.direct.text, function (data, i) {
                    $scope.recipe.direct.text[i] = { 'line' : data, 'id' : d_id };
                    d_id += 1;
                });

                $scope.working.c_id = c_id;
                $scope.working.d_id = d_id;
                $scope.working.i_id = i_id;
                
                $scope.catSel = $scope.recipe.categories[$scope.recipe.type];
                $scope.srcSel = $scope.recipe.sources[$scope.recipe.source];
                
            }, function (error) {
                console.log('Failed to get recipe information in RecipeChgCtrl', error);
            }
        );
        
    } else {
        /*Have to get at least the category and source data*/
        $scope.tmp = {};

        recipeFactory.getCatData()
            .then(function (data) {
                $scope.recipe.categories = data.data['categories'];
                $scope.recipe.book_name = data.data['name'];
                $scope.recipe.version = data.data['version'];
            }, function (error) {
                console.log('getCatSrcData failed :',error);
            }
        );
        recipeFactory.getSrcData()
            .then(function (data) {
                $scope.recipe.sources = data.data['sources'];
                $scope.recipe.next_uid = data.data['next_uid'];
            }, function (error) {
                console.log('getCatSrcData failed :',error);
            }
        );

        $scope.working.c_id = 0;
        $scope.working.d_id = 0;
        $scope.working.i_id = 0;
    }

    $scope.saveRecipe = function () {
        var date = new Date();
        var new_recipe= {'name': $scope.recipe.name, 'type': $scope.recipe.type,
                         'source': $scope.recipe.source };
        /* Remove the Id's which don't need to be saved with the recipes */
      
        angular.forEach($scope.recipe.comp, function (data, i) {
            delete $scope.recipe.comp[i].id

            angular.forEach($scope.recipe.comp[i].ingred, function (d, j) {
                delete $scope.recipe.comp[i].ingred[j].id
            });
        });
        angular.forEach($scope.recipe.direct.text, function (data, i) {
            $scope.recipe.direct.text[i] = data.line;
        });
    
        new_recipe.comp = $scope.recipe.comp
        new_recipe.direct = $scope.recipe.direct

       
        if ($scope.recipe.uid === undefined) {
            /* New recipe, use next uid */
            new_recipe.uid = $scope.recipe.next_uid.toString();
            new_recipe.creation = date.getTime();
        } else {
            new_recipe.uid = $scope.recipe.uid;
            new_recipe.creation = $scope.recipe.creation
        }
       
        new_recipe.modified = date.getTime();
       
        recipeFactory.addRecipe( new_recipe )
            .then ( function (data) {
                console.log('addRecipe OK');
            }, function (error) {
                console.log('addRecipe Failed ', error);
            }
        );

        saveBook();

        //$location.url('/');

    };
    
    $scope.addComp = function () {
       $scope.recipe.comp.push( { 'name': $scope.working.component_name, 'ingred' : [], 'id': $scope.working.c_id } );
       $scope.working.c_id += 1;
       $scope.working.ingred.push( {'name':'','qty':'','units':''} );
       $scope.working.component_name = '';
    };

    $scope.addIngred = function ( id ) {
        var compIndex;

        compIndex = findId ($scope.recipe.comp, id);

        console.log(id, compIndex);
        
        if (compIndex === -1) {
            console.log('addIngred failed');
        } else {
            console.log($scope.working.ingred);
            $scope.recipe.comp[compIndex].ingred.push ( {'name':$scope.working.ingred[compIndex].name,
                                                          'qty':$scope.working.ingred[compIndex].qty,
                                                        'units':$scope.working.ingred[compIndex].units,
                                                           'id':$scope.working.i_id} );

            $scope.working.i_id += 1;
            $scope.working.ingred[compIndex] = {'name':'', 'qty':'', 'units':'' };
        }

    };

    $scope.addDirect = function () {
        $scope.recipe.direct.text.push ( { 'line' : $scope.working.direct, 'id':$scope.working.d_id } );
        $scope.working.d_id += 1;
        $scope.working.direct = '';
    };
    
    $scope.removeIngred = function (inner, outer) {
        var rmCompIndex, rmIngIndex;

        rmCompIndex = findId($scope.recipe.comp, outer);

        if (rmCompIndex === -1) {
            console.log('removeIngred failed at CompIndex');
        } else {
            rmIngIndex = findId($scope.recipe.comp[rmCompIndex].ingred, inner);

            if (rmIngIndex === -1) {
                console.log('removeIngred failed at IngIndex');
            } else {
                $scope.recipe.comp[rmCompIndex].ingred.splice(rmIngIndex,1);
            }
        }

    };

    $scope.removeComp = function ( id ) {
        var rmIndex;
        
        rmIndex = findId($scope.recipe.comp, id);
        
        if (rmIndex === -1) {
            console.log ('removeComp failed');
        } else {
            $scope.recipe.comp.splice(rmIndex,1);
        }
    };

    $scope.removeDirect = function ( id ) {
        var rmIndex;

        rmIndex = findId($scope.recipe.direct.text, id);
        
        if (rmIndex === -1) {
            console.log ('removeDirect failed');
        } else {
            $scope.recipe.direct.text.splice(rmIndex,1);
        }

    };

    saveBook = function () {

        recipeFactory.saveBook()
            .then ( function (data) {
                console.log('book saved :', data);
            }, function (error) {
                console.log('saveBook failed', error);
            }
        );

    };


    var findId = function ( list, id_val) {
        var i;
        var rmIndex = -1;
        for (i=0;i<list.length;i++) {
            if (list[i].id === id_val) {
                rmIndex = i;
                break;
            }
        }
        return rmIndex;
    };
     
}]);


recipeController.controller("RecipeCatCtrl", ["$scope", "recipeFactory", 
                                     function ($scope,   recipeFactory) {

    recipeFactory.getCatData()
        .then (function(data) {
            $scope.book = {'version': data.data['version'],'book_name': data.data['name'],
                           'categories': data.data['categories']};

            
            $scope.addCat = function () {
                
                recipeFactory.addCat( $scope.new_cat )
                    .then (function (d) {
                        $scope.book.categories.push ( $scope.new_cat );
                    }, function (err) {
                        console.log('post to add CAT failed', err);
                    }
                );
            };

        }, function(error) {
            console.log('getVersion() failed : ' + error);
        }
    );
         
}]);

recipeController.controller("RecipeSrcCtrl", ["$scope", "recipeFactory", 
                                     function ($scope,   recipeFactory) {
    recipeFactory.getSrcData()
        .then (function(data) {
            $scope.book = {'version': data.data['version'],'book_name': data.data['name'],
                           'sources': data.data['sources']};

            $scope.addSrc = function () {
                
                recipeFactory.addSrc( $scope.new_src )
                    .then (function (d) {
                        $scope.book.sources.push ( $scope.new_src );
                    }, function (err) {
                        console.log('post to add SRC failed', err);
                    }
                );
            };

        }, function(error) {
            console.log('getVersion() failed : ' + error);
        }
    );

                                         
    /* Add code to modify the list of sources */
}]);

