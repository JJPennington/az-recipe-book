var azRecipeApp = angular.module('azRecipeApp', ['ngRoute','recipeController']);

azRecipeApp.config(function($httpProvider) {
    //Enable cross domain calls
    //$httpProvider.defaults.useXDomain = true;
});

azRecipeApp.config (['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
        when('/recipes', {
            templateUrl:'partials/recipe_list.html',
            controller:'RecipeListCtrl'
        }).
        when('/recipes/cat', {
            templateUrl:'partials/recipe_cat.html',
            controller:'RecipeCatCtrl'
        }).
        when('/recipes/src', {
            templateUrl:'partials/recipe_src.html',
            controller:'RecipeSrcCtrl'
        }).
        when('/recipes/add' , {
            templateUrl:'partials/recipe_change.html',
            controller:'RecipeChgCtrl'
        }).
        when('/recipes/:uid', {
            templateUrl:'partials/recipe_detail.html',
            controller:'RecipeDetailCtrl'
        }).
        when('/recipes/edit/:uid', {
            templateUrl:'partials/recipe_change.html',
            controller:'RecipeChgCtrl'
        }).
        otherwise({
            redirectTo:'/recipes'
        });
    }
]);

