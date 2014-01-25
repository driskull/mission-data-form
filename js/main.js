dojo.require("esri.map");
dojo.require("esri.tasks.locator");
dojo.require("esri.layers.FeatureLayer");
dojo.require("dijit.form.TextBox");
dojo.require("dijit.form.DateTextBox");
dojo.require("dojo.parser");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dijit.form.ComboBox");
dojo.require("dijit.form.TextBox");
dojo.require("dijit.form.Button");

var featureLayer, map, locator;
var locatorURL = "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";

function init() {
    locator = new esri.tasks.Locator(locatorURL);

    esriConfig.defaults.io.proxyUrl = "/proxy/proxy.ashx";
    map = new esri.Map("map", {
        "center": [-98, 40],
        "zoom": 4
    });
    dojo.connect(map, "onLoad", function () {
        //after map loads, connect to listen to mouse move & drag events
        dojo.connect(map, "onMouseMove", showCoordinates);
        dojo.connect(dijit.byId("txtAddress"), "onKeyPress", function (key) {
            console.log(key);
            if (key.keyCode == 13 && dojo.byId('txtAddress').value != "") {
                doAddressSearchSL(dojo.byId('txtAddress').value);
            }
        });
        dojo.connect(map, "onClick", function (evt) {
            console.log(evt);
            map.graphics.clear();
            map.graphics.add(new esri.Graphic(evt.mapPoint, new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CROSS, 25,
                new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                    new dojo.Color([255, 0, 0]), 4))));
            dijit.byId("latitudeClick").set("value", esri.geometry.webMercatorToGeographic(evt.mapPoint).y);
            dijit.byId("longitudeClick").set("value", esri.geometry.webMercatorToGeographic(evt.mapPoint).x);
        });
        //dojo.connect(map, "onMouseDrag", showCoordinates);
    });

    var tiledMapServiceLayer = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer");

    featureLayer = new esri.layers.FeatureLayer("http://services.arcgis.com/DO4gTjwJVIJ7O9Ca/ArcGIS/rest/services/CERT_MembershipMap_v1/FeatureServer/0", {
        outFields: ["*"],
        visible: false
    });

    map.addLayers([tiledMapServiceLayer, featureLayer]);
}

function showCoordinates(evt) {
    //get mapPoint from event
    //The map is in web mercator - modify the map point to display the results in geographic
    var mp = esri.geometry.webMercatorToGeographic(evt.mapPoint);
    //display mouse coordinates
    //dojo.byId("info").innerHTML = mp.x + ", " + mp.y;
    dijit.byId("latitude").set("value", mp.y);
    dijit.byId("longitude").set("value", mp.x);
}

function doAddressSearchSL(theAddress) { //do single line address search
    var address = {
        "SingleLine": theAddress
    };
    locator.outSpatialReference = map.spatialReference;
    var options = {
        address: address,
        outFields: ["*"]
    }
    locator.addressToLocations(options, function (candidates) {
        var evtObj = {};
        if (candidates.length > 0) {
            evtObj.mapPoint = candidates[0].location;
            evtObj.screenPoint = esri.geometry.toScreenPoint(map.extent, map.width, map.height, evtObj.mapPoint);
            //doIdentify(evtObj);
            map.graphics.clear();
            map.graphics.add(new esri.Graphic(evtObj.mapPoint, new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CROSS, 25,
                new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                    new dojo.Color([255, 0, 0]), 4))));
            dijit.byId("latitudeClick").set("value", esri.geometry.webMercatorToGeographic(evtObj.mapPoint).y);
            dijit.byId("longitudeClick").set("value", esri.geometry.webMercatorToGeographic(evtObj.mapPoint).x);
            map.centerAndZoom(evtObj.mapPoint, 13);
        } else {
            alert('Unable to locate the address.  Please try again.');
        }
    }, function (err) {
        console.log(err);
    });
}


function submitForm() {
    console.log("submitting form");
    console.log(dojo.byId("Title"));
    var f = dojo.byId("form1");
    var s = {};
    for (var i = 0; i < f.elements.length; i++) {
        var elem = f.elements[i];
        if (elem.name == "button") {
            continue;
        }
        if (elem.type == "radio" && !elem.checked) {
            continue;
        }
        //s += elem.name + ": " + elem.value + "\n";
        var elemName = elem.name;
        s[elemName] = elem.value;
    }
    var attributes = {};
    attributes.FirstName = s.FirstName;
    attributes.LastName = s.LastName;
    attributes.CERTTeam = s.CERT_Team;
    attributes.Address = s.Address;
    attributes.City = s.City;
    attributes.State = s.State;
    attributes.Zip = s.Zip;
    attributes.CERTTraining = s.CERT_Training;
    attributes.YearCert = s.Year_Cert;

    newPoint = new esri.Graphic(map.graphics.graphics[0].geometry, new esri.symbol.SimpleMarkerSymbol(), attributes);
    console.log(newPoint);
    featureLayer.applyEdits([newPoint], null, null, function (adds, updates, deletes) {
        if (adds[0].success) {
            console.log(adds[0].objectId);
            dojo.byId("output").innerHTML += "successfully created record: " + adds[0].objectId + "<br/>";
        } else {
            alert("There was an error creating this record: " + adds[0].error.message);
        }
        /*if (dojo.byId('File1').files.length > 0)
				featureLayer.addAttachment(adds[0].objectId, dojo.byId("ffile1"), function(result){console.log(result);}, function(err){console.log(err);});
				dojo.byId("output").innerHTML += "adding photo1...<br/>"
			if (dojo.byId('File2').files.length > 0)
				featureLayer.addAttachment(adds[0].objectId, dojo.byId("ffile2"), function(result){console.log(result);}, function(err){console.log(err);});
				dojo.byId("output").innerHTML += "adding photo2...<br/>"*/
    }, function (err) {
        console.log(err);
    });

}

dojo.addOnLoad(init);