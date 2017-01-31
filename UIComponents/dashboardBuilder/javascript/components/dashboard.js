angular.module('DashboardBuilder').service(
  "scriptrService",
  function(httpClient) {
    this.saveScript = function(data) {
      return httpClient.post(
        "UIComponents/dashboardBuilder/backend/api/saveDashboard", data)
    }
});

angular
  .module('DashboardBuilder')
  .component(
  'dashboard',
  {
    bindings : {
    },
    templateUrl: '/UIComponents/dashboardBuilder/javascript/components/dashboard.html',
    controller: function($scope, $timeout, config, $uibModal, scriptrService) {
      
      this.$onInit = function() {
        
        this.transport = angular.copy(config.transport);
        
        this.slickConfig = {
            enabled: true,
            autoplay: true,
            draggable: false,
            autoplaySpeed: 3000,
            method: {},
            event: {
                beforeChange: function (event, slick, currentSlide, nextSlide) {
                },
                afterChange: function (event, slick, currentSlide, nextSlide) {
                }
            }
        };
        
        //Gidster Wall Options
        this.gridsterOptions = {
          minRows: 2, // the minimum height of the grid, in rows
          maxRows: 100,
          columns: 6, // the width of the grid, in columns
          colWidth: 'auto', // can be an integer or 'auto'.  'auto' uses the pixel width of the element divided by 'columns'
          rowHeight: 'match', // can be an integer or 'match'.  Match uses the colWidth, giving you square widgets.
          margins: [10, 10], // the pixel distance between each widget
          defaultSizeX: 2, // the default width of a gridster item, if not specifed
          defaultSizeY: 1, // the default height of a gridster item, if not specified
          mobileBreakPoint: 600, // if the screen is not wider that this, remove the grid layout and stack the items
          resizable: {
            enabled: true,
            start: function(event, uiWidget, $element) {}, // optional callback fired when resize is started,
            resize: function(event, uiWidget, $element) {}, // optional callback fired when item is resized,
            stop: function(event, uiWidget, $element) {
              console.log("End resize:",event, uiWidget, $element);
              $scope.$broadcast("resize_widget", {wdg: uiWidget, element: $element})
            } //optional callback fired when item is finished resizing
          },
          draggable: {
            enabled: true, // whether dragging items is supported
            handle: '.my-class', // optional selector for resize handle
            start: function(event, uiWidget, $element) {}, // optional callback fired when drag is started,
            drag: function(event, uiWidget, $element) {}, // optional callback fired when item is moved,
            stop: function(event, uiWidget, $element) {
              console.log("End drag", event, uiWidget, $element);
              $scope.$broadcast("drag_widget", {wdg: uiWidget, element: $element})
            } // optional callback fired when item is finished dragging
          }
        };

        this.dashboard = { widgets: [] };
        
        this.widgetsConfig = config.widgets; 
        this.dataLoaded = true;
      };
      
      this.clear = function() {
			this.dashboard.widgets = [];
		};

      this.addWidget = function(wdg) {
          this.dashboard.widgets.push({
            "name": "New Widget",
            "sizeX": (wdg.box && wdg.box.sizeX) ? wdg.box.sizeX : 3,
            "sizeY": (wdg.box && wdg.box.sizeY) ? wdg.box.sizeY : 2,
            "label": wdg.label,
            "type": wdg.class,
            "options": wdg.defaults,
            "schema": wdg.schema,
            "form": wdg.form
          });
      };
      
      this.setTransportSettings = function() {
        var self = this;
        var modalInstance = $uibModal.open({
              animation: true,
              component: 'modalComponent',
       		  size: 'lg',
              resolve: {
                widget: function () {
                  return {
                    "options": self.transport.defaults,
                    "schema": self.transport.schema,
                    "form": self.transport.form};
                }
              }
            });
            modalInstance.result.then(function (transportModel) {
              console.log("modal-component transport settings data :", transportModel ,"submitted at: " + new Date());
              self.transport.defaults = angular.copy(transportModel);
            }, function () {
              console.log('modal-component transport settings dismissed at: ' + new Date());
            });
      };
      
      this.saveDashboard = function() {
        var data = {};
        data["items"] = angular.copy(this.dashboard.widgets);
        data["transport"] = angular.copy(this.transport.defaults)
        var template = this.unsafe_tags(document.querySelector('#handlebar-template').innerHTML);
        var unescapedHtml = Handlebars.compile(template)(data);
        var scriptData = {}
        scriptData["content"] = unescapedHtml;
        scriptrService.saveScript(scriptData).then(
		                     function(data, response) {
			                     console.log("resolve", data)
		                     }, function(err) {
			                     console.log("reject", err);
		                     });
        //Save data to scriptr
        console.log();        
      }
      
     this.safe_tags= function(str) {
	    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') ;
	};
	
	this.unsafe_tags= function(str) {
		 return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g,">").replace(/&quot;/g,"\"")
	};
    }
  });
