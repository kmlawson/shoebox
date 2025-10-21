<?php
$title=urldecode($_GET['title']);
$latlong=urldecode($_GET['latlong']);
?>
<!DOCTYPE html>
<html>
<head><title>Locations Mentioned in the Shoebox</title>
<meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
<style type="text/css">
  html { height: 100% }
  body { height: 100%; margin: 0px; padding: 0px }
  #map_canvas { height: 100% }
</style>
<script type="text/javascript"
    src="http://maps.google.com/maps/api/js?sensor=false">
</script>
<script type="text/javascript">

  function initialize() {
    var latlng = new google.maps.LatLng(<?php echo $latlong?>);
	var myLatlng = new google.maps.LatLng(<?php echo $latlong?>);
    var myOptions = {
      zoom: 9,
      center: latlng,
      mapTypeId: google.maps.MapTypeId.TERRAIN,
	  mapTypeControlOptions: {
		style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
	}
    };
	
    var map = new google.maps.Map(document.getElementById("map_canvas"),
        myOptions);
    
	var marker = new google.maps.Marker({
	      position: myLatlng, 
	      map: map, 
	      title:"<?php echo $title?>"
	  });
  }

</script>
</head>
<body onload="initialize()">
  <div id="map_canvas" style="width:100%; height:450px;"></div>
</body>
</html>