(function (angular) {
  'use strict';

  angular.module('esri.map').factory('esriMapUtils', function () {

    // test if a string value (i.e. directive attribute value)
    function isTrue(val) {
        return val === true || val === 'true';
    }

    // stateless utility service
    var service = {};

    // bind directive attributes to layer properties and events
    service.initLayerDirecive = function(scope, attrs, layerController, mapController) {
        var layerIndex = layerController.layerType === 'FeatureLayer' ? 0 : undefined;

        return layerController.getLayer().then(function(layer) {
            // add layer at index position so that layers can be
            // declaratively added to map in top-to-bottom order
            mapController.addLayer(layer, layerIndex);

            // Look for layerInfo related attributes. Add them to the map's layerInfos array for access in other components
            mapController.addLayerInfo({
                title: attrs.title || layer.name,
                layer: layer,
                // TODO: are these the right params to send
                hideLayers: (attrs.hideLayers) ? attrs.hideLayers.split(',') : undefined,
                defaultSymbol: (attrs.defaultSymbol) ? JSON.parse(attrs.defaultSymbol) : true
            });

            // watch the scope's visible property for changes
            // set the visibility of the feature layer
            scope.$watch('visible', function(newVal, oldVal) {
                if (newVal !== oldVal) {
                    layer.setVisibility(isTrue(newVal));
                }
            });

            // watch the scope's opacity property for changes
            // set the opacity of the feature layer
            scope.$watch('opacity', function(newVal, oldVal) {
                if (newVal !== oldVal) {
                    layer.setOpacity(Number(newVal));
                }
            });

            // call load handler (if any)
            if (attrs.load) {
                if (layer.loaded) {
                    // layer is already loaded
                    // make layer object available to caller immediately
                    scope.load()(layer);
                } else {
                    // layer is not yet loaded
                    // wait for load event, and then make layer object available
                    layer.on('load', function() {
                        scope.$apply(function() {
                            scope.load()(layer);
                        });
                    });
                }
            }

            // call updateEnd handler (if any)
            if (attrs.updateEnd) {
                layer.on('update-end', function(e) {
                    scope.$apply(function() {
                        scope.updateEnd()(e);
                    });
                });
            }

            // remove the layer from the map when the layer scope is destroyed
            scope.$on('$destroy', function() {
                mapController.removeLayer(layer);
            });

            // return the layer
            return layer;
        });

    };

    return service;
  });

})(angular);