angular
  .module('DashboardBuilder').component(
  'box',
  {
    require: {
      parent: '^^dashboard'
    },
    bindings : {
      "widget": "<"
    },
    templateUrl: '/UIComponents/dashboardBuilder/javascript/components/box.html',
    controller: function($scope, $compile, $element, $uibModal) {
     
      this.remove = function(widget) {
        this.parent.dashboard.widgets.splice(this.parent.dashboard.widgets.indexOf(widget), 1);
      };
      
      this.$onInit =  function() {
        var self = this;
        if(this.widget) {
          this.addWidget(this.widget)
        }

        $scope.$on("resize_widget", function(event, data) {
          console.log("Widget resize", event, data);
          $(window).trigger('resize');
        });
        
         $scope.$on("drag_widget", function(event, data) {
		  console.log("Widget dragged", event, data);
          $(window).trigger('resize');
        });
        
        /**
        $scope.$on("update_widget", function(event, data) {
          console.log("Widget update", event, data);
          self.updateWidget(event, data)
        })**/
      };
      
      this.openSettings = function() {
        var self = this;
        var modalInstance = $uibModal.open({
              animation: true,
              component: 'modalComponent',
       		  size: 'lg',
          	  scope: $scope,
              resolve: {
                widget: function () {
                  return self.widget;
                }
              }
            });
            modalInstance.result.then(function (wdgModel) {
               self.updateWidget(wdgModel)
            }, function () {
               $log.info('modal-component for widget update dismissed at: ' + new Date());
            });
      };
      
      this.addWidget = function(widget) {
        var self = this;
        this.chart = angular.element(document.createElement(widget.type));
        
        angular.forEach(widget.options, function(value, key) {
          self.chart.attr(key, value);
        }, this);
        
        var el = $compile( this.chart )( $scope );
        
        angular.element($element.find(".box-content")).append( el );
        
        $scope.$watch('widget', function() {
          $compile( self.chart )( $scope );
        }, true)
      };
      
      this.updateWidget =  function(/**event, **/wdgModel) {
        var self = this;
        this.parent.dashboard.widgets[this.parent.dashboard.widgets.indexOf(this.widget)]["options"] = angular.copy(wdgModel);
        angular.forEach(wdgModel, function(value, key) {
          self.chart.attr(key, value);
        }, this);
        $compile( self.chart )( $scope );
      };
    }
})

// Please note that the close and dismiss bindings are from $uibModalInstance.

angular
  .module('DashboardBuilder')
  .component('modalComponent', 
  {
    bindings: {
      resolve: '<',
      close: '&',
      dismiss: '&'
    },
    templateUrl: '/UIComponents/dashboardBuilder/javascript/components/myModalContent.html',
    controller: function ($scope) {
      this.$onInit = function () {

        this.widget = this.resolve.widget;

        this.frmGlobalOptions = {
          "destroyStrategy" : "remove"
        }

        this.model = {};

        if(this.widget) {
            if(this.widget.schema) {
              this.schema =  angular.copy(this.widget.schema)
            } 
            if(this.widget.form) {
               this.form =   angular.copy(this.widget.form)
            }
             if(this.widget.options) {
              this.model =   angular.copy(this.widget.options)
             }
          }
      };

      this.onSubmit = function(form) {
        // First we broadcast an event so all fields validate themselves
        $scope.$broadcast('schemaFormValidate');
        console.log(this.model)

        // Then we check if the form is valid
        if (form.$valid) {
          //angular.extend(this.widget.options, this.model);
          this.close({$value: this.model});
          //do whatever you need to do with your data.
          //$scope.$emit('update_widget', {"model":  this.model});
          console.log("component_form_parent", this.model)
        }
      };

      this.onCancel = function (myForm) {
        this.model = angular.copy(this.widget.options);
        this.dismiss({$value: 'cancel'});
        console.log("Dissmissed")
      };


    }
});
